/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { usePrayerTimes } from '../contexts/PrayerTimesContext';

// Import extracted components
import CelestialBody from '../components/celestial/CelestialBody';
import StarBackground from '../components/celestial/StarBackground';
import CloudBackground from '../components/celestial/CloudBackground';
import CustomGradient from '../components/common/CustomGradient';
import TimeOfDayIndicator from '../components/time/TimeOfDayIndicator';
import SilenceOverlay from '../components/prayer/SilenceOverlay';
import ShadowCard from '../components/common/ShadowCard';
import MosqueCard from '../components/prayer/MosqueCard';
import MosqueIconLightHomePage from '../assets/svgs/converted/MosqueIconLightHomePage';

// Import utility functions
import { normalizeSize, scaleFontSize, isSmallScreen } from '../utils/SizeUtils';
import { getBackgroundColors, createSmoothGradient } from '../utils/ColorUtils';

// Import the new settings screen
import PrayerSettingsScreen from './PrayerSettingsScreen';
import BackgroundComponent from '../components/BackgroundComponent';

const SimpleHomeScreen: React.FC = () => {
  const [currentTimeLocal, setCurrentTimeLocal] = useState(new Date());
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const [showSettings, setShowSettings] = useState(false);

  // Use the working PrayerTimesContext
  const {
    prayerTimes,
    iqamahTimes,
    loading,
    error,
    currentTime,
    gregorianDate,
    hijriDate,
    nextIqamahName,
    remainingTime,
    method,
  } = usePrayerTimes();

  console.log('=== HomeScreen Debug ===');
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('PrayerTimes:', prayerTimes);
  console.log('IqamahTimes:', iqamahTimes);
  console.log('CurrentTime:', currentTime);
  console.log('================================');

  // For silence overlay
  const [showSilence, setShowSilence] = useState(false);
  const [silenceMessage, setSilenceMessage] = useState('');

  // Determine if this is a small screen
  const smallScreen = isSmallScreen();

  // Update time every second for UI animations
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeLocal(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pulsing animation for current prayer
  useEffect(() => {
    const pulsate = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulsate).start();

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [pulseAnim]);

  // Calculate these values regardless of loading state
  // Get background colors based on real hour
  const bgColors = getBackgroundColors(null);
  // Create a smooth gradient from the base colors
  const smoothGradientColors = createSmoothGradient(bgColors, 30); // 30 steps between each color

  // Check if it's nighttime for showing stars
  const hourNow = currentTimeLocal.getHours();
  const isNighttime = hourNow >= 18 || hourNow < 6;

  // Early return while loading or if prayer data not yet available
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <StatusBar hidden />
        <Text style={{ color: '#fff', fontSize: normalizeSize(20) }}>Loading prayer times...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar hidden />
        <View style={styles.backgroundGradient}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Format the current time as HH:MM:SS AM/PM
  const formattedTime = currentTime || currentTimeLocal.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Format the date for display
  const hijriDateFormatted = hijriDate || '';
  const gregorianDateFormatted = gregorianDate || currentTimeLocal.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  // Create prayer cards with actual data - fixed order with Sunrise after Fajr
  const prayerCards = prayerTimes ? [
    { name: 'FAJR / فجر', time: prayerTimes[0] || 'N/A', iqamah: iqamahTimes?.[0] || 'N/A' },
    { name: 'SUNRISE / شروق', time: prayerTimes[1] || 'N/A', iqamah: 'SUNRISE' },
    { name: 'DHUHR / ظهر', time: prayerTimes[2] || 'N/A', iqamah: iqamahTimes?.[2] || 'N/A' },
    { name: 'ASR / عصر', time: prayerTimes[3] || 'N/A', iqamah: iqamahTimes?.[3] || 'N/A' },
    { name: 'MAGHRIB / مغرب', time: prayerTimes[4] || 'N/A', iqamah: iqamahTimes?.[4] || 'N/A' },
    { name: 'ISHA / عشاء', time: prayerTimes[5] || 'N/A', iqamah: iqamahTimes?.[5] || 'N/A' },
  ] : [];

  // Determine current prayer index (simplified for now)
  const getCurrentPrayerIndex = (): number => {
    // For now, just return 0 (we can enhance this later)
    return 0;
  };

  const currentPrayerIndex = getCurrentPrayerIndex();

  // Calculate proper card sizes based on screen dimensions
  const cardWidth = Math.max(normalizeSize(120), Dimensions.get('window').width / 8);
  const cardHeight = cardWidth * 1.5;
  const cardMargin = normalizeSize(8);

  // Function to dismiss the silence overlay
  const handleDismissSilence = () => {
    setShowSilence(false);
  };

  // If settings screen is shown, render it instead
  if (showSettings) {
    return (
      <PrayerSettingsScreen
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    // <SafeAreaView style={styles.container}>
    // </SafeAreaView>
    <BackgroundComponent>
      <View style={styles.topLeftIcon}>
        <MosqueIconLightHomePage width={normalizeSize(100)} height={normalizeSize(150)} />
      </View>
    </BackgroundComponent>
  );
};
const styles = StyleSheet.create({
  topLeftIcon: {
    position: 'absolute',
    top: normalizeSize(100),  
    left: normalizeSize(50), 
    zIndex: 1000,
  },
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  backgroundGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: normalizeSize(40),
    backgroundColor: '#243a5e',
    zIndex: 10,
  },
  footerStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: normalizeSize(40),
    backgroundColor: '#243a5e',
    zIndex: 10,
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: normalizeSize(10),
  },
  patternSquare: {
    backgroundColor: '#0e86d5',
    borderRadius: normalizeSize(5),
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalizeSize(20),
  },
  dateHeader: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLabel: {
    color: '#a0a0a0',
    marginBottom: normalizeSize(10),
  },
  currentTime: {
    color: '#4fc3f7',
    fontWeight: 'bold',
  },
  nextIqamah: {
    color: '#81c784',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  prayerTimesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerCardContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalizeSize(10),
  },
  currentPrayerName: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: normalizeSize(5),
  },
  currentPrayerTime: {
    color: '#4fc3f7',
    fontWeight: 'bold',
    marginBottom: normalizeSize(10),
  },
  currentIqamahLabel: {
    color: '#a0a0a0',
    marginBottom: normalizeSize(5),
  },
  currentIqamahTime: {
    color: '#81c784',
    fontWeight: 'bold',
  },
  prayerName: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: normalizeSize(5),
  },
  prayerTime: {
    color: '#4fc3f7',
    fontWeight: 'bold',
    marginBottom: normalizeSize(10),
  },
  iqamahLabel: {
    color: '#a0a0a0',
    marginBottom: normalizeSize(5),
  },
  iqamahTime: {
    color: '#81c784',
    fontWeight: 'bold',
  },
  settingsButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalizeSize(20),
  },
  settingsButton: {
    backgroundColor: '#243a5e',
    paddingVertical: normalizeSize(10),
    paddingHorizontal: normalizeSize(20),
    borderRadius: normalizeSize(20),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: normalizeSize(150),
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: normalizeSize(16),
  },
  errorText: {
    color: '#fff',
    fontSize: normalizeSize(18),
    textAlign: 'center',
    padding: normalizeSize(20),
  },
});

export default SimpleHomeScreen;
