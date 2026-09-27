param(
  [string]$DatabaseName = "next_oaspe",
  [string]$DatabaseHost = "127.0.0.1",
  [int]$DatabasePort = 3306,
  [string]$DatabaseUser = "root",
  [string]$AdminUsername = "oaspe-admin",
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentPath = Join-Path $projectRoot ".env.local"

if ((Test-Path -LiteralPath $environmentPath) -and -not $Force) {
  throw ".env.local already exists. Re-run with -Force only when you intend to rotate the local passwords and session secrets."
}

function ConvertFrom-SecureValue([Security.SecureString]$Value) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Format-DotEnvValue([string]$Value) {
  if ($Value.Contains("`r") -or $Value.Contains("`n")) {
    throw "Environment values cannot contain line breaks."
  }
  return '"' + $Value.Replace('\', '\\').Replace('"', '\"') + '"'
}

function New-Secret([int]$ByteLength = 48) {
  $bytes = New-Object byte[] $ByteLength
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  }
  finally {
    $generator.Dispose()
  }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$databasePasswordSecure = Read-Host "MySQL password for '$DatabaseUser' (leave empty only if your local WAMP/XAMPP account has no password)" -AsSecureString
$databasePassword = ConvertFrom-SecureValue $databasePasswordSecure
$adminPassword = New-Secret 24

try {
  if ($DatabaseName -notmatch '^[A-Za-z0-9_]+$') {
    throw "DatabaseName may contain only letters, numbers and underscores."
  }
  if ($DatabasePort -lt 1 -or $DatabasePort -gt 65535) {
    throw "DatabasePort must be between 1 and 65535."
  }

  $lines = @(
    "# Generated locally by scripts/setup-local-env.ps1. Never commit this file.",
    "NODE_ENV=`"development`"",
    "NEXT_PUBLIC_SITE_URL=`"http://localhost:3000`"",
    "DB_HOST=$(Format-DotEnvValue $DatabaseHost)",
    "DB_PORT=`"$DatabasePort`"",
    "DB_NAME=$(Format-DotEnvValue $DatabaseName)",
    "DB_USER=$(Format-DotEnvValue $DatabaseUser)",
    "DB_PASSWORD=$(Format-DotEnvValue $databasePassword)",
    "DB_SSL=`"false`"",
    "DB_SSL_REJECT_UNAUTHORIZED=`"true`"",
    "DB_CONNECTION_LIMIT=`"6`"",
    "ADMIN_USERNAME=$(Format-DotEnvValue $AdminUsername)",
    "ADMIN_PASSWORD=$(Format-DotEnvValue $adminPassword)",
    "ADMIN_SESSION_SECRET=$(Format-DotEnvValue (New-Secret))",
    "AUTH_SECRET=$(Format-DotEnvValue (New-Secret))",
    "NEXTAUTH_SECRET=$(Format-DotEnvValue (New-Secret))",
    "NEXTAUTH_URL=`"http://localhost:3000`"",
    "SMTP_ENABLED=`"false`"",
    "SMTP_HOST=`"mail.example.gr`"",
    "SMTP_PORT=`"465`"",
    "SMTP_SECURE=`"true`"",
    "SMTP_REJECT_UNAUTHORIZED=`"true`"",
    "SMTP_USERNAME=`"info@example.gr`"",
    "SMTP_PASSWORD=`"replace-with-mailbox-password`"",
    "SMTP_FROM_EMAIL=`"info@example.gr`"",
    "CONTACT_TO_EMAIL=`"info@example.gr`""
  )

  [IO.File]::WriteAllLines($environmentPath, $lines, (New-Object Text.UTF8Encoding($false)))
  Write-Host "Created .env.local for database '$DatabaseName'." -ForegroundColor Green
  Write-Host "A strong admin password and fresh session secrets were generated automatically." -ForegroundColor Green
  Write-Host "They were stored only in .env.local and were not printed." -ForegroundColor Green
  Write-Host "Restart the Next.js development server after environment changes." -ForegroundColor Yellow
}
finally {
  $databasePassword = $null
  $adminPassword = $null
}
