param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentPath = Join-Path $projectRoot ".env.local"

if (-not (Test-Path -LiteralPath $environmentPath -PathType Leaf)) {
  throw ".env.local is missing. Run scripts/setup-local-env.ps1 first."
}

$required = @(
  "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD",
  "ADMIN_USERNAME", "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET",
  "AUTH_SECRET", "NEXTAUTH_SECRET", "NEXTAUTH_URL"
)
$values = @{}

foreach ($line in Get-Content -LiteralPath $environmentPath) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
    $key = $matches[1]
    $value = $matches[2].Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $values[$key] = $value
  }
}

$missing = @($required | Where-Object { -not $values.ContainsKey($_) })
if ($missing.Count -gt 0) {
  throw "Missing environment keys: $($missing -join ', ')"
}
if ($values["DB_NAME"] -ne "next_oaspe") {
  throw "DB_NAME must be next_oaspe for this local project."
}
if ($values["ADMIN_PASSWORD"].Length -lt 12) {
  throw "ADMIN_PASSWORD must contain at least 12 characters."
}
foreach ($secretName in @("ADMIN_SESSION_SECRET", "AUTH_SECRET", "NEXTAUTH_SECRET")) {
  if ($values[$secretName].Length -lt 43) {
    throw "$secretName is too short. Re-run setup-local-env.ps1 with -Force."
  }
}
if ($values.ContainsKey("SMTP_ENABLED") -and $values["SMTP_ENABLED"] -eq "true") {
  $smtpRequired = @("SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM_EMAIL", "CONTACT_TO_EMAIL")
  $smtpMissing = @($smtpRequired | Where-Object { -not $values.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($values[$_]) -or $values[$_] -like "replace-*" })
  if ($smtpMissing.Count -gt 0) { throw "SMTP is enabled but configuration is incomplete: $($smtpMissing -join ', ')" }
}

Write-Host "Local environment contract: PASS" -ForegroundColor Green
Write-Host "Database target: next_oaspe on $($values['DB_HOST']):$($values['DB_PORT'])" 
Write-Host "Credentials and session secrets are present and were not printed."
