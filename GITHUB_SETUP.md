# GitHub Setup For RestShore

This repo already has local Git and is linked to Vercel, but it does not yet have a GitHub remote.

## Recommended repo

- Owner: your personal GitHub account
- Repository name: `restshore`
- Visibility: `private` for now

## What still needs to happen once the GitHub repo exists

From the project root:

```powershell
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

Example remote URL formats:

```text
https://github.com/<your-username>/restshore.git
git@github.com:<your-username>/restshore.git
```

## Recommended next step after the first push

Connect the GitHub repo to the existing Vercel project later, once you are happy with the local-first workflow.

That will let Vercel build from GitHub instead of only from your local machine.

## Current local workflow until GitHub is connected

1. Make changes locally
2. Run the release preflight
3. Approve the release
4. Deploy to Vercel from this machine

See:

- [RELEASE_WORKFLOW.md](C:\Users\USER\Documents\Codex%20-%20CBTi%20-%20Cal\RELEASE_WORKFLOW.md)
- [STAGING_RUNBOOK.md](C:\Users\USER\Documents\Codex%20-%20CBTi%20-%20Cal\STAGING_RUNBOOK.md)
