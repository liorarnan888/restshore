# RestShore Staging Runbook

This app now has a live Vercel staging setup on `https://restshore.com`.

## Current staging state

- Vercel team: `lior's projects`
- Vercel project: `restshore`
- Canonical staging URL: `https://restshore.com`
- Default Vercel URL: `https://restshore.vercel.app`
- Database: existing hosted PostgreSQL from `DATABASE_URL`
- Prisma schema: already synced to the hosted database
- Email: configured through the current Resend credentials in Vercel
- Production Test Center: protected by an internal password gate
- Root domain: connected to the Vercel project
- Framework preset: `Next.js`
- Node.js version: `22.x`
- Vercel Authentication wall: disabled for this project

## Product inboxes

The current public inboxes for the product are:

- `hello@restshore.com` for general product contact
- `support@restshore.com` for support, privacy, Google Calendar issues, and data requests

## What was already done

The following setup has already been completed:

- Created a Vercel project from this local folder
- Linked the local workspace to that Vercel project
- Added production environment variables in Vercel:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `AUTH_GOOGLE_ID`
  - `AUTH_GOOGLE_SECRET`
  - `NEXT_PUBLIC_APP_URL`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `TEST_CENTER_PASSWORD`
- Synced the Prisma schema against the hosted Postgres database
- Deployed the app to Vercel production
- Attached `restshore.com` to the project
- Fixed the project framework preset so the deployment serves Next.js correctly

## Smoke checks already completed

These checks already passed:

- `https://restshore.com` returns `200`
- `https://restshore.vercel.app` returns `200`
- `POST /api/intake/start` works on the live domain
- `GET /api/jobs/resume-reminders` works on the live domain

## What still needs to be done outside the repo

### Google Cloud

Update the Google OAuth app so it allows the real staging domain:

- Authorized JavaScript origin:
  - `https://restshore.com`
- Authorized redirect URI:
  - `https://restshore.com/api/auth/callback/google`

Without this, Google sign-in and Google Calendar connection will fail on the live domain.

### Resend

The app can use the current Resend credentials, but the long-term recommended setup is:

- verify a sending subdomain such as `send.restshore.com`
- move the sender to a domain you own instead of the temporary onboarding sender

## Recommended live test order

1. Open `https://restshore.com`
2. Start an intake and finish it
3. Test Google sign-in
4. Test Google Calendar creation
5. Test a daily check-in from the live domain
6. Confirm email delivery

## Live launch checklist

Use this as the plain-English preflight before any approval or launch review:

1. Confirm the public homepage, privacy page, terms page, and CBT-I support pages load without sign-in.
2. Confirm `https://restshore.com/test-center` prompts for the internal password in production, and `https://restshore.com/launch-insights` stays key-protected.
3. Confirm production env includes `TEST_CENTER_PASSWORD` and a valid `AUTH_SECRET`.
4. Confirm Google Cloud includes:
   - the exact live origin `https://restshore.com`
   - the exact live redirect URI `https://restshore.com/api/auth/callback/google`
   - the Calendar handoff scope `https://www.googleapis.com/auth/calendar.app.created`
5. Confirm Resend has a verified sender that can send to real users, not just onboarding test traffic.
6. Run the end-to-end happy path on the live domain:
   - intake
   - early email capture
   - Google sign-in
   - calendar creation
   - daily check-in
   - one follow-up update
7. Confirm the final status is understandable:
   - report delivered
   - calendar synced
   - daily log updated
   - no unresolved `failed` state

## Report card QA invariants

Treat these as required on the live domain:

- While calendar sync is building, do not show a primary CTA that invites the user to add the plan again.
- After Google disconnects, show a reconnect path and hide remove-calendar controls.
- Only offer remove-calendar when an authenticated Google session can actually execute it.
- On mobile, the not-connected report card must keep the heading and body readable without side-by-side squeeze.

## Notes for review

- The staging experience should feel public and self-serve, but internal review tools must not be exposed in production.
- If Google sign-in fails in staging, the first thing to check is the OAuth origin / redirect URI match.
- If email delivery fails in staging, the first thing to check is the verified Resend sender and domain setup.

## How to redeploy quickly from this machine

From the project folder:

```powershell
vercel deploy --prod --yes --scope liors-projects-184d19a3
```

If the deployment finishes successfully, `restshore.com` should update automatically because the custom domain is already attached to the project.

## Notes for later

- GitHub is not connected yet. Current staging is managed directly through the Vercel CLI from this local workspace.
- Before public launch, add proper Prisma migrations instead of relying only on `prisma db push`.
- Before public launch, decide on the final Resend sending domain and Google OAuth production setup.
