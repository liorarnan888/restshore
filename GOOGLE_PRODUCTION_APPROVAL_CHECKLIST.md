# Google Production Approval Checklist

This checklist is for opening RestShore to real users through Google OAuth and Google Calendar, not only test users.

## What RestShore currently asks from Google

The app currently uses:

- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/calendar.app.created`

The calendar scope is intentionally limited to calendars created by the app. It is narrower than full-calendar access and should remain the default production scope.

## What must be true before submission

### 1. Use a production Google Cloud project

Set aside a Google Cloud project for public production use.

Do not reuse a temporary testing setup as the final public app.

### 2. Configure the OAuth app for public users

In Google Auth Platform:

- Audience: `External`
- Publishing status: move from `Testing` to `In production`

### 3. Add the production URLs

The Google OAuth app must include:

- Authorized JavaScript origin:
  - `https://restshore.com`
- Authorized redirect URI:
  - `https://restshore.com/api/auth/callback/google`

For the public production client, keep only production-owned URLs where possible.

Do not rely on:

- `localhost`
- temporary Vercel preview URLs
- `restshore.vercel.app`

Those can still exist in a separate development or staging Google project, but the public production client should stay clean and domain-specific.

### 4. Verify the domain in Google Search Console

Google typically expects verified ownership of the domain used for:

- home page
- privacy policy
- terms
- redirect URI domain

Use `restshore.com` as the verified domain.

### 5. Fill the OAuth consent screen completely

Have these ready:

- App name: `RestShore`
- User support email: a real monitored mailbox you control, ideally on `restshore.com`
- Developer contact email: a real monitored mailbox you control
- Home page: `https://restshore.com`
- Privacy policy: `https://restshore.com/privacy`
- Terms of service: `https://restshore.com/terms`

Recommended:

- keep branding, name, and logo stable while under review

### 6. Declare the exact scopes used

Only declare the scopes RestShore really uses.

Current intended set:

- `openid`
- `email`
- `profile`
- `calendar.app.created`

Do not ask for broader calendar access unless the product truly needs it.

### 7. Prepare the reviewer explanation

Google reviewers will need a plain explanation of why calendar access is necessary.

Recommended framing:

- RestShore turns a user-completed sleep plan into a dedicated Google Calendar created by the app
- the app only manages that dedicated calendar
- the app does not need access to the user’s primary calendar
- the calendar contains scheduled behavioral coaching events and follow-up sleep check-ins

### 8. Prepare a short demo video

Record one clean walkthrough that shows:

1. opening `restshore.com`
2. completing the intake
3. signing in with Google
4. granting calendar permission
5. the app creating a dedicated RestShore calendar
6. the resulting calendar events
7. a daily sleep check-in
8. the app updating the prior sleep event and future guidance

### 9. Make sure the public site explains the product clearly

Reviewers and users should both be able to see:

- what RestShore is
- that it is CBT-I inspired behavioral support
- that it is not medical care or emergency support
- what data is collected
- what Google access is used for
- where privacy and terms live

## What still happens outside the codebase

These are dashboard tasks, not code tasks:

- Google Cloud OAuth app setup
- Google Search Console domain verification
- support/developer email setup
- final scope declaration and submission
- demo video upload if Google requests it

## What should stay true in the product

- Keep Google sign-in separate from calendar permission if possible
- Keep the dedicated-calendar-only promise true in the UI and in the code
- Keep the public messaging aligned with the actual product behavior
- Do not silently expand Google scopes later without revisiting this checklist
