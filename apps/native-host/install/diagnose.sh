#!/bin/bash
set -u

EXTENSION_ID="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
if [ ! -f "$ROOT_DIR/package.json" ]; then
  ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
fi
if [ ! -f "$ROOT_DIR/package.json" ] && [ -f "$ROOT_DIR/dist/package.json" ]; then
  ROOT_DIR="$ROOT_DIR/dist"
fi

failures=0
pass() { echo "PASS $1"; }
fail() { echo "FAIL $1"; failures=$((failures + 1)); }

if [ ! -f "$ROOT_DIR/package.json" ]; then
  fail "package.json not found"
  exit 1
fi

PACKAGE_NAME="$(node -p "require('$ROOT_DIR/package.json').name" 2>/dev/null)"
PACKAGE_SLUG="$(printf '%s' "$PACKAGE_NAME" | sed 's#^@[^/]*/##' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_]/_/g')"
PACKAGE_TITLE="$(node - <<EOF
const name = require('$ROOT_DIR/package.json').name;
console.log(name.replace(/^@[^/]+\//, '').split(/[-_\s]+/).filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join(' '));
EOF
)"
HOST_NAME="com.pi.$PACKAGE_SLUG"
pass "expected host name: $HOST_NAME"

if [[ "${OSTYPE:-}" == "darwin"* ]]; then
  APP_DATA_DIR="$HOME/Library/Application Support/$PACKAGE_TITLE"
  MANIFEST_DIRS=(
    "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    "$HOME/Library/Application Support/Google/ChromeForTesting/NativeMessagingHosts"
    "$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
  )
else
  APP_DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/$PACKAGE_NAME"
  CONFIG_HOME="${CHROME_CONFIG_HOME:-${XDG_CONFIG_HOME:-$HOME/.config}}"
  MANIFEST_DIRS=(
    "$CONFIG_HOME/google-chrome/NativeMessagingHosts"
    "$CONFIG_HOME/google-chrome-for-testing/NativeMessagingHosts"
    "$CONFIG_HOME/chromium/NativeMessagingHosts"
  )
fi

NATIVE_INSTALL_DIR="$APP_DATA_DIR/native"
EXPECTED_PACKAGE="$APP_DATA_DIR/package.json"
EXPECTED_WRAPPER="$NATIVE_INSTALL_DIR/host-wrapper.sh"
EXPECTED_HOST="$NATIVE_INSTALL_DIR/host.cjs"
EXPECTED_UTILS="$NATIVE_INSTALL_DIR/native-utils.cjs"

[ -f "$EXPECTED_PACKAGE" ] && pass "stable package metadata exists: $EXPECTED_PACKAGE" || fail "stable package metadata missing: $EXPECTED_PACKAGE"
[ -f "$EXPECTED_HOST" ] && pass "stable host exists: $EXPECTED_HOST" || fail "stable host missing: $EXPECTED_HOST"
[ -f "$EXPECTED_UTILS" ] && pass "stable native-utils exists: $EXPECTED_UTILS" || fail "stable native-utils missing: $EXPECTED_UTILS"
[ -x "$EXPECTED_WRAPPER" ] && pass "wrapper is executable: $EXPECTED_WRAPPER" || fail "wrapper missing or not executable: $EXPECTED_WRAPPER"

if [ -f "$EXPECTED_WRAPPER" ]; then
  if rg -q '/run/user/|fnm_multishells' "$EXPECTED_WRAPPER"; then
    fail "wrapper contains temporary fnm path: $EXPECTED_WRAPPER"
  else
    pass "wrapper avoids temporary fnm paths"
  fi
fi

CONFIG_HOST_NAME="$(node - <<EOF
const fs = require('fs');
const paths = [
  '$ROOT_DIR/apps/extension/src/config.ts',
  '$ROOT_DIR/chrome-extension/config.js',
  '$ROOT_DIR/dist/chrome-extension/config.js',
];
for (const file of paths) {
  if (!fs.existsSync(file)) continue;
  const match = fs.readFileSync(file, 'utf8').match(/nativeHostName:\s*["']([^"']+)["']/);
  if (match) {
    console.log(match[1]);
    process.exit(0);
  }
}
EOF
)"
if [ -n "$CONFIG_HOST_NAME" ]; then
  [ "$CONFIG_HOST_NAME" = "$HOST_NAME" ] && pass "extension config host name matches" || fail "extension config host name mismatch: $CONFIG_HOST_NAME != $HOST_NAME"
fi

for MANIFEST_DIR in "${MANIFEST_DIRS[@]}"; do
  MANIFEST_PATH="$MANIFEST_DIR/$HOST_NAME.json"
  if [ ! -f "$MANIFEST_PATH" ]; then
    fail "manifest missing: $MANIFEST_PATH"
    continue
  fi
  pass "manifest exists: $MANIFEST_PATH"

  CHECK_OUTPUT="$(node - <<EOF 2>&1
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('$MANIFEST_PATH', 'utf8'));
if (manifest.name !== '$HOST_NAME') throw new Error('name mismatch: ' + manifest.name);
if (manifest.path !== '$EXPECTED_WRAPPER') throw new Error('path mismatch: ' + manifest.path);
if (manifest.type !== 'stdio') throw new Error('type mismatch: ' + manifest.type);
if ('$EXTENSION_ID' && !manifest.allowed_origins?.includes('chrome-extension://$EXTENSION_ID/')) {
  throw new Error('allowed origin missing: chrome-extension://$EXTENSION_ID/');
}
EOF
)"
  [ -z "$CHECK_OUTPUT" ] && pass "manifest JSON is valid: $MANIFEST_PATH" || fail "$CHECK_OUTPUT"
done

if [ "$failures" -eq 0 ]; then
  echo "Done: native host checks passed."
  exit 0
fi

echo "Done: $failures native host check(s) failed."
exit 1
