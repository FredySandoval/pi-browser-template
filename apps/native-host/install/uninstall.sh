#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
if [ ! -f "$ROOT_DIR/package.json" ]; then
  ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
fi
if [ ! -f "$ROOT_DIR/package.json" ] && [ -f "$ROOT_DIR/dist/package.json" ]; then
  ROOT_DIR="$ROOT_DIR/dist"
fi
if [ ! -f "$ROOT_DIR/package.json" ]; then
  echo "Error: package.json not found from $SCRIPT_DIR"
  exit 1
fi

node_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$1"
  else
    printf '%s' "$1"
  fi
}

PACKAGE_JSON_NODE="$(node_path "$ROOT_DIR/package.json")"

PACKAGE_NAME="$(PACKAGE_JSON_NODE="$PACKAGE_JSON_NODE" node -p "require(process.env.PACKAGE_JSON_NODE).name")"
PACKAGE_SLUG="$(printf '%s' "$PACKAGE_NAME" | sed 's#^@[^/]*/##' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_]/_/g')"
PACKAGE_TITLE="$(PACKAGE_JSON_NODE="$PACKAGE_JSON_NODE" node - <<'EOF'
const name = require(process.env.PACKAGE_JSON_NODE).name;
console.log(name.replace(/^@[^/]+\//, '').split(/[-_\s]+/).filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join(' '));
EOF
)"
SAFE_PACKAGE_NAME="$(printf '%s' "$PACKAGE_NAME" | sed 's/[^a-zA-Z0-9._-]/-/g')"
HOST_NAME="com.pi.$PACKAGE_SLUG"

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

removed=0
remove_file() {
  local file="$1"
  if [ -e "$file" ] || [ -L "$file" ]; then
    rm -f "$file"
    echo "Removed file: $file"
    removed=$((removed + 1))
  else
    echo "Already gone: $file"
  fi
}

remove_dir() {
  local dir="$1"
  if [ -d "$dir" ]; then
    rm -rf "$dir"
    echo "Removed directory: $dir"
    removed=$((removed + 1))
  else
    echo "Already gone: $dir"
  fi
}

echo "Native host name:"
echo "  $HOST_NAME"
echo

echo "Removing Chrome native messaging manifests:"
for MANIFEST_DIR in "${MANIFEST_DIRS[@]}"; do
  remove_file "$MANIFEST_DIR/$HOST_NAME.json"
done

echo
echo "Removing installed native host files:"
remove_dir "$APP_DATA_DIR"

echo
echo "Removing temporary runtime files:"
remove_file "/tmp/$SAFE_PACKAGE_NAME.sock"
remove_file "/tmp/$SAFE_PACKAGE_NAME.token"
remove_file "/tmp/$SAFE_PACKAGE_NAME-host.log"
remove_file "/tmp/$SAFE_PACKAGE_NAME-host.log.1"

echo
if [ "$removed" -eq 0 ]; then
  echo "Done. Nothing needed to be removed."
else
  echo "Done. Removed $removed item(s)."
fi

echo "You can also remove the unpacked browser extension from chrome://extensions."
