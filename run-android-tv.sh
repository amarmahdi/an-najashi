#!/bin/bash

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

# Start Metro bundler in the background if not already running
if ! lsof -i:8081 > /dev/null; then
  echo "Starting Metro bundler..."
  npm start &
  # Give it time to start
  sleep 5
fi

# Run the Android build with all environment variables properly set
echo "Building and installing Android TV app..."
cd "$(dirname "$0")"
npx react-native run-android
