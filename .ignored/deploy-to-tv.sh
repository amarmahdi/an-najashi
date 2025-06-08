#!/bin/bash

# An-Najashi Prayer Display TV App Deployment Helper
# This script helps deploy the app directly to an Android TV device

# Set up colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   An-Najashi Prayer Display TV App Deployer     ${NC}"
echo -e "${BLUE}================================================${NC}"

# Check for TV IP address
if [ -z "$1" ]; then
  echo -e "${YELLOW}Please provide your TV's IP address:${NC}"
  read TV_IP
else
  TV_IP=$1
fi

echo -e "${YELLOW}Using TV IP address: ${BLUE}$TV_IP${NC}"

# Define APK path
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_PATH" ]; then
  echo -e "${RED}Error: APK file not found at $APK_PATH${NC}"
  echo -e "${YELLOW}Running build process first...${NC}"
  
  # Navigate to android directory and run build
  cd android
  ./gradlew clean assembleRelease
  
  # Check if build was successful
  if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Check the logs above for errors.${NC}"
    exit 1
  fi
  
  cd ..
  echo -e "${GREEN}Build completed successfully!${NC}"
fi

# Try to connect to the TV
echo -e "${YELLOW}Connecting to TV at $TV_IP...${NC}"
adb connect $TV_IP:5555

# Check if connection was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to connect to TV at $TV_IP${NC}"
  echo -e "${YELLOW}Make sure:${NC}"
  echo -e "1. Your TV is turned on"
  echo -e "2. Developer options and ADB debugging are enabled"
  echo -e "3. Your TV and computer are on the same network"
  echo -e "4. The IP address is correct"
  exit 1
fi

# Install the app
echo -e "${YELLOW}Installing app on TV...${NC}"
adb install -r "$APK_PATH"

# Check if installation was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to install app on TV${NC}"
  exit 1
fi

# Launch the app
echo -e "${YELLOW}Launching app on TV...${NC}"
adb shell monkey -p com.annajashi -c android.intent.category.LAUNCHER 1

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}App deployed successfully to your TV!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "${YELLOW}To view logs from the TV:${NC}"
echo -e "adb logcat *:E ReactNative:V ReactNativeJS:V"
echo -e "${GREEN}================================================${NC}" 