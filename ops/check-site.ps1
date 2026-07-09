<#
.SYNOPSIS
  Synthetic health probe for app.donatalk.com critical paths (KR1-4).
  Read-only: fetches public routes, asserts 200 + expected markers. Writes a
  JSON result to ops/logs and an ops-health-log row. NO test users created
  (booking/signup are behind auth + PayPal — probing them live would touch
  money-adjacent flows, which the Charter fences off). Extend with a disposable
  Firebase test user only once a non-prod path exists.
.EXAMPLE
  powershell -File ops/check-site.ps1
#>
$ErrorActionPreference = 'Stop'
$Base   = if ($env:NEXT_PUBLIC_BASE_URL) { $env:NEXT_PUBLIC_BASE_URL } else { 'https://app.donatalk.com' }
$LogDir = Join-Path $PSScriptRoot 'logs'
$Stamp  = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# route -> substring that must appear in the HTML for the path to be "healthy"
$Checks = @(
  @{ path = '/';          marker = 'DonaTalk' },
  @{ path = '/listeners'; marker = 'listener' },
  @{ path = '/login';     marker = 'DonaTalk' }
)

$results = @()
$allOk = $true
foreach ($c in $Checks) {
  $url = "$Base$($c.path)"
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    $ok = ($r.StatusCode -eq 200) -and ($r.Content -match [regex]::Escape($c.marker))
    $results += [pscustomobject]@{ path = $c.path; status = $r.StatusCode; ok = $ok }
    if (-not $ok) { $allOk = $false }
  } catch {
    $results += [pscustomobject]@{ path = $c.path; status = 'ERR'; ok = $false }
    $allOk = $false
  }
}

$json = [pscustomobject]@{ ts = $Stamp; base = $Base; allOk = $allOk; checks = $results }
$json | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 (Join-Path $LogDir "site-check-$Stamp.json")

# append ops-health row
$metricsCsv = Join-Path $PSScriptRoot '../docs/company/metrics/ops-health-log.csv'
$h3 = if ($allOk) { 'pass' } else { 'FAIL' }
$h1 = if ($allOk) { 'success' } else { 'fail' }
Add-Content -Encoding utf8 $metricsCsv "$Stamp,probe,$h1,none,$h3,not-run,critical-path probe"

if (-not $allOk) {
  $alert = Join-Path $LogDir ("ALERT-site-" + $Stamp + ".txt")
  $detail = $results | ConvertTo-Json -Depth 5
  $body = "Site probe FAILED at $Stamp against $Base`n$detail"
  Set-Content -Encoding utf8 -Path $alert -Value $body
  Write-Host "PROBE FAILED - wrote $alert"
  # Auto-rollback hook: deploy wrapper watches for ALERT-site-* immediately after a deploy.
  exit 1
}
Write-Host "PROBE OK - $Base all critical paths healthy."
exit 0
