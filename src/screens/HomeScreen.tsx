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
    Alert,
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
import TimeSimulationControls from '../components/time/TimeSimulationControls';
import TimeOfDayIndicator from '../components/time/TimeOfDayIndicator';
import SilenceOverlay from '../components/prayer/SilenceOverlay';
import ShadowCard from '../components/common/ShadowCard';
import MosqueCard from '../components/prayer/MosqueCard';
import ConnectionDebugger from '../components/debug/ConnectionDebugger';

// Import utility functions
import { normalizeSize, scaleFontSize, isSmallScreen } from '../utils/SizeUtils';
import { getBackgroundColors, createSmoothGradient } from '../utils/ColorUtils';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [prayerData, setPrayerData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    
    // For demonstration - time simulation
    const [showTimeControls, setShowTimeControls] = useState(false);
    const [simulatedHour, setSimulatedHour] = useState<number | null>(null);
    const [autoSimulation, setAutoSimulation] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(200); // ms per hour change
    
    // For silence overlay
    const [showSilence, setShowSilence] = useState(false);
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
                timeDifference: Number.MAX_SAFE_INTEGER
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
                            timeDifference: Math.abs(adhanDiffMs)
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
                            timeDifference: iqamahBeforeDiffMs
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
            if (closestEvent.type === 'adhan') {
                console.log(`Showing adhan overlay for ${closestEvent.name}`);
                setSilenceMessage(`It's time for ${closestEvent.name} Adhan`);
                setShowSilence(true);
            } else if (closestEvent.type === 'iqamah') {
                console.log(`Showing iqamah overlay for ${closestEvent.name}`);
                setSilenceMessage(`${closestEvent.name} Iqamah will begin shortly`);
                setShowSilence(true);
            } else {
                // No imminent events found
                if (showSilence) {
                    console.log('Hiding silence overlay - no events found');
                }
                setShowSilence(false);
            }
        } else {
            console.log('Prayer data not available, skipping check');
        }
    }, [prayerData, scheduleNotification, showSilence, ADHAN_WINDOW_MS, IQAMAH_BEFORE_WINDOW_MS, LOOK_AHEAD_MS, setSilenceMessage, setShowSilence]);
    
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
    
    // Toggle time simulation controls
    const toggleTimeControls = () => {
        setShowTimeControls(!showTimeControls);
        // Reset simulated hour and stop auto simulation when toggling off
        if (showTimeControls) {
            setSimulatedHour(null);
            setAutoSimulation(false);
        }
    };
    
    // Set time to specific hours for testing
    const setDaytime = () => {
        setAutoSimulation(false);
        setSimulatedHour(12);
    }; // Noon
    const setNighttime = () => {
        setAutoSimulation(false);
        setSimulatedHour(22);
    }; // 10 PM
    const setSunrise = () => {
        setAutoSimulation(false);
        setSimulatedHour(6);
    }; // 6 AM
    const setSunset = () => {
        setAutoSimulation(false);
        setSimulatedHour(17);
    }; // 5 PM
    
    // Toggle auto-advancing simulation
    const toggleAutoSimulation = () => {
        // If turning on auto simulation, start from current hour or midnight if no hour is set
        if (!autoSimulation && simulatedHour === null) {
            setSimulatedHour(0);
        }
        setAutoSimulation(!autoSimulation);
    };
    
    // Change simulation speed
    const changeSimulationSpeed = (faster: boolean) => {
        if (faster && simulationSpeed > 100) {
            setSimulationSpeed(simulationSpeed - 100);
        } else if (!faster && simulationSpeed < 2000) {
            setSimulationSpeed(simulationSpeed + 100);
        }
    };
    
    // Reset to real time
    const resetToRealTime = () => {
        setAutoSimulation(false);
        setSimulatedHour(null);
    };
    
    // Effect for auto-advancing simulation
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        
        if (autoSimulation) {
            interval = setInterval(() => {
                setSimulatedHour(prevHour => {
                    if (prevHour === null) return 0;
                    return (prevHour + 1) % 24; // Loop through 0-23 hours
                });
            }, simulationSpeed); // Adjust hour every interval
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoSimulation, simulationSpeed]);
    
    // Determine if this is a small screen
    const smallScreen = isSmallScreen();
    
    // Update time every second and check for prayer time updates
    useEffect(() => {
        const timer = setInterval(async () => {
            const now = new Date();
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
    // Get background colors based on simulated or real hour
    const bgColors = getBackgroundColors(simulatedHour);
    // Create a smooth gradient from the base colors
    const smoothGradientColors = createSmoothGradient(bgColors, 30); // 30 steps between each color

    // Check if it's nighttime for showing stars
    const isNighttime = (simulatedHour === null ? new Date().getHours() : simulatedHour) >= 18 || 
                        (simulatedHour === null ? new Date().getHours() : simulatedHour) < 6;
                        
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
    }, [prayerData, checkPrayerTimes, CHECK_INTERVAL_MS]);
    
    // Loading state or fallback if prayer data isn't available
    if (loading || !prayerData) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar hidden />
                <View style={styles.backgroundGradient}>
                    <CustomGradient colors={smoothGradientColors} />
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading prayer times...</Text>
                </View>
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
        year: 'numeric'
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
                        remaining: timeUntilNext === 'sunrise' ? 'after sunrise' : timeUntilNext
                    };
                }
            }
            // If we get here, all prayers are done for today, so it's tomorrow's Fajr
            return {
                name: 'Fajr',
                time: formatTime(iqamahTimes.fajr),
                remaining: 'tomorrow'
            };
        }
        
        return {
            name: prayerDisplayNames[nextPrayerIndex],
            time: nextIqamahTime ? formatTime(nextIqamahTime) : '',
            remaining: timeUntilNext
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
        
        // Helper function to convert time to a numeric value for comparison (HHMM)
        const getTimeValue = (date: Date): number => {
            return date.getHours() * 100 + date.getMinutes();
        };
        
        // Get current time value and prayer time values
        const currentTimeValue = getTimeValue(now);
        const fajrValue = getTimeValue(fajr);
        const sunriseValue = getTimeValue(sunrise);
        const dhuhrValue = getTimeValue(dhuhr);
        const asrValue = getTimeValue(asr);
        const maghribValue = getTimeValue(maghrib);
        const ishaValue = getTimeValue(isha);
        
        // Function to get minutes difference between times, handling day boundaries
        const getMinutesDifference = (current: Date, prayer: Date): number => {
            // Convert times to minutes since midnight
            const currentMinutes = current.getHours() * 60 + current.getMinutes();
            const prayerMinutes = prayer.getHours() * 60 + prayer.getMinutes();
            
            // Calculate difference
            let minutesDifference = currentMinutes - prayerMinutes;
            
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
            console.log("After midnight, before Fajr: highlighting Fajr as next prayer");
            return 0; // Return Fajr (index 0)
        }
        
        // Check if prayer time was recent (within 10 minutes)
        const fajrMinutesDiff = getMinutesDifference(now, fajr);
        const sunriseMinutesDiff = getMinutesDifference(now, sunrise);
        const dhuhrMinutesDiff = getMinutesDifference(now, dhuhr);
        const asrMinutesDiff = getMinutesDifference(now, asr);
        const maghribMinutesDiff = getMinutesDifference(now, maghrib);
        const ishaMinutesDiff = getMinutesDifference(now, isha);
        
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
        
        // Check which prayer is next
        // Check if current time is before Fajr
        if (currentTimeValue < fajrValue) {
            console.log("Next prayer: Fajr (before Fajr)");
            return 0;
        }
        
        // Check if current time is after Fajr but before Sunrise
        if (currentTimeValue < sunriseValue && currentTimeValue >= fajrValue) {
            console.log("Next event: Sunrise (after Fajr, before Sunrise)");
            return 1;
        }
        
        // Check if current time is before Dhuhr
        if (currentTimeValue < dhuhrValue) {
            console.log("Next prayer: Dhuhr (after Sunrise, before Dhuhr)");
            return 2;
        }
        
        // Check if current time is before Asr
        if (currentTimeValue < asrValue) {
            console.log("Next prayer: Asr (after Dhuhr, before Asr)");
            return 3;
        }
        
        // Check if current time is before Maghrib
        if (currentTimeValue < maghribValue) {
            console.log("Next prayer: Maghrib (after Asr, before Maghrib)");
            return 4;
        }
        
        // Check if current time is before Isha
        if (currentTimeValue < ishaValue) {
            console.log("Next prayer: Isha (after Maghrib, before Isha)");
            return 5;
        }
        
        // If current time is after Isha, the next prayer is Fajr tomorrow
        console.log("Next prayer: Fajr (tomorrow)");
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
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar hidden />
            {/* Beautiful gradient background with dynamic colors */}
            <View style={styles.backgroundGradient}>
                <CustomGradient colors={smoothGradientColors} />
                
                {/* Stars with static effect - only visible at night */}
                {isNighttime && <StarBackground />}
                
                {/* Clouds - only visible during daytime */}
                {!isNighttime && <CloudBackground cloudDensity="medium" />}
                
                {/* Sun or Moon based on time of day - with simulated hour for testing */}
                <CelestialBody simulatedHour={simulatedHour} />
                
                {/* Time of day indicator */}
                <TimeOfDayIndicator simulatedHour={simulatedHour} />
                
                {/* Time simulation controls - for demonstration only */}
                {showTimeControls && (
                    <TimeSimulationControls 
                        simulatedHour={simulatedHour}
                        autoSimulation={autoSimulation}
                        toggleAutoSimulation={toggleAutoSimulation}
                        changeSimulationSpeed={changeSimulationSpeed}
                        setDaytime={setDaytime}
                        setNighttime={setNighttime}
                        setSunrise={setSunrise}
                        setSunset={setSunset}
                        resetToRealTime={resetToRealTime}
                    />
                )}
                
                {/* Toggle button for time controls */}
                <TouchableOpacity 
                    style={styles.toggleTimeControlsButton} 
                    onPress={toggleTimeControls}
                >
                    <Text style={styles.toggleButtonText}>
                        {showTimeControls ? "Hide Time Controls" : "Test Different Times"}
                    </Text>
                </TouchableOpacity>
                
                {/* Debug button to show location */}
                <TouchableOpacity 
                    style={[styles.toggleTimeControlsButton, { top: normalizeSize(60) }]} 
                    onPress={() => {
                        const settings = locationService.getSettings();
                        Alert.alert("Location Information", `Location: ${settings.latitude}, ${settings.longitude}\nTimezone: ${settings.timezone}\nMethod: ${settings.method}\nSunrise Adj: ${settings.adjustments.sunrise} min`);
                    }}
                >
                    <Text style={styles.toggleButtonText}>
                        Show Location
                    </Text>
                </TouchableOpacity>
                
                {/* Reset to Edmonton button */}
                <TouchableOpacity 
                    style={[styles.toggleTimeControlsButton, { top: normalizeSize(110) }]} 
                    onPress={async () => {
                        try {
                            // Edmonton coordinates
                            const edmontonSettings = {
                                ...locationService.getSettings(),
                                latitude: 53.5461,
                                longitude: -113.4938,
                                timezone: -7
                            };
                            await locationService.saveSettings(edmontonSettings);
                            await prayerDataService.refreshPrayerData(true);
                            Alert.alert("Success", "Location reset to Edmonton, Canada");
                        } catch (error) {
                            console.error('Error setting Edmonton location:', error);
                            Alert.alert("Error", "Failed to set location to Edmonton");
                        }
                    }}
                >
                    <Text style={styles.toggleButtonText}>
                        Reset to Edmonton
                    </Text>
                </TouchableOpacity>
            </View>
            
            {/* Decorative header strip */}
            <View style={styles.headerStrip}>
                <View style={styles.patternRow}>
                    {Array(20).fill(0).map((_, i) => (
                        <View key={`top-${i}`} style={[styles.patternSquare, { 
                            width: normalizeSize(20), 
                            height: normalizeSize(20) 
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
                    marginBottom: smallScreen ? normalizeSize(5) : normalizeSize(15) 
                }]}>
                    <Text style={[styles.timeLabel, { fontSize: scaleFontSize(24) }]}>
                        Current time
                    </Text>
                    <Text style={[styles.currentTime, { 
                        fontSize: smallScreen ? scaleFontSize(60) : scaleFontSize(80),
                        marginBottom: normalizeSize(20)
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
                            paddingBottom: normalizeSize(20)
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
                                        gradientColors={["#3885f7", "#0c7cd5", "#0a5ea3"]}
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
                                                marginBottom: normalizeSize(10)
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
                                        gradientColors={["#243a5e", "#061a40", "#040f26"]}
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
                                                marginBottom: normalizeSize(10)
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
                            height: normalizeSize(20) 
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
            
            {/* Debug connection status overlay */}
            <ConnectionDebugger />
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
    toggleTimeControlsButton: {
        position: 'absolute',
        top: normalizeSize(20),
        right: normalizeSize(20),
        backgroundColor: 'rgba(12, 124, 213, 0.7)',
        paddingVertical: normalizeSize(8),
        paddingHorizontal: normalizeSize(15),
        borderRadius: normalizeSize(20),
        zIndex: 10,
    },
    toggleButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: scaleFontSize(14),
    },
});

export default HomeScreen;
