#!/bin/bash

# An-Najashi Prayer Display TV App Exporter
# This script builds and exports the TV app for installation on a TV device

# Set up colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   An-Najashi Prayer Display TV App Exporter     ${NC}"
echo -e "${BLUE}================================================${NC}"

# Check if we need to build
if [ "$1" == "--skip-build" ]; then
  echo -e "${YELLOW}Skipping build process...${NC}"
else
  echo -e "${YELLOW}Building release APK...${NC}"
  
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

# Define source and destination paths
SOURCE_APK="android/app/build/outputs/apk/release/app-release.apk"
DEST_DIRECTORY="$HOME/Desktop"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEST_APK="$DEST_DIRECTORY/AnNajashi_TV_$TIMESTAMP.apk"

# Check if source APK exists
if [ ! -f "$SOURCE_APK" ]; then
  echo -e "${RED}Error: APK file not found at $SOURCE_APK${NC}"
  echo -e "${YELLOW}Did you run the build process?${NC}"
  exit 1
fi

# Copy APK to desktop with timestamp
echo -e "${YELLOW}Copying APK to Desktop...${NC}"
cp "$SOURCE_APK" "$DEST_APK"

# Check if copy was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy APK to $DEST_APK${NC}"
  exit 1
fi

# Get APK size
APK_SIZE=$(du -h "$DEST_APK" | cut -f1)

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}APK exported successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "${BLUE}Location:${NC} $DEST_APK"
echo -e "${BLUE}Size:${NC} $APK_SIZE"
echo -e "${BLUE}Version:${NC} $(grep -oP '"versionName":\s*"\K[^"]*' android/app/build.gradle || echo "1.0")"
echo -e "${GREEN}================================================${NC}"
echo -e "${YELLOW}To install on your TV:${NC}"
echo -e "1. Transfer this APK to a USB drive"
echo -e "2. Connect the USB drive to your TV"
echo -e "3. Use a file manager app on your TV to install the APK"
echo -e ""
echo -e "${YELLOW}Or use ADB to install directly:${NC}"
echo -e "adb connect YOUR_TV_IP:5555  # Connect to your TV"
echo -e "adb install -r \"$DEST_APK\"   # Install the APK"
echo -e "${GREEN}================================================${NC}" 