#!/bin/bash

# Final APK Build Script
set -e

echo "🔨 Building MediApp APK..."

# Set environment
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

# Navigate to android directory
cd /mnt/c/workspace/aplicativo/mobile/android

# Make gradlew executable
chmod +x gradlew

# Build APK
echo "Running gradle clean..."
./gradlew clean

echo "Running gradle assembleDebug..."
./gradlew assembleDebug

# Check if APK was generated
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    echo "✅ APK generated successfully!"
    
    # Copy to dist
    cd ..
    mkdir -p dist
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    cp "android/$APK_PATH" "dist/MediApp-beta-$TIMESTAMP.apk"
    
    echo "📱 APK Location: dist/MediApp-beta-$TIMESTAMP.apk"
    echo "📏 APK Size: $(du -h dist/MediApp-beta-$TIMESTAMP.apk | cut -f1)"
    echo "🎉 Beta APK ready for distribution!"
else
    echo "❌ APK generation failed"
    exit 1
fi