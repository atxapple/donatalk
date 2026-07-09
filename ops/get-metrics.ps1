<#
.SYNOPSIS
  Collect metrics and append rows to docs/company/metrics/*.csv (KR1-2).
  Sources that need credentials are STUBBED with an explicit "n/a - needs X"
  marker so coverage stays 100% (a logged "no data" row still proves the run
  measured). Wire real sources as the board provisions access.

  Real sources to wire (blocked on board):
    - Awareness A3-A6  <- Google Search Console API (needs service account)
    - Awareness A1     <- GA4 Data API           (needs GA4 property + creds)
    - Funnel F1-F4/R1  <- Firebase Admin SDK read (needs service account json)
    - Awareness A7     <- parsed from backlink-ledger.md (available now)
.EXAMPLE
  powershell -File ops/get-metrics.ps1
#>
$ErrorActionPreference = 'Stop'
$Root       = Split-Path -Parent $PSScriptRoot
$MetricsDir = Join-Path $Root 'docs/company/metrics'
$Date       = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')

# A7 - count do-follow backlinks from the ledger (this we can do today)
$ledger = Join-Path $MetricsDir 'backlink-ledger.md'
$a7 = 0
if (Test-Path $ledger) {
  $a7 = (Select-String -Path $ledger -Pattern '\|\s*yes\s*\|' -AllMatches).Count
}

# Awareness row - A1..A6 pending credentials, A7 live
Add-Content -Encoding utf8 (Join-Path $MetricsDir 'awareness-log.csv') `
  "$Date,n/a,n/a,n/a,n/a,n/a,n/a,$a7,A1-A6 pending GSC/GA4 creds; A7 from ledger"

# Funnel row - pending Firebase Admin read
Add-Content -Encoding utf8 (Join-Path $MetricsDir 'funnel-log.csv') `
  "$Date,n/a,n/a,n/a,n/a,n/a,F1-F4/R1 pending Firebase Admin service account"

Write-Host "Appended metric rows for $Date (A7=$a7; rest pending credentials)."
exit 0
