begin;

create or replace function public.assign_bible_profile_nickname()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  names constant text[] := array[
    '노아','아브라함','사라','이삭','리브가','요셉','모세','미리암','여호수아','갈렙','룻',
    '사무엘','다윗','요나단','엘리야','엘리사','에스더','모르드개','다니엘','느헤미야',
    '이사야','예레미야','마리아','베드로','요한','바울','바나바','디모데','루디아',
    '브리스길라','아굴라','스데반','빌립','드보라','한나','나오미','아비가일','훌다',
    '요게벳','십보라','엘리사벳','막달라 마리아','마르다','뵈뵈','유니게','로이스','안나',
    '브살렐','아볼로','에스라','스가랴','말라기','미가','하박국','아모스','호세아','요엘',
    '학개','이사갈','아삽','에브라임','예드두둔','실라','디도','누가','마가','안드레',
    '야고보','나사로','시므온'
  ];
  current_name text;
  wanted_name integer;
  wanted_letter integer;
  seed bigint := pg_catalog.hashtextextended(new.user_id::text, 1832) & 9223372036854775807;
  pool_size integer := cardinality(names) * 26;
  candidate text;
begin
  if tg_op = 'UPDATE' then
    current_name := old.nickname;
  else
    -- Upserts use the same stored identity even before the conflict branch.
    select p.nickname into current_name from public.user_profiles p where p.user_id = new.user_id;
  end if;

  if current_name ~ '^[가-힣]+( [가-힣]+)*[A-Z]$' then
    new.nickname := current_name;
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(77513098);
  wanted_name := coalesce(
    array_position(names, regexp_replace(current_name, '-[A-Z]+$', '')),
    (seed % cardinality(names))::integer + 1
  );
  wanted_letter := coalesce(
    ascii(substring(current_name from '-([A-Z])')) - 65,
    ((seed / cardinality(names)) % 26)::integer
  );

  for offset_index in 0..pool_size - 1 loop
    candidate := names[((wanted_name - 1 + offset_index / 26) % cardinality(names)) + 1]
      || chr(65 + (wanted_letter + offset_index) % 26);
    if not exists (select 1 from public.user_profiles p where p.nickname = candidate) then
      new.nickname := candidate;
      return new;
    end if;
  end loop;
  raise exception 'No single-letter Bible profile names remain' using errcode = '23514';
end;
$$;

revoke all on function public.assign_bible_profile_nickname() from public, anon, authenticated;

drop trigger if exists assign_bible_profile_nickname on public.user_profiles;
create trigger assign_bible_profile_nickname
before insert or update of nickname on public.user_profiles
for each row execute function public.assign_bible_profile_nickname();

update public.user_profiles
set nickname = nickname
where nickname !~ '^[가-힣]+( [가-힣]+)*[A-Z]$';

alter table public.user_profiles add constraint user_profiles_single_letter_nickname
check (nickname ~ '^[가-힣]+( [가-힣]+)*[A-Z]$');

commit;
