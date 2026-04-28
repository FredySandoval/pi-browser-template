# pi-browser-template

**Build Pi-powered Chrome/Chromium extensions with end-to-end type-safe native messaging.**

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![pnpm](https://img.shields.io/badge/pnpm-orange?logo=pnpm&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6.svg)
![Chrome](https://img.shields.io/badge/Chrome-4285F4?logo=googlechrome&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-0078D4?logo=quarto&logoColor=white)
![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)

`pi-browser-template` is a working starter kit for developers building Pi extensions that need to control or communicate with a browser. It wires together a Pi command/tool, a local native messaging host, a Chrome/Chromium extension, and shared runtime-validated TypeScript protocol messages.

If this template saves you setup time, consider starring it so you can find it again later.

## Demo

Quick walkthrough of the full Pi → native host → browser flow:

<img width="960" height="540" alt="584631065-1883c43b-2280-4ef6-845d-ae77c134481b" src="https://github.com/user-attachments/assets/e18e0146-30f8-4939-9270-302f971ddbc7" />

## Why this exists

Browser-assisted AI tools usually need several moving pieces to work together: an agent extension, a browser extension, native messaging, content scripts, local sockets, and protocol validation. Getting that wiring correct is tedious and easy to break.

This repository gives you a small, understandable, tested baseline so you can start from working infrastructure instead of rebuilding the bridge from scratch.

## What you get

- **End-to-end type safety** from Pi to the browser extension.
- **Shared TypeBox schemas** and TypeScript protocol types in `packages/shared`.
- **A Pi extension** that registers both a command and a tool.
- **A Chrome/Chromium extension** with popup, background service worker, and content script.
- **A native messaging host** that bridges Chrome native messaging to Pi over a local socket.
- **Build and test scripts** for each part of the project.

## Requirements

- Node.js available on your system path or through `fnm`/`nvm`.
- `pnpm` 10.31 or newer.
- Chrome, Chrome for Testing, or Chromium.
- Pi with this package loaded as a Pi extension.

## Install dependencies

```bash
pnpm install
```

## Build

```bash
pnpm build
```

This creates the browser extension and native host files under `dist/`.

## Load the browser extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select:

```text
dist/chrome-extension
```

5. Copy the generated extension ID from Chrome.

## Install the native host

### macOS/Linux

Copy the command from the extension

<img width="619" height="216" alt="image" src="https://github.com/user-attachments/assets/591efeed-4390-4d3d-a607-10ea91872e69" />

Pass the Chrome extension ID to the installer:

```bash
bash apps/native-host/install/install.sh <extension-id>
```

The installer writes the native messaging manifest for Chrome/Chromium and allows only your loaded extension origin.

You usually do **not** need to rerun this after rebuilding or reloading the extension, unless the extension ID changes.

### Windows

Build first:

```powershell
pnpm build
```

Load the unpacked extension from:

```text
dist/chrome-extension
```

Copy the extension ID from `chrome://extensions`, then run PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File apps/native-host/install/install.ps1 <extension-id>
```

The Windows installer copies the native host under `%LOCALAPPDATA%\pi-browser-template\native` and registers:

```text
HKCU\Software\Google\Chrome\NativeMessagingHosts\com.pi.pi_browser_template
```

Chrome may need to be fully restarted after installing the native host.

## Check the connection

Open the extension popup in Chrome. It will show whether Chrome can reach the native host.

You can also run:

```bash
pnpm diagnose:native
```

On Windows, run:

```powershell
powershell -ExecutionPolicy Bypass -File apps/native-host/install/diagnose.ps1 <extension-id>
```

To uninstall on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File apps/native-host/install/uninstall.ps1
```

## Install in Pi for local development

From the parent folder of this repository, install the package into Pi with a local path:

```bash
pi install ./pi-browser-template
```

If you are already inside this repository, use:

```bash
pi install .
```

After changing the Pi extension code, restart or reload Pi so it picks up the local package changes.

## Use from Pi

This package registers:

- a Pi command named after the package name: `pi-browser-template`
- a Pi tool with a safe tool name based on the package name

The command/tool opens a blank browser window. You can optionally provide a URL.

Example intent:

```text
Open the browser window at https://example.com
```

## Where to start changing things

### Change the browser behavior

Start here:

```text
apps/extension/src/content.ts
apps/extension/src/background.ts
```

`content.ts` controls what happens inside the web page.  
`background.ts` receives protocol messages and routes them to tabs or the native host.

### Change the Pi command or tool

Start here:

```text
apps/pi/src/index.ts
```

This file registers the Pi command and tool, opens the browser window, waits for a response, and reports status back to Pi.

### Add new messages

Start here:

```text
packages/shared/src/messages.ts
packages/shared/src/protocol.ts
packages/shared/src/validation.ts
```

Add the TypeBox schema, export its static TypeScript type, add it to the correct union, then use the shared type everywhere else.

### Change the native host name

The extension config must match the host manifest name:

```text
apps/extension/src/config.ts
apps/extension/public/config.js
```

The current host name is:

```text
com.pi.pi_browser_template
```

If you rename the package, make sure the computed host name and extension config still match. The installer checks this for you.

## Useful scripts

```bash
pnpm build             # build extension + native host and copy assets
pnpm test              # run tests and type checks
pnpm test:build        # build, then test the output
pnpm typecheck         # typecheck every workspace part
pnpm diagnose:native      # inspect macOS/Linux native host installation
pnpm uninstall:native     # remove macOS/Linux native host manifests, installed files, and temp files
pnpm diagnose:native:win  # inspect Windows native host installation
pnpm uninstall:native:win # remove Windows native host registry key and installed files
pnpm clean                # remove dist/
```

## Project map

```text
apps/pi/              Pi extension command and tool
apps/extension/       Chrome extension source and static assets
apps/native-host/     Native messaging host and installer
packages/shared/      Shared schemas, protocol types, and validation
tests/                Unit and build-output tests
scripts/              Build helper scripts
```

## Development workflow

1. Edit shared protocol types first when data changes.
2. Update the Pi, native host, and extension handlers.
3. Run `pnpm test`.
4. Run `pnpm build`.
5. Reload the unpacked extension in Chrome.
6. Try the popup or Pi tool again.

## Cleanup

To uninstall the native messaging host files created by `install.sh`, run:

```bash
pnpm uninstall:native
```

This removes the Chrome/Chromium native messaging manifests, the installed native host directory, and this project's temporary socket/token/log files.

You can also remove the unpacked extension from:

```text
chrome://extensions
```

## Notes

- Chrome native messaging requires an installed host manifest that lists your extension ID.
- Some browser pages are restricted and cannot receive content scripts.
- The native host uses `/tmp` socket/token/log paths on macOS/Linux and a named pipe plus `%LOCALAPPDATA%` token/log files on Windows.
- Keep the shared protocol small. A few clear messages are easier to evolve than one large catch-all message.

## License

MIT
