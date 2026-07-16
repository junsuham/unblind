alter table public.posts
add column if not exists mentions jsonb not null default '[]'::jsonb;

alter table public.comments
add column if not exists mentions jsonb not null default '[]'::jsonb;

create or replace function public.enforce_content_safety()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  combined_text text;
  matched_word text;
  recent_count integer;
begin
  combined_text := lower(
    coalesce(to_jsonb(new) ->> 'title', '') || ' ' ||
    coalesce(to_jsonb(new) ->> 'content', '')
  );

  select word into matched_word
  from public.banned_words
  where is_active = true and combined_text like '%' || lower(word) || '%'
  limit 1;

  if matched_word is not null then
    raise exception using
      errcode = 'P0001',
      message = '운영 정책상 사용할 수 없는 표현이 포함되어 있습니다.';
  end if;

  if tg_table_name = 'posts' then
    select count(*) into recent_count from public.posts
    where author_user_id = new.author_user_id
      and created_at > now() - interval '1 hour';

    if recent_count >= 5 then
      raise exception using errcode = 'P0001',
        message = '한 시간에 게시글은 최대 5개까지 작성할 수 있습니다.';
    end if;

    if exists (
      select 1 from public.posts
      where author_user_id = new.author_user_id
        and created_at > now() - interval '60 seconds'
    ) then
      raise exception using errcode = 'P0001',
        message = '게시글을 연속으로 작성할 수 없습니다. 잠시 후 다시 시도해주세요.';
    end if;
  else
    select count(*) into recent_count from public.comments
    where author_user_id = new.author_user_id
      and created_at > now() - interval '1 hour';

    if recent_count >= 30 then
      raise exception using errcode = 'P0001',
        message = '한 시간에 댓글은 최대 30개까지 작성할 수 있습니다.';
    end if;

    if exists (
      select 1 from public.comments
      where author_user_id = new.author_user_id
        and created_at > now() - interval '10 seconds'
    ) then
      raise exception using errcode = 'P0001',
        message = '댓글을 연속으로 작성할 수 없습니다. 잠시 후 다시 시도해주세요.';
    end if;
  end if;

  return new;
end;
$$;
