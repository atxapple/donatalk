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

# --- git-write pre-flight: confirm we can reach origin (read-only check) ---
Push-Location $RepoRoot
try {
  git fetch --quiet origin 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Alert 'git-write-failure' 'git fetch origin failed in pre-flight.'; exit 3 }
} finally { Pop-Location }

# --- run the routine via claude -p ---
$Prompt = Get-Content $PromptFile -Raw
Write-Host "[$Stamp] Running routine '$Routine'..."
$Output = & claude -p $Prompt --permission-mode acceptEdits 2>&1 | Tee-Object -FilePath $LogFile
$Code = $LASTEXITCODE

if ($Code -ne 0) {
  $class = Get-RootCause ($Output -join "`n")
  Write-Alert $class "claude -p exited $Code. See $LogFile."
  exit $Code
}

Write-Host "[$Stamp] Routine '$Routine' completed OK. Log: $LogFile"
exit 0
