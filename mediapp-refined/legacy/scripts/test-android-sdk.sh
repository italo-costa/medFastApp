#!/bin/bash

# Test Android SDK
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"

echo "Testing Android SDK..."
echo "ANDROID_HOME: $ANDROID_HOME"
echo "PATH contains: $(echo $PATH | grep -o 'Android[^:]*' | head -3)"

# Test ADB
if command -v adb &> /dev/null; then
    echo "✅ ADB found:"
    adb version
else
    echo "❌ ADB not found"
    echo "Looking for ADB in: $ANDROID_HOME/platform-tools"
    ls -la "$ANDROID_HOME/platform-tools/adb" 2>/dev/null || echo "ADB binary not found"
fi

# Test React Native Doctor
cd /mnt/c/workspace/aplicativo/mobile
echo "Testing React Native Doctor..."
npx react-native doctor