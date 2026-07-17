This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication setup

Set `NEXT_PUBLIC_SITE_URL` to the public origin used by the deployed app (for
example, `https://app.example.com`). Add
`<NEXT_PUBLIC_SITE_URL>/auth/callback` to the Supabase redirect allow list.

Enable the **Google** and **Kakao** providers under Supabase Authentication >
Sign In / Providers. Register this Supabase callback URL with both providers:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Google must provide the email scope. For Kakao, configure `account_email` as a
consent item; it requires a Kakao Biz App. After the first social sign-in, the
account appears in the admin participant page as pending. An administrator must
approve it, which creates an active entry in `allowed_users`, before the user
can access the community.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Release safety

- Copy `.env.example` to a private environment file and run `npm run env:check`.
- Run `npm run check` and `npm run check:mobile` before release.
- Apply Supabase migrations in timestamp order.
- Keep preview and production Supabase/EAS/Vercel environments isolated.
- Follow `docs/RELEASE_PROCESS.md` for iPhone, OTA, rollback, and TestFlight checks.
