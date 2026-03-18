#!/bin/bash
# Build ClaudeClock menu bar app using swiftc directly.
# Works without Xcode — only requires Command Line Tools.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCES_DIR="$SCRIPT_DIR/Sources"
BUILD_DIR="$SCRIPT_DIR/.build"
BINARY="$BUILD_DIR/ClaudeClock"

SDK_PATH="$(xcrun --show-sdk-path)"

mkdir -p "$BUILD_DIR"

# Collect all Swift source files
SOURCES=(
    "$SOURCES_DIR/Models/PromoConfig.swift"
    "$SOURCES_DIR/Models/PromoStatus.swift"
    "$SOURCES_DIR/Services/PromoStatusCalculator.swift"
    "$SOURCES_DIR/Services/ConfigLoader.swift"
    "$SOURCES_DIR/Services/NotificationManager.swift"
    "$SOURCES_DIR/Views/MenuBarDropdown.swift"
    "$SOURCES_DIR/ClaudeClockApp.swift"
)

echo "Building ClaudeClock..."
swiftc \
    -sdk "$SDK_PATH" \
    -target x86_64-apple-macos12.0 \
    -parse-as-library \
    -O \
    -o "$BINARY" \
    "${SOURCES[@]}"

echo "Build succeeded: $BINARY"

# Create .app bundle (optional, for LSUIElement support)
APP_DIR="$BUILD_DIR/ClaudeClock.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"

mkdir -p "$MACOS_DIR"
cp "$BINARY" "$MACOS_DIR/ClaudeClock"
cp "$SOURCES_DIR/Info.plist" "$CONTENTS_DIR/Info.plist"

echo "App bundle created: $APP_DIR"
echo "Run with: open $APP_DIR"
