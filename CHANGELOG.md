# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Changed

- Refactored the project into a pnpm workspace with separate apps for the Pi extension, browser extension, and native host.
- Rebuilt the browser extension on WXT with dedicated background, popup, messaging, runtime environment, and manifest configuration modules.
- Replaced the previous blank browser canvas workflow with an active-tab `alert()` bridge from Pi to the browser.
- Renamed and reorganized the shared protocol package into `packages/native-messaging-schemas`, with focused schemas for Pi-to-native-host, native-host-to-Pi, native-host-to-browser, and browser-to-native-host messages.
- Centralized native bridge configuration for socket paths, token paths, Windows named pipes, and alert timeouts.
- Split reusable TypeScript configuration into `packages/typescript-config` for browser and Node targets.

### Added

- Added `apps/pi` with an `alert-browser` command and `open_browser_alert` tool.
- Added `apps/native-host` as a native messaging host plus local JSON-lines socket bridge for Pi communication.
- Added token-based local socket authentication between Pi and the native host.
- Added request/response correlation, alert timeout handling, and session replacement/error result messages.
- Added `packages/env-wxt` for TypeBox-backed WXT/Vite environment validation.
- Added `packages/wxt` helpers for WXT native host configuration keys.
- Added browser-extension popup connection checks through `@webext-core/messaging`.
- Added workspace-level `build`, `typecheck`, `dev`, and `native-host:setup` scripts.

### Removed

- Removed the old single-package/template structure in favor of app/package workspaces.
- Removed the old browser canvas command/tool behavior.
- Removed the previous `packages/shared` protocol package layout.

### Breaking Changes

- Pi usage now exposes `alert-browser` and `open_browser_alert` instead of the earlier browser canvas workflow.
- Shared protocol imports must move from the old shared package to `@repo/native-messaging-schemas`.
- Native host setup now uses the refactored `@repo/native-host` workspace and environment-driven WXT/native host configuration.

## 0.1.0 - 2026-04-25

### Added

- Initial Pi browser template project.
- End-to-end type-safe protocol shared across Pi, the native host, the Chrome/Chromium extension, and tests.
- Shared TypeBox message schemas and TypeScript types in `packages/shared`.
- Pi extension that registers:
  - a command for opening the browser canvas
  - a tool for opening the browser canvas from Pi tool calls
- Chrome/Chromium extension with:
  - Manifest V3 setup
  - background service worker
  - content script
  - popup connection status UI
  - extension icons and static assets
- Native messaging host that bridges Chrome native messaging to Pi through a local socket.
- Native host installer, uninstaller, and diagnostic script.
- Build scripts for extension assets and native host output.
- Test coverage for:
  - shared protocol validation
  - Pi message validation and naming helpers
  - extension URL restriction handling
  - native host message encoding and installer behavior
  - built output checks
- Friendly project README with setup, architecture, cleanup, and development workflow guidance.

### Notes

- This is a template release intended as a starting point for browser-assisted Pi projects.
- The blank browser canvas behavior is intentionally minimal so it can be replaced with project-specific workflows.
