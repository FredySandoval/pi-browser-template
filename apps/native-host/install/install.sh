#!/bin/bash
set -euo pipefail

EXTENSION_ID="${1:-}"
if [ -z "$EXTENSION_ID" ]; then
  echo "Usage: $0 <extension-id>"
  echo "Get the extension ID from chrome://extensions after loading unpacked"
  exit 1
fi

INSTALL_SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$INSTALL_SCRIPT_DIR/../.." && pwd)"
if [ ! -f "$ROOT_DIR/package.json" ]; then
  ROOT_DIR="$(cd "$INSTALL_SCRIPT_DIR/../../.." && pwd)"
fi
if [ ! -f "$ROOT_DIR/package.json" ] && [ -f "$ROOT_DIR/dist/package.json" ]; then
  ROOT_DIR="$ROOT_DIR/dist"
fi
if [ ! -f "$ROOT_DIR/package.json" ]; then
  echo "Error: package.json not found from $INSTALL_SCRIPT_DIR"
  exit 1
fi

BUILT_NATIVE_DIR="$ROOT_DIR/dist/chrome-extension/native"
if [ ! -f "$BUILT_NATIVE_DIR/host.cjs" ] && [ -f "$INSTALL_SCRIPT_DIR/host.cjs" ]; then
  BUILT_NATIVE_DIR="$INSTALL_SCRIPT_DIR"
fi

HOST_SOURCE="$BUILT_NATIVE_DIR/host.cjs"
UTILS_SOURCE="$BUILT_NATIVE_DIR/native-utils.cjs"
if [ ! -f "$HOST_SOURCE" ] || [ ! -f "$UTILS_SOURCE" ]; then
  echo "Error: built native host files not found. Run pnpm build first."
  echo "Expected:"
  echo "  $HOST_SOURCE"
  echo "  $UTILS_SOURCE"
  exit 1
fi

PACKAGE_NAME="$(node -p "require('$ROOT_DIR/package.json').name")"
PACKAGE_SLUG="$(printf '%s' "$PACKAGE_NAME" | sed 's#^@[^/]*/##' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_]/_/g')"
PACKAGE_TITLE="$(node - <<EOF
const name = require('$ROOT_DIR/package.json').name;
console.log(name.replace(/^@[^/]+\//, '').split(/[-_\s]+/).filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join(' '));
EOF
)"
HOST_NAME="com.pi.$PACKAGE_SLUG"

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

if [ -n "$CONFIG_HOST_NAME" ] && [ "$CONFIG_HOST_NAME" != "$HOST_NAME" ]; then
  echo "Error: native host name mismatch."
  echo
  echo "install.sh computed:"
  echo "  $HOST_NAME"
  echo
  echo "extension config contains:"
  echo "  $CONFIG_HOST_NAME"
  echo
  echo "These must match because background.ts calls chrome.runtime.connectNative(nativeHostName)."
  exit 1
fi

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
HOST_SCRIPT="$NATIVE_INSTALL_DIR/host.cjs"
UTILS_SCRIPT="$NATIVE_INSTALL_DIR/native-utils.cjs"
HOST_PATH="$NATIVE_INSTALL_DIR/host-wrapper.sh"

mkdir -p "$NATIVE_INSTALL_DIR"
cp "$ROOT_DIR/package.json" "$APP_DATA_DIR/package.json"
cp "$HOST_SOURCE" "$HOST_SCRIPT"
cp "$UTILS_SOURCE" "$UTILS_SCRIPT"
chmod +x "$HOST_SCRIPT"

cat >"$HOST_PATH" <<EOF
#!/bin/bash
set -e

HOST_SCRIPT="$HOST_SCRIPT"

for node in \
  "\$HOME/.local/share/fnm/node-versions"/*/installation/bin/node \
  "\$HOME/.nvm/versions/node"/*/bin/node \
  /opt/homebrew/bin/node \
  /usr/local/bin/node \
  /usr/bin/node
do
  if [ -x "\$node" ]; then
    exec "\$node" "\$HOST_SCRIPT" "\$@"
  fi
done

echo "Node.js not found for native host" >&2
exit 1
EOF
chmod +x "$HOST_PATH"

INSTALLED_MANIFESTS=()
for MANIFEST_DIR in "${MANIFEST_DIRS[@]}"; do
  mkdir -p "$MANIFEST_DIR"
  MANIFEST_PATH="$MANIFEST_DIR/$HOST_NAME.json"
  cat >"$MANIFEST_PATH" <<EOF
{
  "name": "$HOST_NAME",
  "description": "$PACKAGE_TITLE native messaging host",
  "path": "$HOST_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF
  INSTALLED_MANIFESTS+=("$MANIFEST_PATH")
done

cat <<EOF
Native host name:
  $HOST_NAME

Installed native host files:
  $APP_DATA_DIR/package.json
  $HOST_SCRIPT
  $UTILS_SCRIPT
  $HOST_PATH

Installed Chrome native messaging manifests:
EOF
for MANIFEST_PATH in "${INSTALLED_MANIFESTS[@]}"; do
  echo "  $MANIFEST_PATH"
done
cat <<EOF

Allowed extension origin:
  chrome-extension://$EXTENSION_ID/

Done.
You should not need to rerun this after Chrome extension reloads or pnpm build.
EOF
