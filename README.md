# RestShore

RestShore is a playful, CBT-I inspired web app that interviews a user about their sleep, saves progress early by email, mixes in bite-sized educational cards, and turns the intake into:

- a hosted report page
- a responsive HTML email
- a dedicated Google-calendar-style starter program

## What is implemented

- One-question-per-screen intake flow with back navigation
- Early email capture after the first three questions
- Autosave to a lightweight local JSON store in `/data`
- Resume-token support and a reminder-processing endpoint
- Lightly personalized micro-lessons based on user answers
- Rules-based 14-day sleep plan generation
- Hosted report page with delivery status and calendar preview
- Email and Google delivery adapters with preview mode when credentials are missing

## Launch readiness checklist

Before a Google production review or live staging pass, verify these in plain language:

- Public pages load without sign-in:
  - homepage
  - privacy
  - terms
  - CBT-I support pages
- Test-only pages stay hidden in production:
  - `/test-center`
  - `/launch-insights`
- Google Cloud has the exact real/staging redirect URIs and origins that the app will use.
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and the Calendar API scope are set.
- Resend is configured with a verified sender you can actually send from in production.
- The end-to-end flow works:
  - intake
  - email capture
  - Google sign-in
  - calendar creation
  - daily check-in
  - follow-up update

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
npm run lint
npm run test
npm run build
```

## Release workflow

Current release flow is local-first:

1. develop locally
2. run the release preflight
3. approve the release
4. deploy directly to Vercel production

Helpful docs:

- [RELEASE_WORKFLOW.md](C:\Users\USER\Documents\Codex%20-%20CBTi%20-%20Cal\RELEASE_WORKFLOW.md)
- [GITHUB_SETUP.md](C:\Users\USER\Documents\Codex%20-%20CBTi%20-%20Cal\GITHUB_SETUP.md)
- [STAGING_RUNBOOK.md](C:\Users\USER\Documents\Codex%20-%20-%20Cal\STAGING_RUNBOOK.md)

## Environment variables

These are optional for local development. Without them, the app uses local JSON persistence and preview delivery modes.

```bash
DATABASE_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=support@restshore.app
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

For local-only testing without your own domain, set:

```bash
RESEND_FROM_EMAIL="RestShore <onboarding@resend.dev>"
```

## Key endpoints

- `POST /api/intake/start`
- `GET /api/intake/resume/:token`
- `POST /api/intake/save`
- `POST /api/intake/email`
- `POST /api/intake/finalize`
- `POST /api/integrations/google/connect`
- `POST /api/jobs/resume-reminders`

## Notes

- The app automatically uses Prisma/Postgres when `DATABASE_URL` is set. Without it, it falls back to the local JSON store in `/data`.
- The Google handoff is fully wired with Auth.js and Calendar API calls, but it only becomes live when the Google OAuth env vars are configured.

## Production setup you need to do

1. Create a PostgreSQL database and set `DATABASE_URL`.
2. Generate a secure `AUTH_SECRET`.
3. In Google Cloud:
   - Enable the Google Calendar API.
   - Create an OAuth client for your app.
   - Add your local and production callback URLs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-domain.com/api/auth/callback/google`
   - Keep the scope narrow for the calendar handoff:
     - `https://www.googleapis.com/auth/calendar.app.created`
4. Add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
5. Set `NEXT_PUBLIC_APP_URL` to your real app URL.
6. Set `NEXT_PUBLIC_SUPPORT_EMAIL` to a real monitored inbox that matches the support contact you will expose publicly and in Google OAuth verification.
7. Configure Resend with a verified sender and set `RESEND_API_KEY` plus `RESEND_FROM_EMAIL`.
   For local testing only, you can skip the domain and use `onboarding@resend.dev`, but Resend only allows that test domain to send to the email address on your own Resend account.
8. Run:

```bash
npm run db:push
```

9. Start the app and test the full flow with a real Google account.
