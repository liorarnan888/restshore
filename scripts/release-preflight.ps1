$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "RestShore release preflight" -ForegroundColor Cyan
Write-Host ""

Write-Host "1/3 Lint" -ForegroundColor Yellow
npm run lint

Write-Host ""
Write-Host "2/3 Tests" -ForegroundColor Yellow
npm run test

Write-Host ""
Write-Host "3/3 Build" -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "Preflight complete." -ForegroundColor Green
