#!/usr/bin/env bash
set -e

# Android Release Manifest Updater (Bash / macOS / Linux / CI)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFEST_PATH="$ROOT_DIR/update.json"
APK_PATH="${1:-$ROOT_DIR/downloads/app-release.apk}"

echo "======================================================"
echo "  Android Release Manifest Updater (Bash)"
echo "======================================================"

if [ ! -f "$APK_PATH" ]; then
  echo "Error: APK not found at $APK_PATH"
  exit 1
fi

# Calculate SHA256 using sha256sum or shasum
if command -v sha256sum >/dev/null 2>&1; then
  SHA256=$(sha256sum "$APK_PATH" | awk '{print $1}')
elif command -v shasum >/dev/null 2>&1; then
  SHA256=$(shasum -a 256 "$APK_PATH" | awk '{print $1}')
else
  echo "Error: Neither sha256sum nor shasum found on your system."
  exit 1
fi

echo "APK File:     $APK_PATH"
echo "SHA-256 Hash: $SHA256"

# Run the node helper to update JSON cleanly if node is available
if command -v node >/dev/null 2>&1; then
  node "$SCRIPT_DIR/generate-manifest.js" --apk "$APK_PATH"
else
  echo "Node.js not installed. Replace \"sha256\": \"$SHA256\" in update.json manually."
fi
