param(
  [Parameter(Mandatory=$true)]
  [string]$ExtensionId
)

$ErrorActionPreference = "Stop"

$PackageName = "pi-browser-template"
$HostName = "com.pi.pi_browser_template"
$InstallRoot = Join-Path $env:LOCALAPPDATA $PackageName
$NativeDir = Join-Path $InstallRoot "native"

New-Item -ItemType Directory -Path $NativeDir -Force | Out-Null

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path (Join-Path $ScriptDir "..\..\..")
if (!(Test-Path (Join-Path $RootDir "package.json")) -and (Test-Path (Join-Path $RootDir "dist\package.json"))) {
  $RootDir = Join-Path $RootDir "dist"
}

$BuiltNativeDir = Join-Path $RootDir "dist\chrome-extension\native"
if (!(Test-Path (Join-Path $BuiltNativeDir "host.cjs")) -and (Test-Path (Join-Path $ScriptDir "host.cjs"))) {
  $BuiltNativeDir = $ScriptDir
}

$HostSource = Join-Path $BuiltNativeDir "host.cjs"
$UtilsSource = Join-Path $BuiltNativeDir "native-utils.cjs"
$RuntimePathsSource = Join-Path $BuiltNativeDir "runtime-paths.cjs"
$CmdSource = Join-Path $ScriptDir "host.cmd"

if (!(Test-Path $HostSource)) { throw "Built native host not found: $HostSource. Run pnpm build first." }
if (!(Test-Path $UtilsSource)) { throw "Built native utils not found: $UtilsSource. Run pnpm build first." }
if (!(Test-Path $RuntimePathsSource)) { throw "Built runtime paths not found: $RuntimePathsSource. Run pnpm build first." }
if (!(Test-Path $CmdSource)) { throw "Native host launcher not found: $CmdSource." }

Copy-Item $HostSource (Join-Path $NativeDir "host.cjs") -Force
Copy-Item $UtilsSource (Join-Path $NativeDir "native-utils.cjs") -Force
Copy-Item $RuntimePathsSource (Join-Path $NativeDir "runtime-paths.cjs") -Force
Copy-Item $CmdSource (Join-Path $NativeDir "host.cmd") -Force
Copy-Item (Join-Path $RootDir "package.json") (Join-Path $InstallRoot "package.json") -Force

$HostCmdPath = Join-Path $NativeDir "host.cmd"
$ManifestPath = Join-Path $NativeDir "$HostName.json"

$Manifest = [ordered]@{
  name = $HostName
  description = "$PackageName native messaging host"
  path = $HostCmdPath
  type = "stdio"
  allowed_origins = @("chrome-extension://$ExtensionId/")
}

$Manifest | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $ManifestPath

$RegistryKey = "HKCU\Software\Google\Chrome\NativeMessagingHosts\$HostName"
reg add $RegistryKey /ve /t REG_SZ /d $ManifestPath /f | Out-Null

Write-Host "Native host name:"
Write-Host "  $HostName"
Write-Host ""
Write-Host "Installed native host files:"
Write-Host "  $NativeDir\host.cjs"
Write-Host "  $NativeDir\native-utils.cjs"
Write-Host "  $NativeDir\runtime-paths.cjs"
Write-Host "  $NativeDir\host.cmd"
Write-Host ""
Write-Host "Installed native messaging manifest:"
Write-Host "  $ManifestPath"
Write-Host ""
Write-Host "Registered Windows registry key:"
Write-Host "  $RegistryKey"
Write-Host ""
Write-Host "Allowed extension origin:"
Write-Host "  chrome-extension://$ExtensionId/"
Write-Host ""
Write-Host "Done."
