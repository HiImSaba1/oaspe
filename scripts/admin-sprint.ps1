param([Parameter(Mandatory = $true)][ValidateSet("Prepare", "Verify")][string]$Action)
$ErrorActionPreference = "Stop"
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$null = chcp 65001
$env:NO_COLOR = "1"
Remove-Item -LiteralPath "Env:FORCE_COLOR" -ErrorAction SilentlyContinue
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactRoot = Join-Path $projectRoot ".artifacts\simple-admin"
$resultLog = Join-Path $artifactRoot "result.log"
$failureLog = Join-Path $artifactRoot "failure.log"
New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null
Remove-Item -LiteralPath $resultLog,$failureLog -Force -ErrorAction SilentlyContinue
function Run([string]$Name, [scriptblock]$Command) {
  "`n=== $Name ===" | Add-Content -LiteralPath $resultLog -Encoding utf8
  Write-Host "`n=== $Name ==="
  $output = & $Command 2>&1
  $code = $LASTEXITCODE
  $output | ForEach-Object { $_.ToString() | Add-Content -LiteralPath $resultLog -Encoding utf8; Write-Host $_ }
  if ($code -ne 0) { throw "$Name failed with exit code $code." }
}
try {
  Set-Location -LiteralPath $projectRoot
  if ($Action -eq "Prepare") {
    Run "Update live image paths" { npm run media:paths:update }
    Run "Apply additive admin schema" { npx tsx --env-file=.env.local .\scripts\migrate-database.ts }
  } else {
    "`n=== Reject stale live image paths ===" | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`n=== Reject stale live image paths ==="
    $rgCommand = Get-Command "rg" -ErrorAction SilentlyContinue
    if ($rgCommand) {
      $stalePaths = & $rgCommand.Source -n "/images/wp-content/uploads/" "src" 2>&1
      $searchExitCode = $LASTEXITCODE
      if ($searchExitCode -gt 1) { throw "Stale path search failed with exit code $searchExitCode." }
    } else {
      $sourceFiles = Get-ChildItem -LiteralPath (Join-Path $projectRoot "src") -Recurse -File -Include "*.ts", "*.tsx", "*.css", "*.json"
      $stalePaths = $sourceFiles | Select-String -SimpleMatch "/images/wp-content/uploads/"
      $searchExitCode = if ($stalePaths) { 0 } else { 1 }
    }
    if ($searchExitCode -eq 0) {
      $stalePaths | ForEach-Object { $_.ToString() | Add-Content -LiteralPath $resultLog -Encoding utf8; Write-Host $_ }
      throw "Stale live image paths remain in src."
    }
    "PASS: no stale live image paths" | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "PASS: no stale live image paths"
    Run "Scoped ESLint" { npx eslint scripts/update-site-media-paths.ts src/lib/database.ts src/lib/admin-auth.ts src/lib/admin-content.ts src/lib/admin-projects.ts src/app/admin src/app/api/contact/route.ts src/app/erga src/components/home/home-works-section.tsx }
    Run "Verify OASPE favicon" { npx tsx .\scripts\verify-favicon.ts }
    Run "TypeScript" { npx tsc --noEmit }
  }
  "`nSTATUS: PASS" | Add-Content -LiteralPath $resultLog -Encoding utf8
  Write-Host "STATUS: PASS`nArtifacts: $artifactRoot" -ForegroundColor Green
} catch {
  $_.Exception.Message | Add-Content -LiteralPath $failureLog -Encoding utf8
  "STATUS: FAIL" | Add-Content -LiteralPath $failureLog -Encoding utf8
  Write-Error $_.Exception.Message
  exit 1
}
