param([switch]$Force)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$target = Join-Path $projectRoot ".env.production.local"
$localSource = Join-Path $projectRoot ".env.local"
if (-not (Test-Path -LiteralPath $target -PathType Leaf) -and -not (Test-Path -LiteralPath $localSource -PathType Leaf)) { throw "Neither .env.production.local nor .env.local exists." }

$created = -not (Test-Path -LiteralPath $target -PathType Leaf)
$source = if ($created) { $localSource } else { $target }
$content = [System.IO.File]::ReadAllText($source)
function CommentValue([string]$Label) {
  $match = [regex]::Match($content, "(?im)^\s*#\s*" + [regex]::Escape($Label) + "\s*:\s*(.+?)\s*$")
  if (-not $match.Success) { return $null }
  return $match.Groups[1].Value.Trim().Trim('"')
}
function Set-EnvValue([string]$Key, [string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { throw "A required production value for $Key is missing." }
  $escaped = $Value.Replace('`', '``').Replace('"', '`"')
  $line = "$Key=`"$escaped`""
  $pattern = "(?m)^" + [regex]::Escape($Key) + "=.*$"
  if ([regex]::IsMatch($script:content, $pattern)) { $script:content = [regex]::Replace($script:content, $pattern, $line) }
  else { $script:content = $script:content.TrimEnd() + [Environment]::NewLine + $line + [Environment]::NewLine }
}

$databaseName = CommentValue "db_name"
$databaseUser = CommentValue "username"
$databasePassword = CommentValue "password"
if ($Force -or -not [regex]::IsMatch($content, "(?m)^DB_NAME=.+$")) { Set-EnvValue "DB_NAME" $databaseName }
if ($Force -or -not [regex]::IsMatch($content, "(?m)^DB_USER=.+$")) { Set-EnvValue "DB_USER" $databaseUser }
if ($Force -or -not [regex]::IsMatch($content, "(?m)^DB_PASSWORD=.+$")) { Set-EnvValue "DB_PASSWORD" $databasePassword }
Set-EnvValue "NODE_ENV" "production"
Set-EnvValue "NEXT_PUBLIC_SITE_URL" "https://oaspe.org"
Set-EnvValue "NEXTAUTH_URL" "https://oaspe.org"
Set-EnvValue "HOSTNAME" "127.0.0.1"

[System.IO.File]::WriteAllText($target, $content, (New-Object System.Text.UTF8Encoding($false)))
if ($created) { Write-Host "Created the separate .env.production.local production file." }
else { Write-Host "Updated the existing .env.production.local production file." }
Write-Host "Production environment prepared. Values were not printed."
Write-Host "Local .env.local was used only as the source contract when needed and was not modified."
