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

## Content & admin dashboard

All site copy lives in Supabase (project **KalcerJam**) and is edited at **`/admin`**.

- `src/lib/content.ts` holds the built-in defaults. Each top-level key (settings, home, rules, …) is one row in the `kj_content` table. A saved row is merged over its default, so new fields added in code show up automatically.
- Saving in `/admin` refreshes the live site right away. "Reset to default" deletes the section's row.
- Spectator RSVPs are saved to `kj_rsvp` (only while **Event settings → Rsvp open** is on) and can be viewed or exported as CSV in `/admin`.
- Images upload to the public `kj-media` storage bucket.
- Schema and security rules: `supabase/migrations/`.

### Adding an admin

1. Supabase dashboard → Authentication → Users → **Add user** (email + password, tick "Auto confirm").
2. SQL editor: `insert into kj_admins (email) values ('someone@example.com');`
3. They sign in at `/admin`.

Turn off public sign-ups (Authentication → Sign In / Providers → "Allow new users to sign up") so only users you add can sign in.
