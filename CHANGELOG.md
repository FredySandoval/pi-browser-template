# Changelog

All notable changes to this project will be documented in this file.

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
