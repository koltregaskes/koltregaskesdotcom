$ErrorActionPreference = 'Stop'

param(
  [string]$TargetDate = '',
  [switch]$SkipPush
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $repoRoot 'logs'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $logsDir "daily-news-$timestamp.log"

if ([string]::IsNullOrWhiteSpace($TargetDate)) {
  $TargetDate = Get-Date -Format 'yyyy-MM-dd'
}

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
Start-Transcript -Path $logPath -Force | Out-Null

try {
  Push-Location $repoRoot

  $preExistingGeneratedChanges = @(& git status --porcelain -- news-digests content site)
  if ($LASTEXITCODE -ne 0) { throw "git status failed with exit code $LASTEXITCODE" }

  if ($preExistingGeneratedChanges.Count -gt 0) {
    Write-Warning 'Refusing to run while generated news or site files already have uncommitted changes.'
    $preExistingGeneratedChanges | ForEach-Object { Write-Warning $_ }
    throw 'Clean or commit existing changes in news-digests, content, and site before running the scheduled digest job.'
  }

  & git pull --ff-only origin main
  if ($LASTEXITCODE -ne 0) { throw "git pull failed with exit code $LASTEXITCODE" }

  Write-Host "Running shared news pipeline for $TargetDate"

  & node scripts/fetch-news.mjs --date $TargetDate
  if ($LASTEXITCODE -ne 0) { throw "fetch-news failed with exit code $LASTEXITCODE" }

  & node scripts/generate-daily-digest.mjs --date $TargetDate --allow-empty --force
  if ($LASTEXITCODE -ne 0) { throw "generate-daily-digest failed with exit code $LASTEXITCODE" }

  & node scripts/build.mjs
  if ($LASTEXITCODE -ne 0) { throw "build failed with exit code $LASTEXITCODE" }

  & git diff --quiet -- news-digests content site
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'No digest changes detected.'
    return
  }

  & git add news-digests content site
  if ($LASTEXITCODE -ne 0) { throw "git add failed with exit code $LASTEXITCODE" }

  & git commit -m "chore: refresh daily digest for $TargetDate"
  if ($LASTEXITCODE -ne 0) { throw "git commit failed with exit code $LASTEXITCODE" }

  if (-not $SkipPush) {
    & git push origin main
    if ($LASTEXITCODE -ne 0) { throw "git push failed with exit code $LASTEXITCODE" }
  }
}
finally {
  Pop-Location -ErrorAction SilentlyContinue
  Stop-Transcript | Out-Null
}
