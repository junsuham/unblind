-- These records are served only by authenticated server routes so that
-- anonymous gratitude deliveries never expose account identifiers.

revoke all on public.faith_checkins from anon, authenticated;
revoke all on public.gratitude_preferences from anon, authenticated;
revoke all on public.gratitude_entries from anon, authenticated;
