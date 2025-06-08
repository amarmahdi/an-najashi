#!/bin/bash

# Fix Expo Remote App Dependencies and Build
# This script addresses dependency issues and builds the Remote app

# Set up colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Fixing Expo Remote App Dependencies & Building  ${NC}"
echo -e "${BLUE}================================================${NC}"

# Navigate to expo-remote directory
cd expo-remote || {
  echo -e "${RED}Error: expo-remote directory not found${NC}"
  exit 1
}

# Kill any running Gradle processes that might be stuck
echo -e "${YELLOW}Killing any stuck Gradle processes...${NC}"
pkill -f gradle || true
sleep 2

# Kill any running EAS processes
echo -e "${YELLOW}Killing any EAS build processes...${NC}"
pkill -f eas || true
sleep 2

# Clean up build artifacts
echo -e "${YELLOW}Cleaning previous build artifacts...${NC}"
rm -rf android/app/build
rm -rf android/.gradle
rm -rf node_modules

# Install correct dependencies
echo -e "${YELLOW}Installing correct dependencies...${NC}"
npm install @react-native-async-storage/async-storage@1.23.1
npm install react-native-safe-area-context@4.12.0
npm install react-native-screens@~4.4.0

# Reinstall all dependencies
echo -e "${YELLOW}Reinstalling all dependencies...${NC}"
npm install

# Create a simple eas.json file with preview profile for APK builds
echo -e "${YELLOW}Creating eas.json configuration...${NC}"
cat > eas.json << EOL
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
EOL

# Ensure app.json has the right configuration
echo -e "${YELLOW}Updating app.json configuration...${NC}"
# Backup the original file
cp app.json app.json.bak

# If app.json doesn't exist, create it
if [ ! -f app.json ]; then
  cat > app.json << EOL
{
  "expo": {
    "name": "expo-remote",
    "slug": "expo-remote",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.annajashi.remote"
    },
    "ios": {
      "supportsTablet": true
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
EOL
else
  # Update the Android package in the existing app.json
  tmp=$(mktemp)
  jq '.expo.android.package = "com.annajashi.remote"' app.json > "$tmp" && mv "$tmp" app.json
fi

# Ensure we have the right directories for assets
mkdir -p assets
if [ ! -f assets/icon.png ]; then
  echo -e "${YELLOW}Creating placeholder icon files...${NC}"
  # Create a simple placeholder icon if it doesn't exist (1024x1024 transparent PNG)
  convert -size 1024x1024 xc:transparent assets/icon.png || echo "ImageMagick not installed, skipping icon creation"
  cp assets/icon.png assets/adaptive-icon.png || true
  cp assets/icon.png assets/splash-icon.png || true
fi

# Clean up any old processes before starting the build
echo -e "${YELLOW}Final cleanup before building...${NC}"
pkill -f "node.*expo" || true
pkill -f "expo-cli" || true
sleep 2

# Use expo prebuild to prepare native code
echo -e "${YELLOW}Running expo prebuild to generate native code...${NC}"
npx expo prebuild --clean

# Build using the Android tools directly
echo -e "${YELLOW}Building APK using Gradle directly...${NC}"
cd android

# Run the clean task first
./gradlew clean

# Build the APK
./gradlew assembleRelease

# Check if build was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed! Check the logs above for errors.${NC}"
  cd ..
  exit 1
fi

# Copy the APK to the desktop
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  DEST_APK="$HOME/Desktop/AnNajashi_Remote_$TIMESTAMP.apk"
  
  echo -e "${YELLOW}Copying APK to desktop...${NC}"
  cp "$APK_PATH" "$DEST_APK"
  
  # Get APK size
  APK_SIZE=$(du -h "$DEST_APK" | cut -f1)
  
  echo -e "${GREEN}================================================${NC}"
  echo -e "${GREEN}Remote App built successfully!${NC}"
  echo -e "${GREEN}================================================${NC}"
  echo -e "${BLUE}Location:${NC} $DEST_APK"
  echo -e "${BLUE}Size:${NC} $APK_SIZE"
  echo -e "${GREEN}================================================${NC}"
else
  echo -e "${RED}APK not found at expected location: $APK_PATH${NC}"
  echo -e "${YELLOW}Build may have failed or used a different output location.${NC}"
  
  # Try to find the APK file
  echo -e "${YELLOW}Searching for APK files...${NC}"
  find . -name "*.apk" -type f
fi

# Return to the project root
cd ../..

echo -e "${GREEN}Build process completed.${NC}" 