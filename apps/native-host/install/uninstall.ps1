$ErrorActionPreference = "Stop"

$PackageName = "pi-browser-template"
$HostName = "com.pi.pi_browser_template"

$InstallRoot = Join-Path $env:LOCALAPPDATA $PackageName
$RegistryKey = "HKCU\Software\Google\Chrome\NativeMessagingHosts\$HostName"
$RegistryPath = "Registry::$RegistryKey"

if (Test-Path $RegistryPath) {
  Remove-Item -Path $RegistryPath -Recurse -Force
  Write-Host "Removed native host registry key:"
  Write-Host "  $RegistryKey"
} else {
  Write-Host "Native host registry key was not present:"
  Write-Host "  $RegistryKey"
}
Write-Host ""

if (Test-Path $InstallRoot) {
  try {
    Remove-Item $InstallRoot -Recurse -Force
    Write-Host "Removed install directory:"
    Write-Host "  $InstallRoot"
  } catch {
    Write-Warning "Could not remove install directory: $InstallRoot"
    Write-Warning "It is probably still in use by Chrome's native messaging host. Close Chrome, then run this uninstall command again."
    Write-Warning $_.Exception.Message
    exit 1
  }
} else {
  Write-Host "Install directory was not present:"
  Write-Host "  $InstallRoot"
}

Write-Host ""
Write-Host "Done."
