<#
.SYNOPSIS
  Generic autonomous-routine runner for DonaTalk.
  Invoked by Windows Task Scheduler. Runs `claude -p <routine-prompt>`, does a
  git-write pre-flight, classifies failures, and writes ALERT files.

.EXAMPLE
  powershell -File ops/run-routine.ps1 -Routine daily-ops
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('daily-ops', 'growth-research', 'weekly-report')]
  [string]$Routine
)

$ErrorActionPreference = 'Stop'
$RepoRoot   = Split-Path -Parent $PSScriptRoot
$LogDir     = Join-Path $PSScriptRoot 'logs'
$PromptFile = Join-Path $PSScriptRoot "routines/$Routine.md"
$Stamp      = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$LogFile    = Join-Path $LogDir "$Routine-$Stamp.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Alert([string]$Class, [string]$Detail) {
  $f = Join-Path $LogDir "ALERT-$Class-$Stamp.txt"
  @"
ALERT ($Class) — routine=$Routine — $Stamp
$Detail

Board action may be required. See docs/company/CHARTER.md §8 (escalation).
"@ | Set-Content -Encoding utf8 $f
  Write-Host "WROTE $f"
}

function Get-RootCause([string]$Output) {
  if ($Output -match 'credit balance is too low|insufficient credit|quota')      { return 'credit-exhaustion' }
  if ($Output -match 'trust|workspace is not trusted')                           { return 'workspace-trust' }
  if ($Output -match 'permission|not allowed|EACCES')                            { return 'permission-error' }
  if ($Output -match 'fatal:|rejected|non-fast-forward|failed to push')          { return 'git-write-failure' }
  return 'unknown'
}

if (-not (Test-Path $PromptFile)) { Write-Alert 'config-error' "Missing prompt: $PromptFile"; exit 2 }

# --- git pre-flight: reach origin, then start clean on latest main ---
# A prior run may leave a feature branch checked out; always reset to origin/main
# so each run begins from a known, current state.
Push-Location $RepoRoot
try {
  git fetch --quiet origin 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Alert 'git-write-failure' 'git fetch origin failed in pre-flight.'; exit 3 }
  git checkout main --quiet 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Alert 'git-write-failure' 'git checkout main failed (dirty tree?).'; exit 3 }
  git reset --hard origin/main --quiet 2>&1 | Out-Null
} finally { Pop-Location }

# --- deterministic health + metrics (KR1-2 / KR1-4), runner-owned so coverage
#     does not depend on the agent's tool permissions ---
Push-Location $RepoRoot
try {
  & (Join-Path $PSScriptRoot 'check-site.ps1')  2>&1 | Out-Null; Write-Host "[$Stamp] probe collected."
  & (Join-Path $PSScriptRoot 'get-metrics.ps1') 2>&1 | Out-Null; Write-Host "[$Stamp] metrics collected."
} catch { Write-Host "[$Stamp] health/metrics collection warning: $($_.Exception.Message)" } finally { Pop-Location }

# --- run the routine via claude -p ---
$Prompt = Get-Content $PromptFile -Raw
Write-Host "[$Stamp] Running routine '$Routine'..."
# Run claude from the repo root so it reads the company OS / repo as its cwd.
Push-Location $RepoRoot
try {
  $Output = & claude -p $Prompt --permission-mode acceptEdits 2>&1 | Tee-Object -FilePath $LogFile
  $Code = $LASTEXITCODE
} finally { Pop-Location }

if ($Code -ne 0) {
  $class = Get-RootCause ($Output -join "`n")
  Write-Alert $class "claude -p exited $Code. See $LogFile."
  exit $Code
}

Write-Host "[$Stamp] Routine '$Routine' completed OK. Log: $LogFile"
exit 0
