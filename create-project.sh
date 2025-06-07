#!/bin/bash

# Create root directory using React Native CLI with TypeScript template
npx react-native init MosquePrayerApp --template react-native-template-typescript

cd MosquePrayerApp

# Create additional app directories
mkdir -p src/core/prayerTimes src/core/utils src/core/services
mkdir -p src/components/common src/components/prayer src/components/layout src/components/settings
mkdir -p src/screens
mkdir -p src/contexts
mkdir -p src/hooks
mkdir -p src/store/slices
mkdir -p src/styles/themes
mkdir -p src/config
mkdir -p src/assets/images src/assets/sounds

# Create core files
touch src/core/prayerTimes/calculator.ts
touch src/core/prayerTimes/methods.ts
touch src/core/prayerTimes/adjustments.ts
touch src/core/prayerTimes/index.ts

touch src/core/utils/dateHelpers.ts
touch src/core/utils/timeFormatter.ts
touch src/core/utils/qiblaCalculator.ts

touch src/core/services/apiService.ts
touch src/core/services/storageService.ts

# Create component files
touch src/components/common/Clock.tsx
touch src/components/common/DateDisplay.tsx
touch src/components/common/Button.tsx
touch src/components/common/Card.tsx

touch src/components/prayer/PrayerTimeList.tsx
touch src/components/prayer/NextPrayerCountdown.tsx
touch src/components/prayer/PrayerTimeCard.tsx
touch src/components/prayer/WeeklySchedule.tsx

touch src/components/layout/Header.tsx
touch src/components/layout/Footer.tsx
touch src/components/layout/Sidebar.tsx
touch src/components/layout/Layout.tsx

touch src/components/settings/LocationSelector.tsx
touch src/components/settings/MethodSelector.tsx
touch src/components/settings/ThemeSelector.tsx
touch src/components/settings/AdjustmentControls.tsx

# Create screen files
touch src/screens/HomeScreen.tsx
touch src/screens/SettingsScreen.tsx
touch src/screens/JumuahScreen.tsx
touch src/screens/AnnouncementsScreen.tsx
touch src/screens/QiblaScreen.tsx

# Create context files
touch src/contexts/SettingsContext.tsx
touch src/contexts/PrayerTimesContext.tsx
touch src/contexts/ThemeContext.tsx
touch src/contexts/AuthContext.tsx

# Create hooks files
touch src/hooks/usePrayerTimes.ts
touch src/hooks/useCountdown.ts
touch src/hooks/useAsyncStorage.ts
touch src/hooks/useSettings.ts

# Create store files
touch src/store/index.ts
touch src/store/slices/settingsSlice.ts
touch src/store/slices/prayerTimesSlice.ts
touch src/store/persist.ts

# Create style files
touch src/styles/theme.ts
touch src/styles/globalStyles.ts
touch src/styles/themes/light.ts
touch src/styles/themes/dark.ts

# Create config files
touch src/config/default.ts
touch src/config/themes.ts

# Create navigation
mkdir -p src/navigation
touch src/navigation/AppNavigator.tsx
touch src/navigation/NavigationTypes.ts

# Update App.tsx in root to point to our structure
rm App.tsx
touch App.tsx

# Create custom entry point
touch src/index.tsx

# Create README with project structure
touch README.md

echo "React Native TypeScript project structure created successfully!" 