/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    Platform,
} from 'react-native';
import { SPACING } from '../styles/theme';
import { PrayerTimes, IqamahTimes, formatTime, getTimeRemaining } from '../core/prayerTimes';
import prayerDataService from '../core/PrayerDataService';
import locationService from '../core/LocationSettings';

// Import extracted components
import CelestialBody from '../components/celestial/CelestialBody';
import StarBackground from '../components/celestial/StarBackground';
import CloudBackground from '../components/celestial/CloudBackground';
import MosqueDome from '../components/prayer/MosqueDome';
import CustomGradient from '../components/common/CustomGradient';
import TimeOfDayIndicator from '../components/time/TimeOfDayIndicator';
import SilenceOverlay from '../components/prayer/SilenceOverlay';
import ShadowCard from '../components/common/ShadowCard';
import MosqueCard from '../components/prayer/MosqueCard';

// Import utility functions
import { normalizeSize, scaleFontSize, isSmallScreen } from '../utils/SizeUtils';
import { getBackgroundColors, createSmoothGradient } from '../utils/ColorUtils';

const ConnectionDebugger = () => null;

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [prayerData, setPrayerData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    // For silence overlay
    const [showSilence, setShowSilence] = useState(false);
    const [manuallyDismissed, setManuallyDismissed] = useState<{[key: string]: boolean}>({});
    const [lastDismissTime, setLastDismissTime] = useState(0);
    const [silenceMessage, setSilenceMessage] = useState('');

    // Define time windows as constants (moved outside useEffect)
    const ADHAN_WINDOW_MS = 90000; // 1.5 minutes window for adhan detection (±45 seconds)
    const IQAMAH_BEFORE_WINDOW_MS = 180000; // 3 minutes before iqamah
    const CHECK_INTERVAL_MS = 5000; // Check every 5 seconds for more precision
    const LOOK_AHEAD_MS = 300000; // Look ahead 5 minutes for scheduling

    // Store timers for cleanup (moved outside useEffect)
    const timersRef = useRef<NodeJS.Timeout[]>([]);

    // Function to schedule a notification for an upcoming event (moved outside useEffect)
    const scheduleNotification = useCallback(
        (type: 'adhan' | 'iqamah', name: string, timeMs: number) => {
            console.log(`Scheduling ${type} notification for ${name} in ${timeMs}ms`);

            // Set timeout to display the notification at the exact time
            const timer = setTimeout(() => {
                if (type === 'adhan') {
                    console.log(`Scheduled adhan notification triggered for ${name}`);
                    setSilenceMessage(`It's time for ${name} Adhan`);
                    setShowSilence(true);
                } else {
                    console.log(`Scheduled iqamah notification triggered for ${name}`);
                    setSilenceMessage(`${name} Iqamah will begin shortly`);
                    setShowSilence(true);
                }
            }, timeMs);

            // Store the timer for cleanup
            timersRef.current.push(timer);
        },
        [setSilenceMessage, setShowSilence]
    );

    // Function to check prayer times (moved outside useEffect)
    const checkPrayerTimes = useCallback(() => {
        if (prayerData) {
            const now = new Date();
            const { prayerTimes, iqamahTimes } = prayerData;

            // List of prayer names (excluding sunrise which doesn't have iqamah)
            const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
            const displayNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

            // Track the most imminent event (lowest positive time difference)
            let closestEvent = {
                type: '', // 'adhan' or 'iqamah'
                name: '',
                timeDifference: Number.MAX_SAFE_INTEGER,
            };

            // For debugging
            console.log(`Checking prayer times at: ${now.toLocaleTimeString()}`);

            // Clear all existing timers before checking
            timersRef.current.forEach(timer => clearTimeout(timer));
            timersRef.current = [];

            // Check all prayer times to find the most imminent event and schedule upcoming events
            for (let i = 0; i < prayerNames.length; i++) {
                const prayerName = prayerNames[i];
                const displayName = displayNames[i];
                const prayerTime = prayerTimes[prayerName as keyof PrayerTimes];
                const iqamahTime = iqamahTimes[prayerName as keyof IqamahTimes];

                // Calculate time differences
                const adhanDiffMs = prayerTime.getTime() - now.getTime();
                const iqamahBeforeDiffMs = iqamahTime.getTime() - now.getTime() - IQAMAH_BEFORE_WINDOW_MS;

                // Check for adhan time (current adhan)
                if (Math.abs(adhanDiffMs) <= ADHAN_WINDOW_MS) {
                    console.log(`${displayName} Adhan time diff: ${adhanDiffMs}ms (current)`);
                    if (Math.abs(adhanDiffMs) < closestEvent.timeDifference) {
                        closestEvent = {
                            type: 'adhan',
                            name: displayName,
                            timeDifference: Math.abs(adhanDiffMs),
                        };
                    }
                }
                // Schedule future adhan
                else if (adhanDiffMs > 0 && adhanDiffMs <= LOOK_AHEAD_MS) {
                    console.log(`Found upcoming adhan for ${displayName} in ${adhanDiffMs}ms`);
                    scheduleNotification('adhan', displayName, adhanDiffMs);
                }

                // Check for iqamah time (1 minute before - current iqamah)
                if (iqamahBeforeDiffMs >= 0 && iqamahBeforeDiffMs <= IQAMAH_BEFORE_WINDOW_MS) {
                    console.log(`${displayName} Iqamah time diff: ${iqamahBeforeDiffMs}ms (current)`);
                    if (iqamahBeforeDiffMs < closestEvent.timeDifference) {
                        closestEvent = {
                            type: 'iqamah',
                            name: displayName,
                            timeDifference: iqamahBeforeDiffMs,
                        };
                    }
                }
                // Schedule future iqamah
                else if (iqamahBeforeDiffMs > 0 && iqamahBeforeDiffMs <= LOOK_AHEAD_MS) {
                    console.log(`Found upcoming iqamah for ${displayName} in ${iqamahBeforeDiffMs}ms`);
                    scheduleNotification('iqamah', displayName, iqamahBeforeDiffMs);
                }
            }

            // Show overlay for the most imminent event, if any
            if (closestEvent.type === 'adhan' || closestEvent.type === 'iqamah') {
                const newMessage = closestEvent.type === 'adhan'
                    ? `It's time for ${closestEvent.name} Adhan`
                    : `${closestEvent.name} Iqamah will begin shortly`;

                // Check if this event was manually dismissed by the user
                const wasManuallyDismissed = manuallyDismissed[newMessage];
                // Only show if not manually dismissed or it's been more than 2 minutes since dismissal
                const dismissTimeExceeded = (Date.now() - lastDismissTime) > 120000; // 2 minutes

                if (!wasManuallyDismissed || dismissTimeExceeded) {
                    console.log(`Showing ${closestEvent.type} overlay for ${closestEvent.name}`);
                    setSilenceMessage(newMessage);
                    setShowSilence(true);

                    // If the dismiss timeout has expired, clear the dismissed status
                    if (dismissTimeExceeded && wasManuallyDismissed) {
                        setManuallyDismissed(prev => {
                            const updated = {...prev};
                            delete updated[newMessage];
                            return updated;
                        });
                    }
                } else {
                    console.log(`Skipping ${closestEvent.type} overlay - manually dismissed by user`);
                }
            } else {
                // No imminent events found
                if (showSilence) {
                    console.log('Hiding silence overlay - no events found');
                    setShowSilence(false);
                }
            }
        } else {
            console.log('Prayer data not available, skipping check');
        }
    }, [prayerData, scheduleNotification, manuallyDismissed, lastDismissTime, showSilence]);

    // Initialize prayer data on component mount
    useEffect(() => {
        const initializeData = async () => {
            try {
                await prayerDataService.initialize();
                const data = await prayerDataService.getPrayerData();
                setPrayerData(data);
                setLoading(false);
            } catch (error) {
                console.error('Error initializing prayer data:', error);
                setLoading(false);
            }
        };

        initializeData();
    }, []);

    // Determine if this is a small screen
    const smallScreen = isSmallScreen();

    // Update time every second and check for prayer time updates
    useEffect(() => {
        const timer = setInterval(async () => {
            // Always get the real device time
            const now = new Date();

            // Update with the real time
            setCurrentTime(now);

            // Check if we need to refresh prayer times (e.g., at midnight)
            if (prayerData && now.getHours() === 0 && now.getMinutes() === 0) {
                try {
                    const refreshedData = await prayerDataService.refreshPrayerData();
                    setPrayerData(refreshedData);
                } catch (error) {
                    console.error('Error refreshing prayer data:', error);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [prayerData]);

    // Pulsing animation for current prayer - simplified
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

    // Format the current time as HH:MM:SS AM/PM
    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    // Calculate these values regardless of loading state
    // Get background colors based on real hour
    const bgColors = getBackgroundColors(null);
    // Create a smooth gradient from the base colors
    const smoothGradientColors = createSmoothGradient(bgColors, 30); // 30 steps between each color

    // Check if it's nighttime for showing stars
    const hourNow = currentTime.getHours();
    const isNighttime = hourNow >= 18 || hourNow < 6;

    // Check if it's adhan time or 1 minute before iqamah time
    useEffect(() => {
        // Only set up the interval if prayer data is available
        if (prayerData) {
            checkPrayerTimes();
            const interval = setInterval(checkPrayerTimes, CHECK_INTERVAL_MS);

            // Cleanup function
            return () => {
                clearInterval(interval);
                // Clear all scheduled timers
                timersRef.current.forEach(timer => clearTimeout(timer));
            };
        }
    }, [prayerData, checkPrayerTimes, CHECK_INTERVAL_MS, timersRef]);

    // Early return while loading or if prayer data not yet available
    if (loading || !prayerData) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <StatusBar hidden />
                <Text style={{ color: '#fff', fontSize: normalizeSize(20) }}>Loading prayer times...</Text>
            </SafeAreaView>
        );
    }

    // Get data from prayer service
    const { prayerTimes, iqamahTimes, hijriDate, nextPrayer } = prayerData;

    // Format the date for display
    const hijriDateFormatted = `${hijriDate.day} ${hijriDate.monthName.toUpperCase()}, ${hijriDate.year}`;
    const gregorianDate = currentTime.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).toUpperCase();

    // Calculate time until next Iqamah
    const getNextIqamahInfo = () => {
        const now = new Date();
        // Sort prayer names including sunrise but we'll handle it specially
        const prayerNames = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const prayerDisplayNames = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        // Get next prayer time
        let nextPrayerIndex = -1;
        let nextIqamahTime = null;
        let timeUntilNext = '';
        let isTomorrow = false;

        // Find the next prayer time
        for (let i = 0; i < prayerNames.length; i++) {
            const prayerName = prayerNames[i];
            // Skip sunrise when checking for iqamah times since it doesn't have one
            if (prayerName === 'sunrise') {
                const sunriseTime = prayerTimes.sunrise;
                if (now < sunriseTime) {
                    nextPrayerIndex = i;
                    // For sunrise, we don't have iqamah, so look for the next prayer with iqamah
                    timeUntilNext = 'sunrise';
                    break;
                }
                continue;
            }

            const prayerTime = prayerTimes[prayerName as keyof PrayerTimes];
            const iqamahTime = iqamahTimes[prayerName as keyof IqamahTimes];

            if (now < iqamahTime) {
                nextPrayerIndex = i;
                nextIqamahTime = iqamahTime;
                timeUntilNext = getTimeRemaining(iqamahTime);
                break;
            }
        }

        // If we didn't find a next prayer, it's tomorrow's Fajr
        if (nextPrayerIndex === -1) {
            nextPrayerIndex = 0; // Fajr
            isTomorrow = true;
            timeUntilNext = 'tomorrow';
        }

        // Special case: if next prayer is Sunrise, we need to find the next prayer with an Iqamah time
        if (prayerNames[nextPrayerIndex] === 'sunrise') {
            // Look for the next prayer after Sunrise
            for (let i = nextPrayerIndex + 1; i < prayerNames.length; i++) {
                const prayerName = prayerNames[i];
                if (prayerName !== 'sunrise') {
                    // Found the next prayer with Iqamah time
                    const iqamahTime = iqamahTimes[prayerName as keyof IqamahTimes];
                    return {
                        name: prayerDisplayNames[i],
                        time: formatTime(iqamahTime),
                        remaining: timeUntilNext === 'sunrise' ? 'after sunrise' : timeUntilNext,
                    };
                }
            }
            // If we get here, all prayers are done for today, so it's tomorrow's Fajr
            return {
                name: 'Fajr',
                time: formatTime(iqamahTimes.fajr),
                remaining: 'tomorrow',
            };
        }

        return {
            name: prayerDisplayNames[nextPrayerIndex],
            time: nextIqamahTime ? formatTime(nextIqamahTime) : '',
            remaining: timeUntilNext,
        };
    };

    // Get next iqamah info
    const nextIqamahInfo = getNextIqamahInfo();

    // Create prayer cards with actual data - fixed order with Sunrise after Fajr
    const prayerCards = [
        { name: 'FAJR / فجر', time: formatTime(prayerTimes.fajr), iqamah: formatTime(iqamahTimes.fajr) },
        { name: 'SUNRISE / شروق', time: formatTime(prayerTimes.sunrise), iqamah: 'SUNRISE' },
        { name: 'DHUHR / ظهر', time: formatTime(prayerTimes.dhuhr), iqamah: formatTime(iqamahTimes.dhuhr) },
        { name: 'ASR / عصر', time: formatTime(prayerTimes.asr), iqamah: formatTime(iqamahTimes.asr) },
        { name: 'MAGHRIB / مغرب', time: formatTime(prayerTimes.maghrib), iqamah: formatTime(iqamahTimes.maghrib) },
        { name: 'ISHA / عشاء', time: formatTime(prayerTimes.isha), iqamah: formatTime(iqamahTimes.isha) },
    ];

    // Determine current prayer
    const getCurrentPrayerIndex = (): number => {
        // Get current time and prayer times as Date objects
        const now = new Date();
        const fajr = prayerTimes.fajr;
        const sunrise = prayerTimes.sunrise;
        const dhuhr = prayerTimes.dhuhr;
        const asr = prayerTimes.asr;
        const maghrib = prayerTimes.maghrib;
        const isha = prayerTimes.isha;

        // Helper function to get minutes since midnight for proper time comparison
        const getMinutesSinceMidnight = (date: Date): number => {
            return date.getHours() * 60 + date.getMinutes();
        };

        // Helper function to format time for display (HHMM format)
        const getTimeValue = (date: Date): number => {
            return date.getHours() * 100 + date.getMinutes();
        };

        // Get current time value for display
        const currentTimeValue = getTimeValue(now);

        // Get minute values for accurate time comparison
        const currentMinutes = getMinutesSinceMidnight(now);
        const fajrMinutes = getMinutesSinceMidnight(fajr);
        const sunriseMinutes = getMinutesSinceMidnight(sunrise);
        const dhuhrMinutes = getMinutesSinceMidnight(dhuhr);
        const asrMinutes = getMinutesSinceMidnight(asr);
        const maghribMinutes = getMinutesSinceMidnight(maghrib);
        const ishaMinutes = getMinutesSinceMidnight(isha);

        // For display in logs
        const fajrValue = getTimeValue(fajr);
        const sunriseValue = getTimeValue(sunrise);
        const dhuhrValue = getTimeValue(dhuhr);
        const asrValue = getTimeValue(asr);
        const maghribValue = getTimeValue(maghrib);
        const ishaValue = getTimeValue(isha);

        // Function to get minutes difference between times, handling day boundaries
        const getMinutesDifference = (currentMins: number, prayerMins: number): number => {
            // Calculate difference
            let minutesDifference = currentMins - prayerMins;

            // Handle day boundary cases (e.g., prayer at 11:55 PM, current time at 12:05 AM)
            if (minutesDifference < -1430 || minutesDifference > 1430) {
                minutesDifference = minutesDifference > 0 ? minutesDifference - 1440 : minutesDifference + 1440;
            }

            return minutesDifference;
        };

        // Debug output
        console.log(`Current time: ${now.getHours()}:${now.getMinutes()} (${currentTimeValue})`);
        console.log(`Fajr: ${fajr.getHours()}:${fajr.getMinutes()} (${fajrValue})`);
        console.log(`Sunrise: ${sunrise.getHours()}:${sunrise.getMinutes()} (${sunriseValue})`);
        console.log(`Dhuhr: ${dhuhr.getHours()}:${dhuhr.getMinutes()} (${dhuhrValue})`);
        console.log(`Asr: ${asr.getHours()}:${asr.getMinutes()} (${asrValue})`);
        console.log(`Maghrib: ${maghrib.getHours()}:${maghrib.getMinutes()} (${maghribValue})`);
        console.log(`Isha: ${isha.getHours()}:${isha.getMinutes()} (${ishaValue})`);

        // First, special handling for times after midnight (12 AM - 4 AM)
        // In this case, we want to highlight Fajr as the next prayer
        if (now.getHours() < 4) {
            console.log('After midnight, before Fajr: highlighting Fajr as next prayer');
            return 0; // Return Fajr (index 0)
        }

        // Check if prayer time was recent (within 10 minutes)
        const fajrMinutesDiff = getMinutesDifference(currentMinutes, fajrMinutes);
        const sunriseMinutesDiff = getMinutesDifference(currentMinutes, sunriseMinutes);
        const dhuhrMinutesDiff = getMinutesDifference(currentMinutes, dhuhrMinutes);
        const asrMinutesDiff = getMinutesDifference(currentMinutes, asrMinutes);
        const maghribMinutesDiff = getMinutesDifference(currentMinutes, maghribMinutes);
        const ishaMinutesDiff = getMinutesDifference(currentMinutes, ishaMinutes);

        console.log(`Minutes differences - Fajr: ${fajrMinutesDiff}, Sunrise: ${sunriseMinutesDiff}, Dhuhr: ${dhuhrMinutesDiff}, Asr: ${asrMinutesDiff}, Maghrib: ${maghribMinutesDiff}, Isha: ${ishaMinutesDiff}`);

        // If current time is within 10 minutes after any prayer, highlight that prayer
        if (fajrMinutesDiff >= 0 && fajrMinutesDiff <= 10) {
            console.log(`Highlighting Fajr (${fajrMinutesDiff} minutes after)`);
            return 0;
        }

        if (sunriseMinutesDiff >= 0 && sunriseMinutesDiff <= 10) {
            console.log(`Highlighting Sunrise (${sunriseMinutesDiff} minutes after)`);
            return 1;
        }

        if (dhuhrMinutesDiff >= 0 && dhuhrMinutesDiff <= 10) {
            console.log(`Highlighting Dhuhr (${dhuhrMinutesDiff} minutes after)`);
            return 2;
        }

        if (asrMinutesDiff >= 0 && asrMinutesDiff <= 10) {
            console.log(`Highlighting Asr (${asrMinutesDiff} minutes after)`);
            return 3;
        }

        if (maghribMinutesDiff >= 0 && maghribMinutesDiff <= 10) {
            console.log(`Highlighting Maghrib (${maghribMinutesDiff} minutes after)`);
            return 4;
        }

        if (ishaMinutesDiff >= 0 && ishaMinutesDiff <= 10) {
            console.log(`Highlighting Isha (${ishaMinutesDiff} minutes after)`);
            return 5;
        }

        // Check if current time is before Fajr
        if (currentMinutes < fajrMinutes) {
            console.log('Next prayer: Fajr (after midnight, before Fajr)');
            return 0;
        }

        // Check if current time is before Sunrise
        if (currentMinutes < sunriseMinutes) {
            console.log('Next prayer: Sunrise (after Fajr, before Sunrise)');
            return 1;
        }

        // Check if current time is before Dhuhr
        if (currentMinutes < dhuhrMinutes) {
            console.log('Next prayer: Dhuhr (after Sunrise, before Dhuhr)');
            return 2;
        }

        // Check if current time is before Asr
        if (currentMinutes < asrMinutes) {
            console.log('Next prayer: Asr (after Dhuhr, before Asr)');
            return 3;
        }

        // Check if current time is before Maghrib
        if (currentMinutes < maghribMinutes) {
            console.log('Next prayer: Maghrib (after Asr, before Maghrib)');
            return 4;
        }

        // Check if current time is before Isha
        if (currentMinutes < ishaMinutes) {
            console.log('Next prayer: Isha (after Maghrib, before Isha)');
            return 5;
        }

        // If current time is after Isha, the next prayer is Fajr tomorrow
        console.log('Next prayer: Fajr (tomorrow)');
        return 0; // Return Fajr as the next prayer
    };

    const currentPrayerIndex = getCurrentPrayerIndex();

    // Calculate proper card sizes based on screen dimensions
    const { width: windowWidth } = Dimensions.get('window');
    const cardWidth = Math.max(normalizeSize(120), windowWidth / 8);
    const cardHeight = cardWidth * 1.5;
    const cardMargin = normalizeSize(8);
    const domeSize = cardWidth * 0.9;

    // Function to dismiss the silence overlay
    const handleDismissSilence = () => {
        setShowSilence(false);

        // Track which message was dismissed and when
        if (silenceMessage) {
            setManuallyDismissed(prev => ({
                ...prev,
                [silenceMessage]: true,
            }));
            setLastDismissTime(Date.now());
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar hidden />
            {/* Beautiful gradient background with dynamic colors */}
            <View style={styles.backgroundGradient}>
                <CustomGradient colors={smoothGradientColors} />

                {/* No debug components in production */}

                {/* Stars with static effect - only visible at night */}
                {isNighttime && <StarBackground />}

                {/* Clouds - only visible during daytime */}
                {!isNighttime && <CloudBackground cloudDensity="medium" />}

                {/* Sun or Moon based on time of day */}
                <CelestialBody simulatedHour={null} />

                {/* Time of day indicator */}
                <TimeOfDayIndicator simulatedHour={null} />

                {/* Decorative header strip */}
                <View style={styles.headerStrip}>
                    <View style={styles.patternRow}>
                        {Array(20).fill(0).map((_, i) => (
                            <View key={`top-${i}`} style={[styles.patternSquare, {
                                width: normalizeSize(20),
                                height: normalizeSize(20),
                            }]} />
                        ))}
                    </View>
                </View>

                {/* Content Container with better spacing */}
                <View style={styles.contentContainer}>
                    {/* Date Header with elegant styling */}
                    <ShadowCard
                        cornerRadius={15}
                        backgroundColor="#243a5e"
                        elevation={8}
                        shadowOpacity={0.5}
                        style={{
                            marginBottom: smallScreen ? normalizeSize(10) : normalizeSize(20),
                            marginTop: normalizeSize(20),
                            alignSelf: 'center',
                            padding: normalizeSize(10),
                        }}
                    >
                        <Text style={[styles.dateHeader, { fontSize: scaleFontSize(18) }]}>
                            {hijriDateFormatted} / {gregorianDate}
                        </Text>
                    </ShadowCard>

                    {/* Current Time Display */}
                    <View style={[styles.timeContainer, {
                        marginBottom: smallScreen ? normalizeSize(5) : normalizeSize(15),
                    }]}>
                        <Text style={[styles.timeLabel, { fontSize: scaleFontSize(24) }]}>
                            Current time
                        </Text>
                        <Text style={[styles.currentTime, {
                            fontSize: smallScreen ? scaleFontSize(60) : scaleFontSize(80),
                            marginBottom: normalizeSize(20),
                        }]}>
                            {formattedTime}
                        </Text>
                        <ShadowCard
                            cornerRadius={15}
                            backgroundColor="#0e86d5"
                            elevation={8}
                            shadowOpacity={0.5}
                            style={{
                                alignSelf: 'center',
                                padding: normalizeSize(10),
                            }}
                        >
                            <Text style={[styles.nextIqamah, { fontSize: scaleFontSize(18) }]}>
                                Next {nextIqamahInfo.name} IQAMAH {nextIqamahInfo.remaining}
                            </Text>
                        </ShadowCard>
                    </View>

                    {/* Prayer Times Cards with better spacing */}
                    <View style={[styles.prayerTimesContainer, { paddingTop: normalizeSize(50) }]}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[styles.prayerScrollContent, {
                                paddingHorizontal: normalizeSize(10),
                                paddingBottom: normalizeSize(20),
                            }]}
                        >
                            {prayerCards.map((prayer, index) => (
                                index === currentPrayerIndex ? (
                                    // Current prayer with animation and highlighting
                                    <Animated.View
                                        key={index}
                                        style={{
                                            transform: [{ scale: pulseAnim }],
                                            zIndex: 10,
                                            marginTop: normalizeSize(40),
                                            marginHorizontal: cardMargin,
                                        }}
                                    >
                                        <MosqueCard
                                            width={cardWidth}
                                            height={cardHeight + normalizeSize(20)}
                                            gradientColors={['#3885f7', '#0c7cd5', '#0a5ea3']}
                                            isHighlighted={true}
                                            style={{
                                                elevation: 15,
                                            }}
                                        >
                                            <View style={[styles.prayerCardContent]}>
                                                <Text style={[styles.currentPrayerName, { fontSize: scaleFontSize(16) }]}>
                                                    {prayer.name}
                                                </Text>
                                                <Text style={[styles.currentPrayerTime, {
                                                    fontSize: scaleFontSize(22),
                                                    marginBottom: normalizeSize(10),
                                                }]}>
                                                    {prayer.time}
                                                </Text>
                                                <Text style={[styles.currentIqamahLabel, { fontSize: scaleFontSize(14) }]}>
                                                    IQAMAH
                                                </Text>
                                                <Text style={[styles.currentIqamahTime, { fontSize: scaleFontSize(18) }]}>
                                                    {prayer.iqamah}
                                                </Text>
                                            </View>
                                        </MosqueCard>
                                    </Animated.View>
                                ) : (
                                    // Other prayers
                                    <View
                                        key={index}
                                        style={{
                                            marginTop: normalizeSize(40),
                                            marginHorizontal: cardMargin,
                                        }}
                                    >
                                        <MosqueCard
                                            width={cardWidth}
                                            height={cardHeight}
                                            gradientColors={['#243a5e', '#061a40', '#040f26']}
                                            style={{
                                                elevation: 8,
                                            }}
                                        >
                                            <View style={[styles.prayerCardContent]}>
                                                <Text style={[styles.prayerName, { fontSize: scaleFontSize(14) }]}>
                                                    {prayer.name}
                                                </Text>
                                                <Text style={[styles.prayerTime, {
                                                    fontSize: scaleFontSize(18),
                                                    marginBottom: normalizeSize(10),
                                                }]}>
                                                    {prayer.time}
                                                </Text>
                                                <Text style={[styles.iqamahLabel, { fontSize: scaleFontSize(12) }]}>
                                                    IQAMAH
                                                </Text>
                                                <Text style={[styles.iqamahTime, { fontSize: scaleFontSize(16) }]}>
                                                    {prayer.iqamah}
                                                </Text>
                                            </View>
                                        </MosqueCard>
                                    </View>
                                )
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* Decorative footer strip */}
                <View style={styles.footerStrip}>
                    <View style={styles.patternRow}>
                        {Array(20).fill(0).map((_, i) => (
                            <View key={`bottom-${i}`} style={[styles.patternSquare, {
                                width: normalizeSize(20),
                                height: normalizeSize(20),
                            }]} />
                        ))}
                    </View>
                </View>

                {/* Silence overlay - displays during adhan and before iqamah */}
                <SilenceOverlay
                    visible={showSilence}
                    message={silenceMessage}
                    onDismiss={handleDismissSilence}
                    autoDismissTime={120000} // Auto dismiss after 2 minutes
                />

                {/* Debug components removed for production */}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#071d3d',
    },
    backgroundGradient: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        fontSize: scaleFontSize(20),
        fontWeight: 'bold',
    },
    headerStrip: {
        height: normalizeSize(40),
        width: '100%',
        backgroundColor: '#061a40',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
        elevation: 5,
        zIndex: 1,
    },
    footerStrip: {
        height: normalizeSize(40),
        width: '100%',
        backgroundColor: '#061a40',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
        elevation: 5,
    },
    patternRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    patternSquare: {
        backgroundColor: '#4d76bd',
        borderRadius: 3,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: normalizeSize(SPACING.medium),
        justifyContent: 'space-between',
        paddingTop: normalizeSize(SPACING.medium),
        paddingBottom: normalizeSize(60), // Ensure content doesn't overlap with footer
    },
    dateHeader: {
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    timeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeLabel: {
        color: '#a3c2f7',
        marginBottom: normalizeSize(5),
        fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    currentTime: {
        fontWeight: 'bold',
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    nextIqamah: {
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    prayerTimesContainer: {
        width: '100%',
        marginBottom: normalizeSize(10),
    },
    prayerScrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
    },
    prayerCardContent: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: normalizeSize(15),
        paddingTop: normalizeSize(10),
    },
    prayerName: {
        color: '#ffffff',
        fontFamily: 'Montserrat-Medium',
        marginBottom: normalizeSize(5),
    },
    prayerTime: {
        color: '#ffffff',
        fontFamily: 'Montserrat-Bold',
    },
    iqamahLabel: {
        color: '#ffd700',
        fontFamily: 'Montserrat-Medium',
        marginBottom: normalizeSize(5),
    },
    iqamahTime: {
        color: '#ffd700',
        fontFamily: 'Montserrat-Bold',
    },
    currentPrayerName: {
        color: '#ffffff',
        fontFamily: 'Montserrat-SemiBold',
        marginBottom: normalizeSize(5),
    },
    currentPrayerTime: {
        color: '#ffffff',
        fontFamily: 'Montserrat-Bold',
    },
    currentIqamahLabel: {
        color: '#ffd700',
        fontFamily: 'Montserrat-SemiBold',
        marginBottom: normalizeSize(5),
    },
    currentIqamahTime: {
        color: '#ffd700',
        fontFamily: 'Montserrat-Bold',
    },
});

export default HomeScreen;
