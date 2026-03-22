# RestShore Public Beta Launch

Last updated: March 20, 2026

## Goal
- Ship `RestShore` as a free public beta on Vercel.
- Keep billing out of v1.
- Use organic acquisition only for the first cohort.
- Learn from funnel analytics, qualitative feedback, and first sleep-log behavior.

## Product surfaces in scope
- Homepage and intake
- Report page
- Google Calendar connect flow
- Daily sleep log
- Privacy and Terms
- SEO pages
- Launch insights review page

## Required environment variables
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`
- `LAUNCH_INSIGHTS_KEY`
- `DATABASE_URL` if using Postgres instead of the local JSON fallback

## Deployment checklist
1. Set the production environment variables in Vercel.
2. Confirm Google OAuth redirect URIs point to the production domain.
3. Confirm Resend sender identity is verified for the production domain or chosen sender.
4. Deploy from the default branch to Vercel.
5. Confirm `vercel.json` cron jobs are detected.
6. Open `/launch-insights?key=YOUR_KEY` and confirm the page loads.
7. Run the production smoke test below.

## Production smoke test
1. Open the homepage and confirm the public brand is `RestShore`.
2. Start a fresh intake and verify `intake_started` appears in launch insights.
3. Capture an email and verify `email_captured`.
4. Finish the intake and confirm the report loads with RestShore copy.
5. Connect Google Calendar or preview mode and verify `calendar_connected`.
6. Open the first daily sleep log and submit it.
7. Confirm `first_checkin_submitted` and `feedback_submitted` appear after use.
8. Confirm Privacy and Terms are reachable from the homepage and report.
9. Confirm no public page mentions billing, pricing, upgrade, or payment.

## Cron behavior
- `resume-reminders` runs daily at `13:00 UTC`
- `beta-feedback-followups` runs daily at `13:30 UTC`

These daily schedules are conservative and compatible with small beta operations. If the Vercel plan allows higher cadence later, move them closer to hourly.

## What to watch in week 1
- Homepage page views
- Intake starts
- Email capture rate
- Report generation rate
- Calendar connect rate
- First check-in rate
- Qualitative feedback themes

## First acquisition loop
1. Invite a small cohort from personal network and warm intros.
2. Post one short launch note in relevant, permission-based communities.
3. Share the SEO pages in contexts where explanation is needed before product usage.
4. Ask every early user for one sentence on what felt useful and one sentence on what felt confusing.
5. Turn the clearest feedback into copy changes before broadening distribution.

## Community and outreach ideas
- Sleep-focused founder circles
- Health-tech and behavior-design friends
- Communities where CBT-I, insomnia routines, and sleep diaries are discussed without hard selling
- Personal outreach to people who already describe trouble falling asleep, schedule drift, or rough wake anchors

## Messaging guardrails
- Use `CBT-I inspired` or `behavioral sleep coaching`
- Avoid diagnosis, cure, and guaranteed-outcome language
- Keep the framing consumer-first and non-medical
- Do not introduce billing language during the beta

## Operating rhythm
- Review launch insights and qualitative feedback at least weekly
- Fix the biggest funnel break before adding new acquisition channels
- Keep the beta free until the onboarding, report, and first-check-in loop feel trustworthy
