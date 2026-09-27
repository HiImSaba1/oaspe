param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("Sprint00Verify", "Sprint01Verify", "Sprint02Verify", "Sprint03Verify", "Sprint04Verify", "Sprint05Verify", "Sprint07Verify", "Sprint08Verify", "Sprint09PrepareMedia", "Sprint09Verify", "Sprint10Verify", "Sprint11Verify", "Sprint12PrepareMedia", "Sprint12Verify", "Sprint13Verify", "Sprint13PrepareRelease", "Sprint14Verify", "Sprint14PrepareRelease")]
  [string]$Action
)

$ErrorActionPreference = "Stop"
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$null = chcp 65001
$env:NO_COLOR = "1"
Remove-Item -LiteralPath "Env:FORCE_COLOR" -ErrorAction SilentlyContinue
$projectRoot = Split-Path -Parent $PSScriptRoot
$sprintName = if ($Action -eq "Sprint00Verify") { "sprint00" } elseif ($Action -eq "Sprint01Verify") { "sprint01" } elseif ($Action -eq "Sprint02Verify") { "sprint02" } elseif ($Action -eq "Sprint03Verify") { "sprint03" } elseif ($Action -eq "Sprint04Verify") { "sprint04" } elseif ($Action -eq "Sprint05Verify") { "sprint05" } elseif ($Action -eq "Sprint07Verify") { "sprint07" } elseif ($Action -eq "Sprint08Verify") { "sprint08" } elseif ($Action -eq "Sprint10Verify") { "sprint10" } elseif ($Action -eq "Sprint11Verify") { "sprint11" } elseif ($Action -eq "Sprint12PrepareMedia" -or $Action -eq "Sprint12Verify") { "sprint12" } elseif ($Action -eq "Sprint13Verify") { "sprint13" } elseif ($Action -eq "Sprint13PrepareRelease") { "sprint13-release" } elseif ($Action -eq "Sprint14Verify") { "sprint14" } elseif ($Action -eq "Sprint14PrepareRelease") { "sprint14-release" } else { "sprint09" }
$sprintLabel = if ($Action -eq "Sprint00Verify") { "Sprint 00" } elseif ($Action -eq "Sprint01Verify") { "Sprint 01" } elseif ($Action -eq "Sprint02Verify") { "Sprint 02" } elseif ($Action -eq "Sprint03Verify") { "Sprint 03" } elseif ($Action -eq "Sprint04Verify") { "Sprint 04" } elseif ($Action -eq "Sprint05Verify") { "Sprint 05" } elseif ($Action -eq "Sprint07Verify") { "Sprint 07" } elseif ($Action -eq "Sprint08Verify") { "Sprint 08" } elseif ($Action -eq "Sprint10Verify") { "Sprint 10" } elseif ($Action -eq "Sprint11Verify") { "Sprint 11" } elseif ($Action -eq "Sprint12PrepareMedia" -or $Action -eq "Sprint12Verify") { "Sprint 12" } elseif ($Action -eq "Sprint13Verify" -or $Action -eq "Sprint13PrepareRelease") { "Sprint 13" } elseif ($Action -eq "Sprint14Verify" -or $Action -eq "Sprint14PrepareRelease") { "Sprint 14" } else { "Sprint 09" }
$artifactRoot = Join-Path $projectRoot ".artifacts\$sprintName"
$resultLog = Join-Path $artifactRoot "result.log"
$failureLog = Join-Path $artifactRoot "failure.log"
$terminalLog = Join-Path $artifactRoot "terminal-output.log"
$xmlPath = Join-Path (Split-Path -Parent $projectRoot) "OASPE_FULL_WordPress.2026-09-23.xml"

New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $terminalLog -Force -ErrorAction SilentlyContinue

function Write-Result([string]$Message) {
  $englishMessage = $Message.Replace(([string][char]0x2716), "ERROR").Replace(([string][char]0x2714), "PASS")
  $englishMessage | Add-Content -LiteralPath $resultLog -Encoding utf8
  $englishMessage | Add-Content -LiteralPath $terminalLog -Encoding utf8
  Write-Host $englishMessage
}

function Write-ReviewLogLocation {
  Write-Result "Review log: $terminalLog"
}

function Invoke-Gate([string]$Name, [scriptblock]$Command) {
  Write-Result "`n=== $Name ==="
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $output = & $Command 2>&1
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
  $output | ForEach-Object { Write-Result ($_.ToString()) }
  if ($exitCode -ne 0) { throw "$Name failed with exit code $exitCode." }
}

try {
  Set-Location -LiteralPath $projectRoot
  Write-Result "OASPE $sprintLabel verification"
  Write-Result "Started: $([DateTime]::UtcNow.ToString('o'))"
  Write-Result "Project: $projectRoot"

  if ($Action -eq "Sprint12PrepareMedia") {
    Invoke-Gate "Download current site images with WordPress hierarchy" { npm run media:download }
    Invoke-Gate "Verify current site images" { npm run media:verify }
    Write-Result "`nSTATUS: PASS"
    Write-Result "Completed: $([DateTime]::UtcNow.ToString('o'))"
    Write-ReviewLogLocation
    Write-Host "Artifacts: $artifactRoot" -ForegroundColor Green
    exit 0
  }

  if ($Action -eq "Sprint13PrepareRelease") {
    Invoke-Gate "Verify production media references" { npm run media:verify:production }
    Invoke-Gate "Release ESLint" { npm run lint }
    Invoke-Gate "Release TypeScript" { npx tsc --noEmit }
    Invoke-Gate "Create secret-free Papaki release archive" { npm run release:papaki }
    Write-Result "`nSTATUS: PASS"
    Write-Result "Completed: $([DateTime]::UtcNow.ToString('o'))"
    Write-ReviewLogLocation
    Write-Host "Artifacts: $artifactRoot" -ForegroundColor Green
    exit 0
  }

  if ($Action -eq "Sprint14PrepareRelease") {
    Invoke-Gate "Verify genuine Greek XML content and SEO dataset" { npm run content:verify:seo }
    Invoke-Gate "Verify production media references" { npm run media:verify:production }
    Invoke-Gate "Verify secret-safe production environment contract" { npm run production:preflight }
    Invoke-Gate "Release ESLint" { npm run lint }
    Invoke-Gate "Release TypeScript" { npx tsc --noEmit }
    Invoke-Gate "Create secret-free Papaki release archive" { npm run release:papaki }
    Write-Result "`nSTATUS: PASS"
    Write-Result "Completed: $([DateTime]::UtcNow.ToString('o'))"
    Write-ReviewLogLocation
    Write-Host "Artifacts: $artifactRoot" -ForegroundColor Green
    exit 0
  }

  if ($Action -eq "Sprint11Verify" -and (-not (Test-Path -LiteralPath (Join-Path $projectRoot "node_modules\nodemailer\package.json") -PathType Leaf) -or -not (Test-Path -LiteralPath (Join-Path $projectRoot "node_modules\@types\nodemailer\package.json") -PathType Leaf))) {
    throw "Sprint 11 dependencies are missing. Run: npm install nodemailer@7.0.13; npm install --save-dev @types/nodemailer@7.0.5"
  }

  $required = if ($Action -eq "Sprint00Verify") {
    @($xmlPath, (Join-Path $projectRoot "ARCHITECTURE.md"), (Join-Path $projectRoot "CONTENT-MAP.md"), (Join-Path $projectRoot "DESIGN-SYSTEM.md"), (Join-Path $projectRoot "SPRINTS.md"), (Join-Path $projectRoot "scripts\inspect-wxr.ts"))
  }
  elseif ($Action -eq "Sprint01Verify") {
    @((Join-Path $projectRoot "src\components\layout\site-header.tsx"), (Join-Path $projectRoot "src\components\layout\site-footer.tsx"), (Join-Path $projectRoot "src\components\layout\oaspe-logo.tsx"), (Join-Path $projectRoot "src\components\layout\page-hero.tsx"), (Join-Path $projectRoot "src\components\contact\contact-layout.tsx"), (Join-Path $projectRoot "src\components\home\home-hero.tsx"), (Join-Path $projectRoot "src\components\home\home-services-section.tsx"), (Join-Path $projectRoot "src\components\motion\preloader.tsx"), (Join-Path $projectRoot "src\components\motion\animated-title.tsx"), (Join-Path $projectRoot "src\components\motion\parallax-image.tsx"), (Join-Path $projectRoot "src\providers\page-transition-provider.tsx"), (Join-Path $projectRoot "src\components\ui\transition-link.tsx"), (Join-Path $projectRoot "src\data\portfolio.ts"), (Join-Path $projectRoot "src\app\erga\page.tsx"), (Join-Path $projectRoot "src\app\erga\[slug]\page.tsx"), (Join-Path $projectRoot "scripts\download-wp-images.ts"), (Join-Path $projectRoot "tests\e2e\site.spec.ts"), (Join-Path $projectRoot "playwright.config.ts"))
  }
  elseif ($Action -eq "Sprint02Verify") {
    @($xmlPath, (Join-Path $projectRoot "src\lib\migration\wxr.ts"), (Join-Path $projectRoot "src\lib\migration\wxr.test.ts"), (Join-Path $projectRoot "scripts\plan-wxr-import.ts"), (Join-Path $projectRoot "ARCHITECTURE.md"), (Join-Path $projectRoot "CONTENT-MAP.md"))
  }
  elseif ($Action -eq "Sprint03Verify") {
    @((Join-Path $projectRoot "src\components\home\home-works-section.tsx"), (Join-Path $projectRoot "src\data\portfolio.ts"), (Join-Path $projectRoot "src\app\page.tsx"), (Join-Path $projectRoot "tests\e2e\site.spec.ts"), (Join-Path $projectRoot "playwright.config.ts"))
  }
  elseif ($Action -eq "Sprint04Verify") {
    @($xmlPath, (Join-Path $projectRoot "src\components\pages\editorial-page-content.tsx"), (Join-Path $projectRoot "src\app\[slug]\page.tsx"), (Join-Path $projectRoot "tests\e2e\site.spec.ts"), (Join-Path $projectRoot "playwright.config.ts"))
  }
  elseif ($Action -eq "Sprint05Verify") {
    @($xmlPath, (Join-Path $projectRoot "src\data\articles.ts"), (Join-Path $projectRoot "src\app\arthra\page.tsx"), (Join-Path $projectRoot "src\app\arthra\[slug]\page.tsx"), (Join-Path $projectRoot "tests\e2e\site.spec.ts"), (Join-Path $projectRoot "playwright.config.ts"))
  }
  elseif ($Action -eq "Sprint07Verify") {
    @($xmlPath, (Join-Path $projectRoot ".env.local"), (Join-Path $projectRoot "database\migrations\001_wxr_staging.sql"), (Join-Path $projectRoot "scripts\database-common.ts"), (Join-Path $projectRoot "scripts\migrate-database.ts"), (Join-Path $projectRoot "scripts\import-wxr-staging.ts"), (Join-Path $projectRoot "scripts\verify-database-import.ts"), (Join-Path $projectRoot "src\lib\migration\wxr.ts"), (Join-Path $projectRoot "src\lib\migration\wxr.test.ts"))
  }
  elseif ($Action -eq "Sprint08Verify") {
    @($xmlPath, (Join-Path $projectRoot "src\data\legal-pages.ts"), (Join-Path $projectRoot "src\components\pages\legal-page-content.tsx"), (Join-Path $projectRoot "src\providers\page-transition-provider.tsx"), (Join-Path $projectRoot "src\components\ui\transition-link.tsx"), (Join-Path $projectRoot "src\components\layout\page-hero.tsx"), (Join-Path $projectRoot "src\components\layout\site-header.tsx"), (Join-Path $projectRoot "tests\e2e\site.spec.ts"), (Join-Path $projectRoot "playwright.config.ts"))
  }
  elseif ($Action -eq "Sprint09PrepareMedia" -or $Action -eq "Sprint09Verify") {
    @((Join-Path $projectRoot "src\data\articles.ts"), (Join-Path $projectRoot "src\lib\media\article-image.ts"), (Join-Path $projectRoot "src\app\arthra\page.tsx"), (Join-Path $projectRoot "src\app\arthra\[slug]\page.tsx"), (Join-Path $projectRoot "scripts\download-reviewed-article-media.ts"), (Join-Path $projectRoot "scripts\verify-reviewed-article-media.ts"), (Join-Path $projectRoot "tests\e2e\site.spec.ts"))
  }
  elseif ($Action -eq "Sprint10Verify") { @((Join-Path $projectRoot "src\components\home\home-services-section.tsx"), (Join-Path $projectRoot "src\components\layout\site-header.tsx"), (Join-Path $projectRoot "src\components\motion\preloader.tsx"), (Join-Path $projectRoot "src\hooks\use-menu-letter-hover-animation.ts"), (Join-Path $projectRoot "src\components\ui\magnetic-fill-link.tsx"), (Join-Path $projectRoot "tests\e2e\site.spec.ts")) }
  elseif ($Action -eq "Sprint12Verify") { @((Join-Path $projectRoot "src\lib\seo.ts"), (Join-Path $projectRoot "src\app\robots.ts"), (Join-Path $projectRoot "src\app\sitemap.ts"), (Join-Path $projectRoot "src\app\admin\layout.tsx"), (Join-Path $projectRoot "scripts\verify-production-media.ts"), (Join-Path $projectRoot "tests\e2e\site.spec.ts")) }
  elseif ($Action -eq "Sprint13Verify") { @((Join-Path $projectRoot ".node-version"), (Join-Path $projectRoot "start.js"), (Join-Path $projectRoot "PAPAKI_DEPLOYMENT.md"), (Join-Path $projectRoot "vitest.config.mts"), (Join-Path $projectRoot "src\app\api\health\route.ts"), (Join-Path $projectRoot "src\components\ui\transition-link.tsx"), (Join-Path $projectRoot "src\components\ui\hover-text.tsx"), (Join-Path $projectRoot "src\providers\page-transition-provider.tsx"), (Join-Path $projectRoot "scripts\configure-production-env.ps1"), (Join-Path $projectRoot "scripts\production-preflight.ts"), (Join-Path $projectRoot "scripts\production-schema-check.ts"), (Join-Path $projectRoot "scripts\create-papaki-release.ts"), (Join-Path $projectRoot "tests\e2e\site.spec.ts")) }
  elseif ($Action -eq "Sprint14Verify") { @((Join-Path $projectRoot "SPRINT14_CONTENT_SEO.md"), (Join-Path $projectRoot "src\data\generated\wxr-greek-content.json"), (Join-Path $projectRoot "src\data\articles.ts"), (Join-Path $projectRoot "src\app\arthra\page.tsx"), (Join-Path $projectRoot "src\app\arthra\[slug]\page.tsx"), (Join-Path $projectRoot "scripts\verify-sprint14-content.ts"), (Join-Path $projectRoot "tests\e2e\site.spec.ts")) }
  else { @((Join-Path $projectRoot "src\app\api\contact\route.ts"), (Join-Path $projectRoot "src\components\forms\contact-form.tsx"), (Join-Path $projectRoot "src\lib\email\smtp.ts"), (Join-Path $projectRoot "src\lib\security\rate-limit.ts"), (Join-Path $projectRoot "scripts\configure-local-smtp.ps1"), (Join-Path $projectRoot ".env.example"), (Join-Path $projectRoot "tests\e2e\site.spec.ts")) }
  foreach ($path in $required) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Required file is missing: $path" }
    Write-Result "FOUND $path"
  }

  if ($Action -eq "Sprint00Verify") {
    Invoke-Gate "WXR read-only inventory" { npx tsx ".\scripts\inspect-wxr.ts" $xmlPath $artifactRoot }
  }
  if ($Action -eq "Sprint02Verify") {
    Invoke-Gate "WXR dry-run import plan" { npx tsx ".\scripts\plan-wxr-import.ts" $xmlPath $artifactRoot }
    Invoke-Gate "WXR parser and sanitizer unit tests" { npx vitest run ".\src\lib\migration\wxr.test.ts" }
  }
  if ($Action -eq "Sprint07Verify") {
    Invoke-Gate "WXR parser and quarantine tests" { npx vitest run ".\src\lib\migration\wxr.test.ts" }
    Invoke-Gate "Additive MySQL schema migration" { npx tsx --env-file=.env.local ".\scripts\migrate-database.ts" }
    Invoke-Gate "Idempotent WXR staging import" { npx tsx --env-file=.env.local ".\scripts\import-wxr-staging.ts" $xmlPath }
    Invoke-Gate "Database reconciliation" { npx tsx --env-file=.env.local ".\scripts\verify-database-import.ts" }
  }
  if ($Action -eq "Sprint09PrepareMedia") {
    Invoke-Gate "Download reviewed article media" { npx tsx ".\scripts\download-reviewed-article-media.ts" }
    Invoke-Gate "Verify reviewed article media" { npx tsx ".\scripts\verify-reviewed-article-media.ts" }
    Write-Result "`nSTATUS: PASS"
    Write-Result "Completed: $([DateTime]::UtcNow.ToString('o'))"
    Write-ReviewLogLocation
    Write-Host "Artifacts: $artifactRoot" -ForegroundColor Green
    exit 0
  }
  if ($Action -eq "Sprint09Verify" -or $Action -eq "Sprint10Verify") {
    if ($Action -eq "Sprint10Verify") { Invoke-Gate "Prepare reviewed article media" { npx tsx ".\scripts\download-reviewed-article-media.ts" } }
    Invoke-Gate "Verify reviewed article media" { npx tsx ".\scripts\verify-reviewed-article-media.ts" }
  }
  if ($Action -eq "Sprint12Verify" -or $Action -eq "Sprint13Verify") {
    Invoke-Gate "Verify production media references" { npm run media:verify:production }
  }
  if ($Action -eq "Sprint13Verify") {
    Invoke-Gate "Verify secret-safe production environment contract" { npm run production:preflight }
  }
  if ($Action -eq "Sprint14Verify") {
    Invoke-Gate "Verify genuine Greek XML content and SEO dataset" { npm run content:verify:seo }
    Invoke-Gate "Verify production media references" { npm run media:verify:production }
  }
  Invoke-Gate "ESLint" { npm run lint }
  Invoke-Gate "TypeScript" { npx tsc --noEmit }
  if ($Action -eq "Sprint01Verify" -or $Action -eq "Sprint03Verify" -or $Action -eq "Sprint04Verify" -or $Action -eq "Sprint05Verify" -or $Action -eq "Sprint08Verify" -or $Action -eq "Sprint09Verify" -or $Action -eq "Sprint10Verify" -or $Action -eq "Sprint11Verify" -or $Action -eq "Sprint12Verify" -or $Action -eq "Sprint13Verify" -or $Action -eq "Sprint14Verify") {
    Remove-Item -LiteralPath "Env:NO_COLOR" -ErrorAction SilentlyContinue
    Invoke-Gate "Playwright desktop and mobile Chrome" { npm run test:e2e }
    $env:NO_COLOR = "1"
  }
  if ($Action -eq "Sprint13Verify" -or $Action -eq "Sprint14Verify") {
    Invoke-Gate "Unit tests" { npm run test:unit }
    Invoke-Gate "Papaki Webpack production build" { npm run build:plesk }
  }

  Write-Result "`nSTATUS: PASS"
  Write-Result "Completed: $([DateTime]::UtcNow.ToString('o'))"
  Write-ReviewLogLocation
  Write-Host "Artifacts: $artifactRoot" -ForegroundColor Green
  exit 0
}
catch {
  $message = $_.Exception.Message
  $message | Add-Content -LiteralPath $failureLog -Encoding utf8
  "STATUS: FAIL" | Add-Content -LiteralPath $failureLog -Encoding utf8
  "`nERROR: $message" | Add-Content -LiteralPath $resultLog -Encoding utf8
  "STATUS: FAIL" | Add-Content -LiteralPath $resultLog -Encoding utf8
  "Completed: $([DateTime]::UtcNow.ToString('o'))" | Add-Content -LiteralPath $resultLog -Encoding utf8
  "`nERROR: $message" | Add-Content -LiteralPath $terminalLog -Encoding utf8
  "STATUS: FAIL" | Add-Content -LiteralPath $terminalLog -Encoding utf8
  "Completed: $([DateTime]::UtcNow.ToString('o'))" | Add-Content -LiteralPath $terminalLog -Encoding utf8
  "Review log: $terminalLog" | Add-Content -LiteralPath $terminalLog -Encoding utf8
  Write-Error $message
  Write-Host "Failure log: $failureLog" -ForegroundColor Red
  Write-Host "Review log: $terminalLog" -ForegroundColor Yellow
  exit 1
}
