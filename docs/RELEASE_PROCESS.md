# Unblind release process

## Environments

Use three isolated environments. Never point preview builds at production data.

| Environment | Web | Supabase | EAS channel | Purpose |
| --- | --- | --- | --- | --- |
| development | local or development URL | development project | development | implementation |
| preview | Vercel preview | staging project | preview | iPhone acceptance testing |
| production | production domain | production project | production | real users |

Configure Vercel variables separately for Preview and Production. Configure the
same public Supabase URL/key and web API URL in the matching EAS environment.
Service-role keys must exist only in Vercel server environments.

## Required quality gate

1. Create a feature branch and pull request.
2. Wait for the `Quality gate` GitHub Action to pass.
3. Apply new migrations to staging and run iPhone acceptance testing.
4. Merge to `main`; verify `/api/health` and the administrator health page.
5. Apply the migration to production before releasing mobile code that depends on it.

Enable GitHub branch protection for `main` and require the `verify` job.

## Mobile rollout

1. Publish to the preview channel and test login, profile, posting, reporting,
   administrator exit, poor-network recovery, notifications, and account deletion.
2. Promote the exact tested update to production. Start with internal testers.
3. Watch fatal/error events for at least 30 minutes before widening the rollout.
4. If the error rate increases, republish the previous known-good update to the
   production channel. Native dependency changes require a new binary instead of OTA.

## TestFlight acceptance checklist

- Fresh install and existing-session upgrade
- Google login cancel/success and session restoration
- Administrator screen opens and returns without another Google login
- Post list pagination, search, create, comment, reaction, report, and block
- Airplane mode, slow network, server 5xx, and recovery
- Larger text, VoiceOver labels, dark mode, and reduced motion
- Account logout and deletion
- Push permission denial/approval and deep-link destination
- OTA update download and rollback

