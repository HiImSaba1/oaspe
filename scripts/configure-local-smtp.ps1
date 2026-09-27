param(
  [string]$ReferenceEnv = "C:\Users\sab_j\Desktop\Projects\moumkas-new\moumkas-awwwards\.env.development.local",
  [switch]$Enable
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentPath = Join-Path $projectRoot ".env.local"

if (-not (Test-Path -LiteralPath $environmentPath -PathType Leaf)) { throw ".env.local is missing." }
if (-not (Test-Path -LiteralPath $ReferenceEnv -PathType Leaf)) { throw "Moumkas SMTP reference environment is missing: $ReferenceEnv" }

function Read-EnvMap([string]$Path) {
  $map = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $value = $matches[2].Trim()
      if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Substring(1, $value.Length - 2) }
      $map[$matches[1]] = $value
    }
  }
  return $map
}

function Format-EnvValue([string]$Value) {
  if ($Value.Contains("`r") -or $Value.Contains("`n")) { throw "SMTP values cannot contain line breaks." }
  return '"' + $Value.Replace('\', '\\').Replace('"', '\"') + '"'
}

$oaspeLines = [Collections.Generic.List[string]](Get-Content -LiteralPath $environmentPath)
$reference = Read-EnvMap $ReferenceEnv
$username = $null
$password = $null
foreach ($line in $oaspeLines) {
  if ($line -match '^\s*#\s*username\s*:\s*(.+?)\s*$') { $username = $matches[1].Trim() }
  if ($line -match '^\s*#\s*password\s*:\s*(.+?)\s*$') { $password = $matches[1].Trim() }
}
if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($password)) { throw "Commented Mail username/password entries were not found in .env.local." }

$hostValue = $reference["SMTP_HOST"]
$portValue = $reference["SMTP_PORT"]
$secureValue = $reference["SMTP_SECURE"]
if ([string]::IsNullOrWhiteSpace($hostValue) -or [string]::IsNullOrWhiteSpace($portValue)) { throw "The Moumkas reference does not contain a complete SMTP host and port." }

$updates = [ordered]@{
  SMTP_ENABLED = $(if ($Enable) { "true" } else { "false" })
  SMTP_HOST = $hostValue
  SMTP_PORT = $portValue
  SMTP_SECURE = $(if ([string]::IsNullOrWhiteSpace($secureValue)) { "true" } else { $secureValue })
  SMTP_REJECT_UNAUTHORIZED = "true"
  SMTP_USERNAME = $username
  SMTP_PASSWORD = $password
  SMTP_FROM_EMAIL = $username
  CONTACT_TO_EMAIL = $username
}

foreach ($key in $updates.Keys) {
  $replacement = "$key=$(Format-EnvValue ([string]$updates[$key]))"
  $index = -1
  for ($i = 0; $i -lt $oaspeLines.Count; $i += 1) { if ($oaspeLines[$i] -match "^\s*$key\s*=") { $index = $i; break } }
  if ($index -ge 0) { $oaspeLines[$index] = $replacement } else { $oaspeLines.Add($replacement) }
}

[IO.File]::WriteAllLines($environmentPath, $oaspeLines, (New-Object Text.UTF8Encoding($false)))
Write-Host "OASPE SMTP configuration updated without printing credentials." -ForegroundColor Green
Write-Host "Reference: Moumkas SMTP host, port and secure mode." -ForegroundColor Green
Write-Host "SMTP enabled: $([bool]$Enable). Restart the Next.js server after environment changes." -ForegroundColor Yellow
