<#
.SYNOPSIS
  Deploy-gate + auto-rollback wrapper for app.donatalk.com (KR1-4, Charter Sec 4).

  Enforces the four Deploy Gates before shipping to Vercel production, promotes
  the build, then runs the synthetic probe (check-site.ps1). If a critical path
  breaks post-deploy it auto-rolls-back to the last known-good production
  deployment and writes ops/logs/ALERT-deploy-*. A broken prod state is never
  left standing.

  This is the safety net around an *explicit* `vercel --prod` promotion. The
  script is read-only until every gate passes.

.PARAMETER SkipDeploy
  Run the gates + probe against current production WITHOUT deploying (dry-run /
  CI-style check). Useful to prove the tree is shippable before a push to main.

.EXAMPLE
  powershell -File ops/deploy-web.ps1
  powershell -File ops/deploy-web.ps1 -SkipDeploy
#>
param([switch]$SkipDeploy)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$LogDir   = Join-Path $PSScriptRoot 'logs'
$Stamp    = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-DeployAlert([string]$Reason, [string]$Detail) {
  $f = Join-Path $LogDir "ALERT-deploy-$Stamp.txt"
  @"
ALERT (deploy) - $Stamp
Reason: $Reason
$Detail

Charter Sec 4 (Deploy Gates) / Sec 8 (escalation). Board action may be required.
"@ | Set-Content -Encoding utf8 $f
  Write-Host "WROTE $f"
}

# Append an ops-health row so KR1-2 coverage records the deploy attempt.
function Add-DeployHealthRow([string]$H1, [string]$H4, [string]$Note) {
  $csv = Join-Path $PSScriptRoot '../docs/company/metrics/ops-health-log.csv'
  Add-Content -Encoding utf8 $csv "$Stamp,deploy,$H1,none,not-run,$H4,$Note"
}

Push-Location $RepoRoot
try {
  # ---- Gate 3 (run FIRST - cheapest, and the one that protects donor trust) ----
  # If the pending diff touches any Sec 3b-gated surface, this wrapper must NOT
  # auto-deploy: those changes ship via PR + ALERT (Charter Sec 3b). Over-matching
  # here is intentional - "when in doubt, treat as gated."
  $gated = '(lib/updateFunds|app/api/.*(order|checkout|complete-order)|credit_balance|reservedBalance|lib/mailer|send-.*-email|send-notification|adminAuth|meetingTokens|admin-?allowlist|middleware|rate-?limit)'
  $changed = @()
  $changed += (git diff --name-only origin/main...HEAD)  # committed vs origin
  $changed += (git diff --name-only)                     # unstaged
  $changed += (git diff --name-only --cached)            # staged
  $changed = $changed | Where-Object { $_ } | Sort-Object -Unique
  $hits = $changed | Where-Object { $_ -match $gated }
  if ($hits) {
    Write-DeployAlert 'gated-surface-touched' ("Diff touches Sec 3b-gated files - must ship via PR, not auto-deploy:`n" + ($hits -join "`n"))
    exit 10
  }

  # ---- Gate 1: tsc clean ----
  Write-Host "Gate 1/4: npx tsc --noEmit ..."
  npx tsc --noEmit
  if ($LASTEXITCODE -ne 0) { Write-DeployAlert 'tsc-failed' 'npx tsc --noEmit reported errors - not shipping.'; exit 11 }

  # ---- Gate 2: tests pass (a red build never ships) ----
  Write-Host "Gate 2/4: npm run test ..."
  npm run test
  if ($LASTEXITCODE -ne 0) { Write-DeployAlert 'tests-failed' 'npm run test failed - a red build never ships.'; exit 12 }

  # ---- Gate 4: version bump + CHANGELOG (heuristic warning only) ----
  $verChanged = ($changed -contains 'package.json')
  $logChanged = @($changed | Where-Object { $_ -match 'CHANGELOG\.md$' }).Count -gt 0
  if (-not ($verChanged -and $logChanged)) {
    Write-Host "WARN (Gate 4): package.json and/or CHANGELOG.md not in the diff. If this is a shippable app change, bump version + update CHANGELOG per .ai-instructions.md."
  }
  Write-Host "Deploy gates passed."

  if ($SkipDeploy) {
    Write-Host "SkipDeploy set - probing current production only (no deploy)."
    & (Join-Path $PSScriptRoot 'check-site.ps1')
    exit $LASTEXITCODE
  }

  # ---- Capture last known-good production deployment (rollback target) ----
  $prev = $null
  try {
    $lsRaw = npx vercel ls --prod --yes 2>$null
    $m = $lsRaw | Select-String -Pattern 'https://\S+\.vercel\.app' | Select-Object -First 1
    if ($m) { $prev = $m.Matches[0].Value }
  } catch { }
  if ($prev) { Write-Host "Known-good production deployment (rollback target): $prev" }
  else { Write-Host "WARN: could not resolve current prod deployment; rollback will fall back to 'vercel rollback' (previous)." }

  # ---- Deploy to production ----
  Write-Host "Deploying to production: npx vercel --prod ..."
  npx vercel --prod --yes
  if ($LASTEXITCODE -ne 0) { Write-DeployAlert 'deploy-failed' 'npx vercel --prod returned non-zero.'; Add-DeployHealthRow 'fail' 'deploy-error' 'vercel --prod nonzero'; exit 13 }

  # ---- Post-deploy synthetic probe ----
  Start-Sleep -Seconds 10  # let the promotion propagate
  & (Join-Path $PSScriptRoot 'check-site.ps1')
  $probe = $LASTEXITCODE

  if ($probe -ne 0) {
    Write-Host "POST-DEPLOY PROBE FAILED - auto-rolling-back."
    if ($prev) { npx vercel rollback $prev --yes } else { npx vercel rollback --yes }
    $rb = $LASTEXITCODE
    & (Join-Path $PSScriptRoot 'check-site.ps1')   # confirm rollback restored health
    $reprobe = $LASTEXITCODE
    Write-DeployAlert 'auto-rollback-fired' "Post-deploy probe failed; rolled back to '$prev' (rollback exit=$rb, re-probe exit=$reprobe)."
    Add-DeployHealthRow 'fail' 'rolled-back' "probe failed; rollback exit=$rb re-probe=$reprobe"
    exit 14
  }

  Write-Host "Deploy healthy - production probe green."
  Add-DeployHealthRow 'success' 'no-rollback' 'deploy + post-deploy probe green'
  exit 0
} finally { Pop-Location }
