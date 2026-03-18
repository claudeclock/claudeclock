#!/bin/bash
# Build ClaudeClock menu bar app using swiftc directly.
# Works without Xcode — only requires Command Line Tools.
# Produces a universal binary (x86_64 + arm64) when possible.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCES_DIR="$SCRIPT_DIR/Sources"
BUILD_DIR="$SCRIPT_DIR/.build"

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

COMMON_FLAGS=(
    -sdk "$SDK_PATH"
    -parse-as-library
    -O
)

HOST_ARCH="$(uname -m)"
UNIVERSAL="$BUILD_DIR/ClaudeClock"

# Build for host architecture (always works)
echo "Building for ${HOST_ARCH}..."
swiftc \
    "${COMMON_FLAGS[@]}" \
    -target "${HOST_ARCH}-apple-macos12.0" \
    -o "$BUILD_DIR/ClaudeClock-${HOST_ARCH}" \
    "${SOURCES[@]}"

# Try the other architecture
if [ "$HOST_ARCH" = "arm64" ]; then
    OTHER_ARCH="x86_64"
else
    OTHER_ARCH="arm64"
fi

echo "Building for ${OTHER_ARCH}..."
if swiftc \
    "${COMMON_FLAGS[@]}" \
    -target "${OTHER_ARCH}-apple-macos12.0" \
    -o "$BUILD_DIR/ClaudeClock-${OTHER_ARCH}" \
    "${SOURCES[@]}" 2>/dev/null; then
    # Create universal binary
    echo "Creating universal binary..."
    lipo -create \
        "$BUILD_DIR/ClaudeClock-${HOST_ARCH}" \
        "$BUILD_DIR/ClaudeClock-${OTHER_ARCH}" \
        -output "$UNIVERSAL"
    rm -f "$BUILD_DIR/ClaudeClock-${HOST_ARCH}" "$BUILD_DIR/ClaudeClock-${OTHER_ARCH}"
    echo "Universal binary (x86_64 + arm64)"
else
    echo "Note: Could not cross-compile for ${OTHER_ARCH}, using ${HOST_ARCH} only"
    mv "$BUILD_DIR/ClaudeClock-${HOST_ARCH}" "$UNIVERSAL"
fi

echo "Build succeeded: $UNIVERSAL"

# Create .app bundle
APP_DIR="$BUILD_DIR/ClaudeClock.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"

mkdir -p "$MACOS_DIR"
cp "$UNIVERSAL" "$MACOS_DIR/ClaudeClock"
cp "$SOURCES_DIR/Info.plist" "$CONTENTS_DIR/Info.plist"

echo "App bundle created: $APP_DIR"
echo "Run with: open $APP_DIR"
