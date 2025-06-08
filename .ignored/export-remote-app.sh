#!/bin/bash

# An-Najashi Prayer Display Remote App Exporter
# This script builds and exports the Remote app for installation on a mobile device

# Set up colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   An-Najashi Prayer Display Remote App Exporter  ${NC}"
echo -e "${BLUE}================================================${NC}"

# Navigate to expo-remote directory
cd expo-remote || {
  echo -e "${RED}Error: expo-remote directory not found${NC}"
  exit 1
}

# Check if we have Expo CLI installed
if ! command -v expo &> /dev/null; then
  echo -e "${YELLOW}Expo CLI not found. Installing...${NC}"
  npm install -g expo-cli
fi

# Check for EAS CLI for modern builds
EAS_BUILD=false
if command -v eas &> /dev/null; then
  EAS_BUILD=true
  echo -e "${GREEN}EAS CLI found. Will use EAS for building.${NC}"
else
  echo -e "${YELLOW}EAS CLI not found. Will use classic expo build.${NC}"
  echo -e "${YELLOW}Consider installing EAS CLI for better builds:${NC}"
  echo -e "${YELLOW}npm install -g eas-cli${NC}"
fi

# Check if any dependencies need to be installed
echo -e "${YELLOW}Checking dependencies...${NC}"
npm install

# Check build mode
echo -e "${YELLOW}Select build option:${NC}"
echo -e "1) Build APK (recommended for testing)"
echo -e "2) Build App Bundle (for Play Store)"
echo -e "3) Build development build with custom dev client"
read -p "Enter your choice (1-3): " BUILD_CHOICE

# Set up build parameters
BUILD_TYPE="apk"
if [ "$BUILD_CHOICE" == "2" ]; then
  BUILD_TYPE="app-bundle"
elif [ "$BUILD_CHOICE" == "3" ]; then
  BUILD_TYPE="development"
fi

# Destination directory for the downloaded APK
DEST_DIRECTORY="$HOME/Desktop"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
APK_NAME="AnNajashi_Remote_$TIMESTAMP.apk"
DEST_APK="$DEST_DIRECTORY/$APK_NAME"

# Start the build process
echo -e "${YELLOW}Starting build process...${NC}"
echo -e "${YELLOW}This might take several minutes...${NC}"

if [ "$EAS_BUILD" = true ]; then
  # Using EAS Build
  if [ "$BUILD_TYPE" == "development" ]; then
    echo -e "${YELLOW}Creating development build...${NC}"
    eas build --platform android --profile development --local
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}Build failed! Check the logs above for errors.${NC}"
      exit 1
    fi
    
    # Find the latest build file
    BUILD_FILE=$(find . -name "*.apk" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
    
  else
    echo -e "${YELLOW}Creating production build...${NC}"
    if [ "$BUILD_TYPE" == "apk" ]; then
      eas build --platform android --profile preview --local
    else
      eas build --platform android --profile production --local
    fi
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}Build failed! Check the logs above for errors.${NC}"
      exit 1
    fi
    
    # Find the latest build file
    if [ "$BUILD_TYPE" == "apk" ]; then
      BUILD_FILE=$(find . -name "*.apk" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
    else
      BUILD_FILE=$(find . -name "*.aab" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
    fi
  fi
  
  # Copy the build file to desktop
  if [ -n "$BUILD_FILE" ]; then
    cp "$BUILD_FILE" "$DEST_APK"
    echo -e "${GREEN}Build copied to desktop: $DEST_APK${NC}"
  else
    echo -e "${RED}Could not find build file${NC}"
    echo -e "${YELLOW}You can find your build in the EAS dashboard${NC}"
    exit 1
  fi
  
else
  # Using Classic Expo Build
  echo -e "${YELLOW}Starting Expo build (this will take some time)...${NC}"
  if [ "$BUILD_TYPE" == "apk" ]; then
    expo build:android -t apk
  else
    expo build:android -t app-bundle
  fi
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Check the logs above for errors.${NC}"
    exit 1
  fi
  
  # Prompt user to download the APK from Expo's servers
  echo -e "${YELLOW}Your build has completed!${NC}"
  echo -e "${YELLOW}Please download the APK from the link provided by Expo${NC}"
  echo -e "${YELLOW}Then move it to your desktop or use the URL directly${NC}"
  
  echo -e "${YELLOW}Would you like to download the APK automatically? (y/n)${NC}"
  read DOWNLOAD_CHOICE
  
  if [ "$DOWNLOAD_CHOICE" == "y" ] || [ "$DOWNLOAD_CHOICE" == "Y" ]; then
    echo -e "${YELLOW}Please enter the URL provided by Expo:${NC}"
    read APK_URL
    
    echo -e "${YELLOW}Downloading APK...${NC}"
    curl -L "$APK_URL" -o "$DEST_APK"
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}Download failed! Please download manually.${NC}"
      exit 1
    fi
    
    echo -e "${GREEN}APK downloaded to: $DEST_APK${NC}"
  fi
fi

# Navigate back to project root
cd ..

# Get APK size if file exists
if [ -f "$DEST_APK" ]; then
  APK_SIZE=$(du -h "$DEST_APK" | cut -f1)

  echo -e "${GREEN}================================================${NC}"
  echo -e "${GREEN}Remote App exported successfully!${NC}"
  echo -e "${GREEN}================================================${NC}"
  echo -e "${BLUE}Location:${NC} $DEST_APK"
  echo -e "${BLUE}Size:${NC} $APK_SIZE"
  echo -e "${GREEN}================================================${NC}"
  echo -e "${YELLOW}To install on your device:${NC}"
  echo -e "1. Transfer this APK to your Android device"
  echo -e "2. Install using a file manager"
  echo -e ""
  echo -e "${YELLOW}Or use ADB to install directly:${NC}"
  echo -e "adb install -r \"$DEST_APK\""
  echo -e "${GREEN}================================================${NC}"
else
  echo -e "${YELLOW}================================================${NC}"
  echo -e "${YELLOW}Build completed, but no local APK was generated.${NC}"
  echo -e "${YELLOW}If you used EAS Cloud builds, download from the EAS Dashboard.${NC}"
  echo -e "${YELLOW}================================================${NC}"
fi 