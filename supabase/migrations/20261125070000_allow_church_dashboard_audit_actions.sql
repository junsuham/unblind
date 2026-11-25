-- Some deployed databases already had a six-value audit check before the
-- table was added to the checked-in schema. Keep those operations and allow
-- the two exact audit events emitted by the atomic dashboard grant RPCs.
begin;

alter table public.admin_user_actions
  drop constraint if exists admin_user_actions_action_type_check,
  add constraint admin_user_actions_action_type_check
    check (action_type in (
      'add', 'block', 'unblock', 'reset_agreement', 'remove', 'update_memo',
      'church_dashboard_grant', 'church_dashboard_revoke'
    ));

commit;
