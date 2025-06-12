#!/bin/bash

# Print header
echo "====================================================="
echo "  Running An-Najashi Mosque Prayer Times TV App"
echo "====================================================="

# Export Java and Android environment variables
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.15
export PATH=$JAVA_HOME/bin:$PATH
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Print environment for debugging
echo "JAVA_HOME: $JAVA_HOME"
echo "ANDROID_HOME: $ANDROID_HOME"
echo "java version:"
java -version
echo

# Check for connected Android TV devices
echo "Checking for connected Android TV devices..."
adb devices

# Ensure we're in the project directory
cd "$(dirname "$0")"

# Start Metro bundler in the background if not already running
if ! lsof -i:8081 > /dev/null; then
  echo "Starting Metro bundler..."
  npm start &
  # Give it time to start
  sleep 5
else
  echo "Metro bundler already running on port 8081"
fi

# Build and run the Android TV app
echo "Building and installing Android TV app..."
echo "This may take several minutes for the first build..."

# Run gradlew with clean first
cd android
./gradlew clean
cd ..

# Run the Android build with all environment variables properly set
JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.15 npx react-native run-android

# Provide instructions for testing on an Android TV device/emulator
echo 
echo "====================================================="
echo "  ANDROID TV TESTING INSTRUCTIONS:"
echo "====================================================="
echo "1. Make sure you've connected an Android TV device or started an Android TV emulator"
echo "2. The app should automatically install and launch on your TV device"
echo "3. Use a remote control or D-pad for navigation"
echo "4. If using an emulator, use arrow keys for navigation"
echo "====================================================="
echo 
echo "Waiting 5 seconds for app to load, then showing prayer times logs..."
sleep 5
echo "====================================================="
echo "  PRAYER TIMES DEBUG OUTPUT:"
echo "====================================================="
adb logcat -s ReactNativeJS:V | grep -A 5 "Formatted Times" | head -15
