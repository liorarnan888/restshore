# Release Workflow

This is the current working release flow for RestShore.

## Current model

- Development happens locally
- The live site is `https://restshore.com`
- Deployments currently go directly from this machine to Vercel
- GitHub is not connected yet

## What “approve the release” means

Right now, approval is simple:

- you review the local result
- you explicitly say that the change is approved for release
- then the production deploy is triggered

## Fast preflight before a release

Run:

```powershell
npm run lint
npm run test
npm run build
```

Or use the helper script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-preflight.ps1
```

## Production deploy

Run:

```powershell
vercel deploy --prod --yes --scope liors-projects-184d19a3
```

Or use the helper script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-prod.ps1
```

## What to verify after deploy

Check:

- `https://restshore.com`
- `https://restshore.com/privacy`
- `https://restshore.com/terms`
- `https://restshore.com/support`

Then test the live product flow that is relevant to the release:

- intake
- report
- Google sign-in
- calendar creation
- daily check-in

## Notes

- This workflow is intentionally simple for now.
- Once GitHub is connected, we can move to a cleaner flow with version history, push-based deploys, and optional preview environments.
