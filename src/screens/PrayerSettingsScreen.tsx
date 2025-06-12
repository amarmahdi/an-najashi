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
  TextInput,
  Platform,
  Image,
  findNodeHandle,
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
    prayerNames,
    iqamahOffsets,
    setIqamahOffsets,
    prayerTimeAdjustments,
    setPrayerTimeAdjustments,
    saveSettings,
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

          {/* Prayer Time Adjustments Section */}
          <ShadowCard
            cornerRadius={15}
            backgroundColor="#1a1f26"
            elevation={8}
            shadowOpacity={0.5}
            style={styles.sectionCard}
          >
            <Text style={[styles.sectionTitle, { fontSize: scaleFontSize(20) }]}>
              Prayer Time Adjustments
            </Text>
            <Text style={[styles.sectionDescription, { fontSize: scaleFontSize(14) }]}>
              Adjust prayer times forward (positive) or backward (negative) in minutes
            </Text>

            {prayerNames.map((name: string, index: number) => {
              // Skip Sunrise for prayer time adjustments (since there's no iqamah for Sunrise)
              if (name === 'Sunrise') { return null; }

              return (
                <View key={`prayer-adj-${index}`} style={styles.adjustmentRow}>
                  <Text style={styles.adjustmentLabel}>{name}:</Text>
                  <View style={styles.adjustmentControls}>
                    <TouchableOpacity
                      style={[styles.adjustmentButton, { margin: 10 }]}
                      onPress={() => {
                        const newAdjustments = [...prayerTimeAdjustments];
                        newAdjustments[index] = (newAdjustments[index] || 0) - 1;
                        setPrayerTimeAdjustments(newAdjustments);
                      }}
                      accessibilityLabel={`Decrease ${name} time`}
                      accessible={true}
                      accessibilityRole="button"
                      testID={`decrease-prayer-${index}`}
                      hasTVPreferredFocus={index === 0}
                      nextFocusRight={index * 100 + 1}
                      nextFocusDown={index * 100 + 1}
                    >
                      <Text style={styles.adjustmentButtonText}>-</Text>
                    </TouchableOpacity>

                    <TextInput
                      style={styles.adjustmentInput}
                      value={String(prayerTimeAdjustments[index] || 0)}
                      keyboardType="number-pad"
                      onChangeText={(text) => {
                        const value = parseInt(text, 10) || 0;
                        const newAdjustments = [...prayerTimeAdjustments];
                        newAdjustments[index] = value;
                        setPrayerTimeAdjustments(newAdjustments);
                      }}
                      accessibilityLabel={`${name} time adjustment in minutes`}
                      nextFocusLeft={index * 100}
                      nextFocusRight={index * 100 + 2}
                      nextFocusUp={index > 0 ? (index - 1) * 100 + 1 : index * 100}
                      nextFocusDown={index < 5 ? (index + 1) * 100 : index * 100 + 2}
                    />

                    <TouchableOpacity
                      style={[styles.adjustmentButton, { margin: 10 }]}
                      onPress={() => {
                        const newAdjustments = [...prayerTimeAdjustments];
                        newAdjustments[index] = (newAdjustments[index] || 0) + 1;
                        setPrayerTimeAdjustments(newAdjustments);
                      }}
                      accessibilityLabel={`Increase ${name} time`}
                      accessible={true}
                      accessibilityRole="button"
                      testID={`increase-prayer-${index}`}
                      nextFocusLeft={index * 100 + 1}
                      nextFocusUp={index > 0 ? (index - 1) * 100 + 2 : index * 100}
                      nextFocusDown={index < 5 ? (index + 1) * 100 + 2 : index * 100 + 2}
                    >
                      <Text style={styles.adjustmentButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setPrayerTimeAdjustments([0, 0, 0, 0, 0, 0]);
              }}
              testID="prayer-adjustments-reset"
              accessible={true}
              accessibilityRole="button"
            >
              <Text style={styles.resetButtonText}>Reset Prayer Times</Text>
            </TouchableOpacity>
          </ShadowCard>

          {/* Iqama Time Adjustments Section */}
          <ShadowCard
            cornerRadius={15}
            backgroundColor="#1a1f26"
            elevation={8}
            shadowOpacity={0.5}
            style={styles.sectionCard}
          >
            <Text style={[styles.sectionTitle, { fontSize: scaleFontSize(20) }]}>
              Iqama Time Adjustments
            </Text>
            <Text style={[styles.sectionDescription, { fontSize: scaleFontSize(14) }]}>
              Set minutes after prayer time for iqama
            </Text>

            {prayerNames.map((name: string, index: number) => {
              // Skip sunrise for iqamah offsets (since there's no iqamah for Sunrise)
              if (index === 1) { return null; }

              return (
                <View key={`iqama-adj-${index}`} style={styles.adjustmentRow}>
                  <Text style={styles.adjustmentLabel}>{name}:</Text>
                  <View style={styles.adjustmentControls}>
                    <TouchableOpacity
                      style={[styles.adjustmentButton, { margin: 10 }]}
                      onPress={() => {
                        const newOffsets = [...iqamahOffsets];
                        newOffsets[index] = Math.max(0, (newOffsets[index] || 0) - 1);
                        setIqamahOffsets(newOffsets);
                      }}
                      accessibilityLabel={`Decrease ${name} iqamah time`}
                      accessible={true}
                      accessibilityRole="button"
                      testID={`decrease-iqamah-${index}`}
                      nextFocusRight={(index + 6) * 100 + 1}
                      nextFocusDown={(index + 6) * 100 + 1}
                    >
                      <Text style={styles.adjustmentButtonText}>-</Text>
                    </TouchableOpacity>

                    <TextInput
                      style={styles.adjustmentInput}
                      value={String(iqamahOffsets[index] || 0)}
                      keyboardType="number-pad"
                      onChangeText={(text) => {
                        const value = parseInt(text, 10) || 0;
                        const newOffsets = [...iqamahOffsets];
                        newOffsets[index] = Math.max(0, value);
                        setIqamahOffsets(newOffsets);
                      }}
                      accessibilityLabel={`${name} iqama time offset in minutes`}
                      nextFocusLeft={(index + 6) * 100}
                      nextFocusRight={(index + 6) * 100 + 2}
                      nextFocusUp={index > 0 ? (index + 5) * 100 + 1 : (index + 6) * 100}
                      nextFocusDown={(index < 5 && index !== 1) ? (index + 7) * 100 : (index + 6) * 100 + 2}
                    />

                    <TouchableOpacity
                      style={[styles.adjustmentButton, { margin: 10 }]}
                      onPress={() => {
                        const newOffsets = [...iqamahOffsets];
                        newOffsets[index] = (newOffsets[index] || 0) + 1;
                        setIqamahOffsets(newOffsets);
                      }}
                      accessibilityLabel={`Increase ${name} iqama time`}
                      accessible={true}
                      accessibilityRole="button"
                      testID={`increase-iqamah-${index}`}
                      tvParallaxProperties={{enabled: false}}
                      nextFocusLeft={(index + 6) * 100 + 1}
                      nextFocusUp={index > 0 ? (index + 5) * 100 + 2 : (index + 6) * 100}
                      nextFocusDown={(index < 5 && index !== 1) ? (index + 7) * 100 + 2 : (index + 6) * 100 + 1}
                    >
                      <Text style={styles.adjustmentButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setIqamahOffsets([30, 0, 30, 15, 5, 15]);
              }}
            >
              <Text style={styles.resetButtonText}>Reset Iqama Times</Text>
            </TouchableOpacity>
          </ShadowCard>

          {/* Save Changes Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={async () => {
              await saveSettings();
              if (onBack) {
                onBack();
              }
            }}
          >
            <Text style={styles.saveButtonText}>Save Changes & Return</Text>
          </TouchableOpacity>

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
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  methodButton: {
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  selectedMethod: {
    backgroundColor: 'rgba(25, 118, 210, 0.8)',
  },
  methodButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  saveButtonContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonInner: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  currentSettingsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  currentSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  currentSettingLabel: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  currentSettingValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  adjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  adjustmentLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  adjustmentControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adjustmentButton: {
    backgroundColor: '#333',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#555',
  },
  adjustmentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adjustmentInput: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    height: 40,
    marginHorizontal: 8,
  },
  resetButton: {
    backgroundColor: 'rgba(200, 50, 50, 0.8)',
    borderRadius: 8,
    padding: 10,
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 16,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 12,
    alignSelf: 'center',
    marginTop: 24,
  },
  // saveButtonText is already defined above
  // Original styles for calculation method and high latitude rule buttons
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  selectedMethodButton: {
    backgroundColor: '#4fc3f7',
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
});

export default PrayerSettingsScreen;
