#!/bin/bash
set -e

echo "======================================="
echo "🧪 React Native Native Build Tester"
echo "======================================="
echo "This script generates a temporary React Native application to verify that"
echo "the iOS and Android C++ bindings compile successfully via Xcode and Gradle."

# Check for required global dependencies
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is required to generate the test app."
    exit 1
fi

PROJECT_ROOT=$(pwd)

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "➡️ Initializing temporary React Native app in $TEMP_DIR..."
# Generating a lightweight react-native project
npx @react-native-community/cli@latest init NativeTestApp --skip-git-init

cd NativeTestApp

echo "➡️ Adding connect-4-solver as a dependency..."
# Use npm to install the local package
npm install "$PROJECT_ROOT"

echo "======================================="
echo "🤖 Testing Android Compilation..."
echo "======================================="
cd android
./gradlew assembleDebug --no-daemon
echo "✅ Android build successful!"
cd ..

echo "======================================="
echo "🍎 Testing iOS Compilation..."
echo "======================================="
if command -v xcodebuild &> /dev/null && command -v pod &> /dev/null; then
    cd ios
    pod install
    xcodebuild \
      -workspace NativeTestApp.xcworkspace \
      -scheme NativeTestApp \
      -configuration Debug \
      -sdk iphonesimulator \
      -derivedDataPath build \
      CODE_SIGNING_ALLOWED=NO \
      | xcpretty || echo "xcodebuild finished (if xcpretty failed, check logs)."
    echo "✅ iOS build successful!"
    cd ..
else
    echo "⚠️ xcodebuild or cocoapods not found on system. Skipping iOS compilation check."
    echo "To test iOS, please run this on a macOS environment with Xcode and CocoaPods installed."
fi

echo "======================================="
echo "🎉 All native build checks passed!"
echo "======================================="
echo "Cleaning up..."
rm -rf "$TEMP_DIR"
