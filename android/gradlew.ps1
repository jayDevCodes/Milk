$ErrorActionPreference = "Stop"

$AppHome = $PSScriptRoot
$Properties = Join-Path $AppHome "gradle/wrapper/gradle-wrapper.properties"
if (-not (Test-Path $Properties)) { throw "Gradle wrapper properties not found: $Properties" }

$UrlLine = Get-Content $Properties | Where-Object { $_ -match '^distributionUrl=' } | Select-Object -First 1
$ShaLine = Get-Content $Properties | Where-Object { $_ -match '^distributionSha256Sum=' } | Select-Object -First 1
if (-not $UrlLine -or -not $ShaLine) { throw "Gradle URL or checksum is missing." }

$Url = $UrlLine.Substring("distributionUrl=".Length).Replace('\:', ':')
$ExpectedHash = $ShaLine.Substring("distributionSha256Sum=".Length).ToLowerInvariant()
if ($Url -notmatch '^https://services\.gradle\.org/distributions/gradle-([0-9.]+)-bin\.zip$') {
    throw "Refusing an untrusted Gradle distribution URL."
}
$Version = $Matches[1]

$GradleUserHome = if ($env:GRADLE_USER_HOME) { $env:GRADLE_USER_HOME } else { Join-Path $env:USERPROFILE ".gradle" }
$CacheRoot = Join-Path $GradleUserHome "wrapper/dists/gradle-$Version-bin/milk-bootstrap"
$GradleHome = Join-Path $CacheRoot "gradle-$Version"
$Archive = Join-Path $CacheRoot "gradle-$Version-bin.zip"

if (-not (Test-Path (Join-Path $GradleHome "bin/gradle.bat"))) {
    New-Item -ItemType Directory -Force -Path $CacheRoot | Out-Null
    Write-Host "Downloading Gradle $Version..."
    Invoke-WebRequest -Uri $Url -OutFile "$Archive.part"
    Move-Item -Force "$Archive.part" $Archive
    $ActualHash = (Get-FileHash -Path $Archive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($ActualHash -ne $ExpectedHash) {
        Remove-Item -Force $Archive
        throw "Gradle SHA-256 mismatch."
    }
    Expand-Archive -Path $Archive -DestinationPath $CacheRoot -Force
    Remove-Item -Force $Archive
}

$Gradle = Join-Path $GradleHome "bin/gradle.bat"
& $Gradle --project-dir $AppHome @args
exit $LASTEXITCODE
