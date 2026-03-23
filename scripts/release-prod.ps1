param(
  [switch]$SkipChecks
)

$ErrorActionPreference = "Stop"

if (-not $SkipChecks) {
  Write-Host ""
  Write-Host "Running release preflight first..." -ForegroundColor Cyan
  powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\\release-preflight.ps1"
}

Write-Host ""
Write-Host "Deploying RestShore to production..." -ForegroundColor Cyan
vercel deploy --prod --yes --scope liors-projects-184d19a3

Write-Host ""
Write-Host "Production deploy command finished." -ForegroundColor Green
