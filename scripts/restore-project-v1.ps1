# PiacPro — visszaállítás project v1 állapotra (project-v1 tag)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (git rev-parse project-v1 2>$null)) {
  Write-Error "A project-v1 tag nem található. Futtasd: git fetch --tags"
}

Write-Host "Visszaállítás: project-v1 (PiacPro project v1)..." -ForegroundColor Cyan
git restore --source=project-v1 --staged --worktree .

Write-Host "Kész. Ellenőrzés: git status" -ForegroundColor Green
Write-Host "Ha teljes HEAD visszaállítás kell: git reset --hard project-v1" -ForegroundColor Yellow
