-- Keep destructive multi-table operations atomic.

create or replace function public.replace_top100_tracks(p_tracks jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_tracks is null or jsonb_typeof(p_tracks) <> 'array' then
    raise exception 'tracks must be a JSON array';
  end if;

  if jsonb_array_length(p_tracks) < 1
    or jsonb_array_length(p_tracks) > 100 then
    raise exception 'tracks must be an array containing 1 to 100 items';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_tracks) as item(value)
    where btrim(coalesce(value ->> 'youtube_id', '')) = ''
      or btrim(coalesce(value ->> 'title', '')) = ''
      or btrim(coalesce(value ->> 'artist', '')) = ''
      or char_length(value ->> 'youtube_id') > 80
      or char_length(value ->> 'title') > 200
      or char_length(value ->> 'artist') > 120
  ) then
    raise exception 'invalid track data';
  end if;

  select count(*) into v_count
  from jsonb_array_elements(p_tracks);

  if (
    select count(distinct value ->> 'youtube_id')
    from jsonb_array_elements(p_tracks) as item(value)
  ) <> v_count then
    raise exception 'duplicate youtube ids are not allowed';
  end if;

  delete from public.top100_tracks;

  insert into public.top100_tracks
    (rank, youtube_id, title, artist, is_active, updated_at)
  select
    ordinality::integer,
    btrim(value ->> 'youtube_id'),
    btrim(value ->> 'title'),
    btrim(value ->> 'artist'),
    true,
    now()
  from jsonb_array_elements(p_tracks) with ordinality as item(value, ordinality);

  return v_count;
end;
$$;

create or replace function public.anonymize_account_data(
  p_user_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or btrim(coalesce(p_email, '')) = '' then
    raise exception 'user id and email are required';
  end if;

  update public.posts
  set author_user_id = null
  where author_user_id = p_user_id;

  update public.comments
  set author_user_id = null
  where author_user_id = p_user_id;

  update public.reports
  set reporter_user_id = null, reporter_email = null
  where reporter_user_id = p_user_id;

  delete from public.post_author_links where user_id = p_user_id;
  delete from public.comment_author_links where user_id = p_user_id;
  delete from public.reactions where actor_key = p_user_id::text;
  delete from public.allowed_users where lower(email) = lower(btrim(p_email));
end;
$$;

revoke all on function public.replace_top100_tracks(jsonb) from public;
revoke all on function public.anonymize_account_data(uuid, text) from public;
grant execute on function public.replace_top100_tracks(jsonb) to service_role;
grant execute on function public.anonymize_account_data(uuid, text) to service_role;
