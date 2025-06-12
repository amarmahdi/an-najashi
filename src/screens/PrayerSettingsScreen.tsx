/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { usePrayerTimes, HighLatitudeRuleType } from '../contexts/PrayerTimesContext';

// Import utility functions
import { normalizeSize, scaleFontSize, isSmallScreen } from '../utils/SizeUtils';
import { getBackgroundColors, createSmoothGradient } from '../utils/ColorUtils';

// Import UI components
import CustomGradient from '../components/common/CustomGradient';
import ShadowCard from '../components/common/ShadowCard';

interface PrayerSettingsScreenProps {
  onBack?: () => void;
}

const PrayerSettingsScreen: React.FC<PrayerSettingsScreenProps> = ({ onBack }) => {
  const {
    method,
    setMethod,
    prayerTimes,
  } = usePrayerTimes();

  // For UI effects
  const [currentTime] = useState(new Date());
  const smallScreen = isSmallScreen();

  // Calculate background colors
  const bgColors = getBackgroundColors(null);
  const smoothGradientColors = createSmoothGradient(bgColors, 30);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      {/* Beautiful gradient background */}
      <View style={styles.backgroundGradient}>
        <CustomGradient colors={smoothGradientColors} />

        {/* Header */}
        <View style={styles.headerContainer}>
          <ShadowCard
            cornerRadius={15}
            backgroundColor="#243a5e"
            elevation={8}
            shadowOpacity={0.5}
            style={styles.headerCard}
          >
            <View style={styles.headerContent}>
              {onBack && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBack}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backButtonText}>← Back to Prayer Times</Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.headerTitle, { fontSize: scaleFontSize(24) }]}>
                Prayer Settings
              </Text>
            </View>
          </ShadowCard>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Calculation Method Section */}
          <ShadowCard
            cornerRadius={15}
            backgroundColor="#1a1f26"
            elevation={8}
            shadowOpacity={0.5}
            style={styles.sectionCard}
          >
            <Text style={[styles.sectionTitle, { fontSize: scaleFontSize(20) }]}>
              Calculation Method
            </Text>
            <Text style={[styles.sectionDescription, { fontSize: scaleFontSize(14) }]}>
              Choose the prayer time calculation method that best suits your location
            </Text>

            <View style={styles.buttonGrid}>
              {['ISNA', 'MWL', 'Egypt', 'Makkah', 'Karachi', 'Tehran', 'Jafari'].map((methodName) => (
                <TouchableOpacity
                  key={methodName}
                  style={[
                    styles.methodButton,
                    method.method === methodName && styles.selectedMethodButton,
                  ]}
                  onPress={() => {
                    console.log(`=== CHANGING METHOD TO: ${methodName} ===`);
                    console.log('Previous method:', method.method);
                    setMethod({ ...method, method: methodName });
                    console.log('New method set to:', methodName);
                    console.log('Current prayer times before change:', prayerTimes);
                    setTimeout(() => {
                      console.log('Prayer times after method change:', prayerTimes);
                    }, 1000);
                  }}
                >
                  <Text style={[
                    styles.methodButtonText,
                    method.method === methodName && styles.selectedMethodButtonText,
                  ]}>
                    {methodName}
                  </Text>
                  <Text style={[
                    styles.methodButtonDescription,
                    method.method === methodName && styles.selectedMethodButtonDescription,
                  ]}>
                    {getMethodDescription(methodName)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ShadowCard>

          {/* High Latitude Rule Section */}
          <ShadowCard
            cornerRadius={15}
            backgroundColor="#1a1f26"
            elevation={8}
            shadowOpacity={0.5}
            style={styles.sectionCard}
          >
            <Text style={[styles.sectionTitle, { fontSize: scaleFontSize(20) }]}>
              High Latitude Rule
            </Text>
            <Text style={[styles.sectionDescription, { fontSize: scaleFontSize(14) }]}>
              For locations with extreme daylight hours (like Edmonton in summer)
            </Text>

            <View style={styles.buttonGrid}>
              {Object.entries(HighLatitudeRuleType).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.latitudeButton,
                    method.highLatitudeRule === value && styles.selectedLatitudeButton,
                  ]}
                  onPress={() => {
                    console.log(`=== CHANGING HIGH LATITUDE RULE TO: ${key} (${value}) ===`);
                    console.log('Previous rule:', method.highLatitudeRule);
                    setMethod({ ...method, highLatitudeRule: value });
                    console.log('New high latitude rule set to:', value);
                    console.log('Current prayer times before change:', prayerTimes);
                    setTimeout(() => {
                      console.log('Prayer times after high latitude rule change:', prayerTimes);
                    }, 1000);
                  }}
                >
                  <Text style={[
                    styles.latitudeButtonText,
                    method.highLatitudeRule === value && styles.selectedLatitudeButtonText,
                  ]}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Text>
                  <Text style={[
                    styles.latitudeButtonDescription,
                    method.highLatitudeRule === value && styles.selectedLatitudeButtonDescription,
                  ]}>
                    {getLatitudeRuleDescription(key)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ShadowCard>

          {/* Current Settings Display */}
          <ShadowCard
            cornerRadius={15}
            backgroundColor="#2d4a22"
            elevation={8}
            shadowOpacity={0.5}
            style={styles.sectionCard}
          >
            <Text style={[styles.sectionTitle, { fontSize: scaleFontSize(20) }]}>
              Current Settings
            </Text>
            <View style={styles.currentSettingsContainer}>
              <View style={styles.currentSettingRow}>
                <Text style={styles.currentSettingLabel}>Method:</Text>
                <Text style={styles.currentSettingValue}>{method.method}</Text>
              </View>
              <View style={styles.currentSettingRow}>
                <Text style={styles.currentSettingLabel}>High Latitude Rule:</Text>
                <Text style={styles.currentSettingValue}>
                  {String(method.highLatitudeRule).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
              </View>
            </View>
          </ShadowCard>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Helper function to get method descriptions
const getMethodDescription = (methodName: string): string => {
  const descriptions: { [key: string]: string } = {
    'ISNA': 'Islamic Society of North America',
    'MWL': 'Muslim World League',
    'Egypt': 'Egyptian General Authority of Survey',
    'Makkah': 'Umm Al-Qura University, Makkah',
    'Karachi': 'University of Islamic Sciences',
    'Tehran': 'Institute of Geophysics, University of Tehran',
    'Jafari': 'Ithna Ashari, Leva Institute, Qum',
  };
  return descriptions[methodName] || '';
};

// Helper function to get latitude rule descriptions
const getLatitudeRuleDescription = (ruleName: string): string => {
  const descriptions: { [key: string]: string } = {
    'middleOfTheNight': 'Good for moderate latitudes',
    'seventhOfTheNight': 'Best for Edmonton summer',
    'twilightAngle': 'Uses twilight angle calculation',
  };
  return descriptions[ruleName] || '';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  backgroundGradient: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: normalizeSize(40),
    paddingHorizontal: normalizeSize(20),
    paddingBottom: normalizeSize(20),
  },
  headerCard: {
    padding: normalizeSize(20),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: normalizeSize(10),
  },
  backButtonText: {
    color: '#4fc3f7',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: normalizeSize(20),
    paddingBottom: normalizeSize(40),
  },
  sectionCard: {
    padding: normalizeSize(20),
    marginBottom: normalizeSize(20),
  },
  sectionTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: normalizeSize(10),
  },
  sectionDescription: {
    color: '#a0a0a0',
    marginBottom: normalizeSize(20),
    lineHeight: scaleFontSize(20),
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  methodButton: {
    width: '48%',
    padding: normalizeSize(15),
    backgroundColor: '#2a2a2a',
    borderRadius: normalizeSize(10),
    marginBottom: normalizeSize(10),
    alignItems: 'center',
  },
  selectedMethodButton: {
    backgroundColor: '#4fc3f7',
  },
  methodButtonText: {
    color: '#ffffff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    marginBottom: normalizeSize(5),
  },
  selectedMethodButtonText: {
    color: '#0f1419',
  },
  methodButtonDescription: {
    color: '#a0a0a0',
    fontSize: scaleFontSize(12),
    textAlign: 'center',
  },
  selectedMethodButtonDescription: {
    color: '#0f1419',
  },
  latitudeButton: {
    width: '100%',
    padding: normalizeSize(15),
    backgroundColor: '#2a2a2a',
    borderRadius: normalizeSize(10),
    marginBottom: normalizeSize(10),
    alignItems: 'center',
  },
  selectedLatitudeButton: {
    backgroundColor: '#81c784',
  },
  latitudeButtonText: {
    color: '#ffffff',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    marginBottom: normalizeSize(5),
  },
  selectedLatitudeButtonText: {
    color: '#0f1419',
  },
  latitudeButtonDescription: {
    color: '#a0a0a0',
    fontSize: scaleFontSize(12),
    textAlign: 'center',
  },
  selectedLatitudeButtonDescription: {
    color: '#0f1419',
  },
  currentSettingsContainer: {
    marginTop: normalizeSize(10),
  },
  currentSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalizeSize(10),
  },
  currentSettingLabel: {
    color: '#a0a0a0',
    fontSize: scaleFontSize(16),
  },
  currentSettingValue: {
    color: '#81c784',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
});

export default PrayerSettingsScreen;
