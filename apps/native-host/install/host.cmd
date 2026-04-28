@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "HOST_SCRIPT=%SCRIPT_DIR%host.cjs"

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  node "%HOST_SCRIPT%" %*
  exit /b %ERRORLEVEL%
)

echo Node.js not found for native host 1>&2
exit /b 1
