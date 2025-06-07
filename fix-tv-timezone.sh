#!/bin/bash

# Fix TV App Timezone Script
# This script helps fix the timezone issue on the An-Najashi TV App

# Set up colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}     An-Najashi Prayer Display Timezone Fixer    ${NC}"
echo -e "${BLUE}================================================${NC}"

# Check if adb is installed
if ! command -v adb &> /dev/null; then
    echo -e "${RED}Error: ADB is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install Android Debug Bridge (ADB) first${NC}"
    exit 1
fi

# Check for TV IP address
if [ -z "$1" ]; then
    echo -e "${YELLOW}Please provide your TV's IP address:${NC}"
    read TV_IP
else
    TV_IP=$1
fi

echo -e "${YELLOW}Using TV IP address: ${BLUE}$TV_IP${NC}"

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

# First, let's check if the app is installed
echo -e "${YELLOW}Checking if An-Najashi app is installed...${NC}"
APP_INSTALLED=$(adb shell pm list packages | grep com.annajashi)

if [ -z "$APP_INSTALLED" ]; then
    echo -e "${RED}An-Najashi app not found on the TV${NC}"
    echo -e "${YELLOW}Please install the app first using deploy-to-tv.sh${NC}"
    exit 1
fi

echo -e "${GREEN}An-Najashi app found on the TV${NC}"

# Explain the issue
echo -e "${YELLOW}The app is showing incorrect time because the timezone setting is wrong.${NC}"
echo "This script will update the timezone settings in the app's storage."

# Ask for the timezone value
echo ""
echo -e "${BLUE}What is your current timezone offset from UTC?${NC}"
echo "Examples:"
echo "  • UTC: enter 0"
echo "  • Eastern Time (UTC-5): enter -5"
echo "  • Central European Time (UTC+1): enter 1"
echo "  • India (UTC+5.5): enter 5.5"
echo "  • Japan (UTC+9): enter 9"
echo ""

# Get current device timezone for reference
DEVICE_TZ=$(date +%z)
DEVICE_TZ_HOURS=${DEVICE_TZ:0:3}
DEVICE_TZ_MINS=${DEVICE_TZ:3:2}

if [ "${DEVICE_TZ_MINS}" == "00" ]; then
    DEVICE_TZ_DECIMAL=${DEVICE_TZ_HOURS}
else
    # Convert the minutes part to decimal (30 min = 0.5)
    MINS_DECIMAL=$(awk "BEGIN {print ${DEVICE_TZ_MINS}/60}")
    # For negative TZ, we need to handle the sign correctly
    if [[ "${DEVICE_TZ_HOURS}" == -* ]]; then
        # For negative TZ, we subtract the minutes decimal
        DEVICE_TZ_DECIMAL=$(awk "BEGIN {print ${DEVICE_TZ_HOURS}-${MINS_DECIMAL}}")
    else
        # For positive TZ, we add the minutes decimal
        DEVICE_TZ_DECIMAL=$(awk "BEGIN {print ${DEVICE_TZ_HOURS}+${MINS_DECIMAL}}")
    fi
fi

echo -e "${GREEN}Your system timezone appears to be UTC${DEVICE_TZ_DECIMAL}${NC}"
echo -e "Press Enter to use this value or type a different value:"
read TIMEZONE_INPUT

# Use system timezone if no input provided
if [ -z "$TIMEZONE_INPUT" ]; then
    TIMEZONE=$DEVICE_TZ_DECIMAL
else
    TIMEZONE=$TIMEZONE_INPUT
fi

# Validate the timezone input is a valid number
if ! [[ $TIMEZONE =~ ^[+-]?[0-9]+(\.[0-9]+)?$ ]]; then
    echo -e "${RED}Error: Invalid timezone format. Please enter a number (like -7 or 5.5)${NC}"
    adb disconnect $TV_IP:5555
    exit 1
fi

# Get the current settings to verify they exist
echo -e "${YELLOW}Getting current prayer time settings...${NC}"
SETTINGS_KEY="@prayer_location_settings"
CURRENT_SETTINGS=$(adb shell "run-as com.annajashi cat /data/data/com.annajashi/files/AsyncStorage/${SETTINGS_KEY}")

if [ -z "$CURRENT_SETTINGS" ]; then
    echo -e "${RED}Error: Could not find prayer settings in app storage${NC}"
    echo "The app may need to be run at least once to initialize settings"
    adb disconnect $TV_IP:5555
    exit 1
fi

# Update the timezone in the settings
echo -e "${YELLOW}Updating timezone to UTC${TIMEZONE}...${NC}"

# Create an updated settings JSON with the new timezone value
# This is a more complex operation that either:
# 1. Uses a tool like jq if available
# 2. Or does string manipulation with sed

if command -v jq &> /dev/null; then
    # If jq is available, use it
    UPDATED_SETTINGS=$(echo $CURRENT_SETTINGS | jq ".timezone = $TIMEZONE")
else
    # Basic string replacement (less reliable but works for simple cases)
    # This regex looks for "timezone":-7 or similar and replaces the number
    UPDATED_SETTINGS=$(echo $CURRENT_SETTINGS | sed -E "s/\"timezone\":[+-]?[0-9]+(\.[0-9]+)?/\"timezone\":$TIMEZONE/g")
fi

# Write back the updated settings
echo $UPDATED_SETTINGS | adb shell "run-as com.annajashi tee /data/data/com.annajashi/files/AsyncStorage/${SETTINGS_KEY} > /dev/null"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to update timezone settings${NC}"
    adb disconnect $TV_IP:5555
    exit 1
fi

# Force stop the app so it picks up the new settings on restart
echo -e "${YELLOW}Restarting the app to apply changes...${NC}"
adb shell am force-stop com.annajashi
sleep 1
adb shell monkey -p com.annajashi -c android.intent.category.LAUNCHER 1

echo -e "${GREEN}Success! The timezone has been updated to UTC${TIMEZONE}${NC}"
echo -e "The app has been restarted. Prayer times should now show correctly."
echo ""
echo -e "${BLUE}If there are still issues:${NC}"
echo "1. Make sure the timezone value you entered is correct"
echo "2. Try launching the app manually from the TV"
echo "3. If problems persist, you may need to uninstall and reinstall the app"

# Disconnect from TV
adb disconnect $TV_IP:5555

echo -e "${BLUE}================================================${NC}" 