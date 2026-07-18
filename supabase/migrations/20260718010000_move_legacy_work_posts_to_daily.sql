-- The dedicated career/work board was retired. Replace the legacy constraint,
-- move existing conversations, and keep future writes on the three app boards.
alter table public.posts
drop constraint if exists posts_board_check;

update public.posts
set board = 'daily'
where board in ('work', 'career', 'career_work', 'career/work');

alter table public.posts
add constraint posts_board_check
check (board in ('prayer', 'faith', 'daily'));
