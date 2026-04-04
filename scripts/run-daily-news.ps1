param(
  [string]$TargetDate = '',
  [switch]$SkipPush,
  [switch]$SkipCommit
)

$ErrorActionPreference = 'Stop'

function Get-GitStatusLines {
  param(
    [string[]]$Paths
  )

  $statusArgs = @('status', '--porcelain', '--')
  if ($Paths) {
    $statusArgs += $Paths
  }

  $lines = @(& git @statusArgs)
  if ($LASTEXITCODE -ne 0) { throw "git status failed with exit code $LASTEXITCODE" }

  return $lines
}

function Get-GitStatusPath {
  param(
    [string]$StatusLine
  )

  if ([string]::IsNullOrWhiteSpace($StatusLine) -or $StatusLine.Length -lt 4) {
    return ''
  }

  $pathText = $StatusLine.Substring(3).Trim()

  if ($pathText.StartsWith('"') -and $pathText.EndsWith('"')) {
    $pathText = $pathText.Substring(1, $pathText.Length - 2)
  }

  if ($pathText -like '* -> *') {
    $pathText = ($pathText -split ' -> ', 2)[1]
  }

  return $pathText.Replace('\', '/')
}

function Test-IsGeneratedDigestArtifact {
  param(
    [string]$Path
  )

  return (
    $Path -like 'news-digests/*' -or
    $Path -like 'site/*' -or
    $Path -like 'content/daily-digest-*.md'
  )
}

function Invoke-NativeStep {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$ArgumentList = @(),
    [Parameter(Mandatory = $true)]
    [string]$FailureLabel
  )

  Write-Host ">> $FilePath $($ArgumentList -join ' ')"
  & $FilePath @ArgumentList
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "$FailureLabel failed with exit code $exitCode"
  }
}

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

  $preExistingChanges = @(Get-GitStatusLines -Paths @('news-digests', 'content', 'site'))
  $preExistingManualChanges = @(
    $preExistingChanges | Where-Object {
      -not (Test-IsGeneratedDigestArtifact -Path (Get-GitStatusPath -StatusLine $_))
    }
  )

  if ($preExistingManualChanges.Count -gt 0) {
    Write-Warning 'Refusing to run while manually maintained content already has uncommitted changes.'
    $preExistingManualChanges | ForEach-Object { Write-Warning $_ }
    throw 'Clean or commit existing manual content changes before running the scheduled digest job.'
  }

  $preExistingGeneratedChanges = @(
    $preExistingChanges | Where-Object {
      Test-IsGeneratedDigestArtifact -Path (Get-GitStatusPath -StatusLine $_)
    }
  )

  if ($preExistingGeneratedChanges.Count -gt 0) {
    Write-Warning 'Existing generated digest artifacts detected. Continuing because this job regenerates them.'
    $preExistingGeneratedChanges | ForEach-Object { Write-Warning $_ }
  }

  Invoke-NativeStep -FilePath 'git' -ArgumentList @('pull', '--ff-only', 'origin', 'main') -FailureLabel 'git pull'

  Write-Host "Running shared news pipeline for $TargetDate"

  Invoke-NativeStep -FilePath 'node' -ArgumentList @('scripts/fetch-news.mjs', '--date', $TargetDate) -FailureLabel 'fetch-news'

  Invoke-NativeStep -FilePath 'node' -ArgumentList @('scripts/generate-daily-digest.mjs', '--date', $TargetDate, '--allow-empty', '--force') -FailureLabel 'generate-daily-digest'

  Invoke-NativeStep -FilePath 'node' -ArgumentList @('scripts/build.mjs') -FailureLabel 'build'

  $generatedChanges = @(
    Get-GitStatusLines -Paths @('news-digests', 'content', 'site') | Where-Object {
      Test-IsGeneratedDigestArtifact -Path (Get-GitStatusPath -StatusLine $_)
    }
  )

  if ($generatedChanges.Count -eq 0) {
    Write-Host 'No digest changes detected.'
    return
  }

  $pathsToStage = @('news-digests', 'site', 'content')
  Invoke-NativeStep -FilePath 'git' -ArgumentList (@('add', '--all', '--') + $pathsToStage) -FailureLabel 'git add'

  & git diff --cached --quiet --
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'No staged digest changes remain after refresh.'
    return
  }

  if ($SkipCommit) {
    Write-Host 'Skipping commit and push because -SkipCommit was provided.'
    return
  }

  Invoke-NativeStep -FilePath 'git' -ArgumentList @('-c', 'commit.gpgsign=false', 'commit', '--no-verify', '-m', "chore: refresh daily digest for $TargetDate") -FailureLabel 'git commit'

  if (-not $SkipPush) {
    Invoke-NativeStep -FilePath 'git' -ArgumentList @('push', 'origin', 'main') -FailureLabel 'git push'
  }
}
finally {
  Pop-Location -ErrorAction SilentlyContinue
  Stop-Transcript | Out-Null
}
