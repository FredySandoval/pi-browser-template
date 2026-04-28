param(
  [string]$ExtensionId = ""
)

$HostName = "com.pi.pi_browser_template"
$PackageName = "pi-browser-template"
$RegistryKey = "HKCU\Software\Google\Chrome\NativeMessagingHosts\$HostName"
$failures = 0

function Pass($msg) { Write-Host "PASS $msg" }
function Fail($msg) { Write-Host "FAIL $msg"; $script:failures += 1 }

try {
  $ManifestPath = (Get-ItemProperty -Path "Registry::$RegistryKey" -Name "(default)")."(default)"
  Pass "registry key exists: $RegistryKey"
} catch {
  Fail "registry key missing: $RegistryKey"
  exit 1
}

if (Test-Path $ManifestPath) { Pass "manifest exists: $ManifestPath" } else { Fail "manifest missing: $ManifestPath"; exit 1 }

try {
  $Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
  Pass "manifest JSON is valid"
} catch {
  Fail "manifest JSON is invalid"
  exit 1
}

if ($Manifest.name -eq $HostName) { Pass "manifest host name matches" } else { Fail "manifest host name mismatch: $($Manifest.name)" }
if ($Manifest.type -eq "stdio") { Pass "manifest type is stdio" } else { Fail "manifest type is not stdio" }
if (Test-Path $Manifest.path) { Pass "host launcher exists: $($Manifest.path)" } else { Fail "host launcher missing: $($Manifest.path)" }

$NativeDir = Split-Path -Parent $Manifest.path
if (Test-Path (Join-Path $NativeDir "host.cmd")) { Pass "host.cmd exists" } else { Fail "host.cmd missing" }
if (Test-Path (Join-Path $NativeDir "host.cjs")) { Pass "host.cjs exists" } else { Fail "host.cjs missing" }
if (Test-Path (Join-Path $NativeDir "native-utils.cjs")) { Pass "native-utils.cjs exists" } else { Fail "native-utils.cjs missing" }
if (Test-Path (Join-Path $NativeDir "runtime-paths.cjs")) { Pass "runtime-paths.cjs exists" } else { Fail "runtime-paths.cjs missing" }

if ($ExtensionId) {
  $ExpectedOrigin = "chrome-extension://$ExtensionId/"
  if ($Manifest.allowed_origins -contains $ExpectedOrigin) { Pass "allowed origin exists" } else { Fail "allowed origin missing: $ExpectedOrigin" }
}

$Node = Get-Command node -ErrorAction SilentlyContinue
if ($Node) { Pass "Node.js found: $($Node.Source)" } else { Fail "Node.js not found on PATH" }

$InstallRoot = Join-Path $env:LOCALAPPDATA $PackageName
if (Test-Path $InstallRoot) { Pass "runtime/token/log directory exists: $InstallRoot" } else { Fail "runtime/token/log directory missing: $InstallRoot" }

if ($failures -eq 0) {
  Write-Host "Done: native host checks passed."
  exit 0
}

Write-Host "Done: $failures native host check(s) failed."
exit 1
