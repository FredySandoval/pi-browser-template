# pi-browser-template

**Production-grade ready template for Pi-powered browser extensions**

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![pnpm](https://img.shields.io/badge/pnpm-orange?logo=pnpm&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6.svg)
![Chrome](https://img.shields.io/badge/Chrome-4285F4?logo=googlechrome&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-0078D4?logo=quarto&logoColor=white)
![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)

`pi-browser-template` is a small starter project for connecting a Pi extension to a browser extension through a native messaging host.

The template is **end-to-end type safe**: Pi, the native host, and the browser extension all share validated message types.

The included example lets Pi show an `alert()` in the active browser tab.

## What is included

- `apps/pi` — Pi command and tool.
- `apps/browser-extension` — WXT Chrome/Chromium extension.
- `apps/native-host` — native messaging host that connects Chrome to Pi.
- `packages/native-messaging-schemas` — shared TypeBox message schemas and types.

## Technologies used

- **WXT** — builds and runs the browser extension.
- **TypeScript** — end-to-end type-safe code across Pi, the native host, and the browser extension.
- **pnpm workspaces** — manages the monorepo.
- **Chrome Native Messaging** — lets the browser extension talk to the local native host.
- **Node.js** — runs the native host.
- **TypeBox** — shared runtime schemas and TypeScript types for messages.
- **@webext-core/messaging** — simple typed messaging inside the browser extension.
- **web-ext-native-msg** — installs the native messaging host manifest.

## Requirements

- Node.js
- pnpm 10.31+
- Chrome, Chrome for Testing, or Chromium
- Pi installed locally
- OpenSSL for generating the Chrome extension key

## 1. Install dependencies

```bash
pnpm install
```

## 2. Create the extension key

Chrome needs a stable extension key in development. This keeps your extension ID the same after reloads.

From the repository root, run:

```bash
mkdir -p .keys
openssl genrsa -out .keys/chrome-extension.pem 2048
openssl rsa -in .keys/chrome-extension.pem -pubout -outform DER | openssl base64 -A
```

Copy the long value printed by the last command. It should look like:

```text
MIIBIjANBgkqhkiG9w0BAQEFA...
```

## 3. Create the `.env` files

Open `apps/browser-extension/.env.example` and set:

```env
WXT_CHROME_EXTENSION_KEY="paste-your-key-here"
```

Create the browser extension env file:

```bash
cp apps/browser-extension/.env.example apps/browser-extension/.env
cp apps/native-host/.env.example apps/native-host/.env
```

## 4. Start the browser extension in dev mode

Run:

```bash
pnpm dev
```

WXT will start the extension in development mode. Keep this terminal open.

## 5. Load the extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the extension output folder shown by WXT.

It is usually one of these:

```text
apps/browser-extension/.output/chrome-mv3
dist/chrome-mv3
```

## 6. Install the native host

In a second terminal, run:

```bash
NODE_ENV=development pnpm native-host:setup
# OR
NODE_ENV=production pnpm native-host:setup
```

This installs the native messaging manifest for your browser and allows your extension ID to connect.

If Chrome was already open, fully restart Chrome after this step.

## 7. Check the connection

Open the extension popup in Chrome. It should show whether the native host is connected.

<img width="280" height="156" alt="image" src="https://github.com/user-attachments/assets/7cdfa9d2-5e28-451d-b4aa-16e44ca02acd" />


## 8. Install this package in Pi

From the parent folder of this repository, run:

```bash
pi --no-extensions -e ./
```

Restart or reload Pi after installing.

## 9. Use it from Pi

This project registers:

- Command: `alert-browser`
- Tool: `open_browser_alert`

Try this in Pi:

```text
Run the open_browser_alert tool with the message "Hello from Pi"
```

Or run the command:

```text
/alert-browser Hello from Pi
```

## Useful commands

```bash
pnpm dev                 # start the browser extension in dev mode
pnpm native-host:setup   # build and install the native host
pnpm build               # build all workspaces
pnpm typecheck           # typecheck all workspaces
pnpm clean               # remove generated files
```

## Notes

- The same `WXT_CHROME_EXTENSION_KEY` must be used by the browser extension and native host setup.
- Browser pages like `chrome://extensions` cannot run injected scripts. Test on a normal web page.
- If the extension ID changes, run `pnpm native-host:setup` again.

## License

MIT
