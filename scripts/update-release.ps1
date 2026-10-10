# Windows PowerShell Script to calculate SHA256 and update update.json
param(
    [int]$VersionCode,
    [string]$VersionName,
    [string]$ReleaseNotes,
    [string]$RenderDomain,
    [string]$ApkPath = "downloads\app-release.apk"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$manifestPath = Join-Path $rootDir "update.json"
$resolvedApkPath = Join-Path $rootDir $ApkPath

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host "  Android Release Manifest Updater (PowerShell)" -ForegroundColor Cyan
Write-Host "======================================================`n" -ForegroundColor Cyan

if (-not (Test-Path $resolvedApkPath)) {
    Write-Host "Error: APK file not found at: $resolvedApkPath" -ForegroundColor Red
    Write-Host "Please place your APK file in downloads\app-release.apk first." -ForegroundColor Yellow
    exit 1
}

# Calculate SHA256
Write-Host "Calculating SHA-256 for: $resolvedApkPath" -ForegroundColor Gray
$hashResult = Get-FileHash -Path $resolvedApkPath -Algorithm SHA256
$sha256 = $hashResult.Hash.ToLower()
$fileSize = (Get-Item $resolvedApkPath).Length

Write-Host "File Size:    $([math]::Round($fileSize / 1MB, 2)) MB ($fileSize bytes)" -ForegroundColor Green
Write-Host "SHA-256 Hash: $sha256" -ForegroundColor Green

# Read or initialize manifest
$manifest = @{}
if (Test-Path $manifestPath) {
    try {
        $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    } catch {
        Write-Host "Warning: Could not read existing update.json, using template." -ForegroundColor Yellow
    }
}

if ($VersionCode) { $manifest.versionCode = $VersionCode }
if ($VersionName) { $manifest.versionName = $VersionName }
if ($ReleaseNotes) { $manifest.releaseNotes = $ReleaseNotes }
if ($RenderDomain) {
    $cleanDomain = $RenderDomain.TrimEnd('/')
    $apkFileName = Split-Path $resolvedApkPath -Leaf
    $manifest.apkUrl = "$cleanDomain/downloads/$apkFileName"
}

$manifest.sha256 = $sha256

# Write back formatted JSON
$updatedJson = $manifest | ConvertTo-Json -Depth 4
Set-Content -Path $manifestPath -Value $updatedJson -Encoding UTF8

Write-Host "`nSuccessfully updated update.json!" -ForegroundColor Cyan
Write-Host "------------------------------------------------------" -ForegroundColor DarkGray
Write-Host $updatedJson -ForegroundColor White
Write-Host "------------------------------------------------------`n" -ForegroundColor DarkGray
