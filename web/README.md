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

## Accounts, roles & competition (`/dashboard`)

Everyone signs in at **`/dashboard`** with an email link (or Google, once enabled). What they see depends on their role in `kj_profiles.role`:

| Role | Dashboard |
| --- | --- |
| **spectator** (default) | Free QR pass (RSVP), schedule, live link. Can switch to dancer. |
| **participant** | Dancer ID (KJ-0042), profile, category entry (eligibility checked), 2vs2 partner invites, payment proof, QR pass once paid, own battles, own prelim scores once published. |
| **judge** | Live Mind/Body/Soul score sheet for prelim heats; A / B / extra-round vote for bracket battles and 7 to Smoke exchanges. |
| **mc** | Run sheet: on stage, up next, results to announce, champions, boards. Read only. |
| **team** | Competition runner (draw heats → ranking → bracket or 7 to Smoke, stage control, vote tallies, walkovers, undo), check-in desk (camera QR scan), payment verification, dancer roster (transfers, invited dancers, CSV), audit log. |

Admins (`kj_admins`) get the team console plus a **Roles** tab and a "View as" switcher. Only admins can grant judge / mc / team.
An admin can also judge: in the Judge view press **Make me a judge** (the team console stays available through "View as").

**Rehearsal:** in Competition, an admin can **Load demo dancers** (names start with "Demo ·") to try the whole flow — draw heats, judge on phones, build the bracket, run 7 to Smoke — then **Clear demo data**. The team can also add walk-in dancers by hand in the Dancers tab; they count as paid.

Participant lists sync live (Realtime on `kj_entries`, migration `20261115000000_kalcerjam_sync.sql`) to the team roster, the judges' Participants tab and the public Categories page.

Rules live in the database (`supabase/migrations/20261114000000_kalcerjam_competition.sql`), so they hold even if someone calls the API directly: eligibility (Bgirl, Kids U-12 with guardian, Over 35, by 26 Jul 2027), scoring only while a category is in prelims, voting only on the live battle, scores/votes hidden from the public, dancers see their own scores only after "Dancers can see their scores" is on.
The bracket / 7 to Smoke logic is in `src/lib/tournament.ts` with tests (`npm test`).

### Going live checklist

1. Run the migration in the Supabase SQL editor (or `supabase db push`).
2. Authentication → Sign In / Providers: **allow new sign-ups** (dancers create their own accounts) and keep email enabled. Admin access is still limited by `kj_admins`.
3. Authentication → URL configuration: add `https://kalcerjam.site/dashboard` (and preview URLs) to redirect URLs.
4. Optional: enable the Google provider, then switch on **Event settings → Google login** in `/admin`.
5. `/admin` → Register & RSVP → **Payment info**: real bank / QRIS / PayPal details.
6. On 1 April: in `/dashboard` → Competition, switch **Registration open** on per category.

### Super admins & accounts

**Who can do what:** admins run the event and competition (Run show, categories, check-in, payments, roles). Only super admins can edit the website at `/admin` (content and media; enforced by row-level security, migration `20261117000000_kalcerjam_super_edits_site.sql`).

Super admins (`kj_admins.super = true`, set for info@mjfird.com) also get a **★ Accounts** tab in `/dashboard`: create a login with email + password and a role (judge, MC, team, dancer, spectator), make someone an admin or super admin, reset passwords, change emails, block, or delete accounts.

These actions run in the Supabase Edge Function `kj-admin-users` (`supabase/functions/kj-admin-users`), which uses the service-role key on Supabase's side and refuses anyone who isn't a super admin. Deploy changes with `supabase functions deploy kj-admin-users --no-verify-jwt` (the function checks the caller itself).

People with a password sign in at `/dashboard` → **Password**; everyone else can keep using the email link.
