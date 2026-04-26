#  pi-browser-template

**End-to-end type-safe template for Pi-powered Chrome/Chromium extensions.**

## Overview

pi-browser-template is a focused repo template for projects that need Pi to talk to a browser.
It gives you a clean, working path from a Pi command or tool call, through a native messaging host, into a Chrome/Chromium extension, and back again.

It's designed to be a practical starting point for browser-assisted Pi projects: small enough to understand quickly, but complete enough to build on without redoing the wiring.

## What you get

- **End-to-end type safety** from Pi, to the native host, to the extension.
- **Shared protocol types and runtime schemas** in `packages/shared`.
- **A Pi extension** that registers a command and a tool.
- **A Chrome extension** with a popup, background service worker, and content script.
- **A native messaging host** that bridges Chrome native messaging to Pi over a local socket.
- **Build and test scripts** for each part of the project.

## How the pieces talk

```text
Pi command/tool
  -> apps/pi
  -> local socket + token
  -> apps/native-host
  -> Chrome native messaging
  -> apps/extension background
  -> active tab content script
  -> browser
```

The protocol lives in one place:

```text
packages/shared/src/messages.ts
```

Message types are created from TypeBox schemas, then reused across the Pi extension, native host, browser extension, and tests. If you add or change a message, start there.

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

Pass the Chrome extension ID to the installer:

```bash
bash apps/native-host/install/install.sh <extension-id>
```

The installer writes the native messaging manifest for Chrome/Chromium and allows only your loaded extension origin.

You usually do **not** need to rerun this after rebuilding or reloading the extension, unless the extension ID changes.

## Check the connection

Open the extension popup in Chrome. It will show whether Chrome can reach the native host.

You can also run:

```bash
pnpm diagnose:native
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
pnpm diagnose:native   # inspect native host installation
pnpm uninstall:native  # remove native host manifests, installed files, and temp files
pnpm clean             # remove dist/
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
- The native host writes a local token and socket path under `/tmp` using the package name.
- Keep the shared protocol small. A few clear messages are easier to evolve than one large catch-all message.

## License

MIT
