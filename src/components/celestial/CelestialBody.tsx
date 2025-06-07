import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
    PixelRatio,
    Easing,
    Text,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, G, Ellipse } from 'react-native-svg';
import weatherService from '../../core/WeatherService';

const { width, height } = Dimensions.get('window');

// Create a scale factor based on screen size
const scale = Math.min(width, height) / 1000; // Normalize against a 1000px baseline

// Function to scale sizes dynamically
const normalizeSize = (size: number): number => {
    return Math.round(size * scale * PixelRatio.get() / 2);
};

interface CelestialBodyProps {
    simulatedHour?: number | null;
}

const CelestialBody: React.FC<CelestialBodyProps> = ({ simulatedHour = null }) => {
    const now = new Date();
    // Use simulated hour if provided, otherwise use current hour
    const hours = simulatedHour !== null ? simulatedHour : now.getHours();
    const isDaytime = hours >= 6 && hours < 18; // Simple day/night determination
    
    // Add state for temperature
    const [temperature, setTemperature] = useState<number | null>(null);
    const [weatherDescription, setWeatherDescription] = useState<string>('');
    
    // Rotation animation
    const rotateAnim = React.useRef(new Animated.Value(0)).current;
    const moveAnim = React.useRef(new Animated.Value(0)).current;
    
    // Position based on time of day (0-100% of screen width)
    const timePosition = (hours % 12) / 12 * 100;
    const verticalPosition = isDaytime ? 15 : 20; // Sun higher in sky, moon a bit lower
    
    // Setup rotation animation
    useEffect(() => {
        // Rotation animation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 50000, // Slow rotation
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
        
        // Movement animation (slight up and down)
        Animated.loop(
            Animated.sequence([
                Animated.timing(moveAnim, {
                    toValue: 1,
                    duration: 10000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(moveAnim, {
                    toValue: 0,
                    duration: 10000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, [rotateAnim, moveAnim]);
    
    // Get weather data effect
    useEffect(() => {
        // Function to load weather data
        const loadWeatherData = async () => {
            try {
                // Initialize the service if needed
                await weatherService.initialize();
                
                // Get current weather data
                await weatherService.refreshWeather();
                const weatherData = weatherService.getWeatherData();
                
                if (weatherData) {
                    setTemperature(weatherData.temperature);
                    setWeatherDescription(weatherData.description);
                }
            } catch (error) {
                console.error('Error loading weather data:', error);
            }
        };
        
        // Load weather data initially
        loadWeatherData();
        
        // Set up refresh interval (every 5 minutes)
        const interval = setInterval(() => {
            loadWeatherData();
        }, 5 * 60 * 1000);
        
        // Clean up interval on unmount
        return () => {
            clearInterval(interval);
        };
    }, []);
    
    // Interpolate values for animations
    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    
    const moveY = moveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, normalizeSize(10)],
    });
    
    // SVG Sun dimensions
    const svgSize = normalizeSize(130);
    const sunSize = normalizeSize(55);
    
    // For the sun: SVG-based implementation with gradient
    if (isDaytime) {
        return (
            <Animated.View 
                style={[
                    styles.celestialBodyContainer, 
                    {
                        left: `${timePosition}%`,
                        top: `${verticalPosition}%`,
                        transform: [
                            { translateY: moveY }
                        ],
                        width: svgSize,
                        height: svgSize
                    }
                ]}
            >
                {/* Temperature display */}
                {temperature !== null && (
                    <View style={styles.temperatureContainer}>
                        <Text style={styles.temperatureText}>{temperature}°C</Text>
                        {weatherDescription ? (
                            <Text style={styles.descriptionText}>{weatherDescription}</Text>
                        ) : null}
                    </View>
                )}
                
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100">
                        <Defs>
                            <LinearGradient id="sunGradient" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#FFEF5E" />
                                <Stop offset="1" stopColor="#F9A825" />
                            </LinearGradient>
                            <LinearGradient id="rayGradient" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor="#FFEF5E" stopOpacity="0.7" />
                                <Stop offset="1" stopColor="#F9A825" stopOpacity="0" />
                            </LinearGradient>
                        </Defs>
                        
                        {/* Main Sun Circle with Gradient */}
                        <Circle 
                            cx="50" 
                            cy="50" 
                            r="25" 
                            fill="url(#sunGradient)"
                            stroke="#FFC107"
                            strokeWidth="0.5"
                        />
                        
                        {/* Sun Rays */}
                        {Array(12).fill(0).map((_, i) => {
                            const angle = (i * 30) * Math.PI / 180;
                            const rayLength = 20;
                            
                            // Calculate start and end points for each ray
                            const startX = 50 + 25 * Math.cos(angle);
                            const startY = 50 + 25 * Math.sin(angle);
                            const endX = 50 + (25 + rayLength) * Math.cos(angle);
                            const endY = 50 + (25 + rayLength) * Math.sin(angle);
                            
                            return (
                                <G key={`ray-${i}`}>
                                    <Path
                                        d={`M ${startX} ${startY} L ${endX} ${endY}`}
                                        stroke="url(#rayGradient)"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                </G>
                            );
                        })}
                        
                        {/* Highlight circle for sun */}
                        <Circle 
                            cx="42" 
                            cy="42" 
                            r="8" 
                            fill="white" 
                            opacity="0.3" 
                        />
                    </Svg>
                </Animated.View>
            </Animated.View>
        );
    } 
    // For the moon: SVG-based crescent
    else {
        return (
            <Animated.View 
                style={[
                    styles.celestialBodyContainer, 
                    {
                        left: `${timePosition}%`,
                        top: `${verticalPosition}%`,
                        transform: [
                            { translateY: moveY }
                        ],
                        width: svgSize,
                        height: svgSize
                    }
                ]}
            >
                {/* Temperature display */}
                {temperature !== null && (
                    <View style={styles.temperatureContainer}>
                        <Text style={styles.temperatureText}>{temperature}°C</Text>
                        {weatherDescription ? (
                            <Text style={styles.descriptionText}>{weatherDescription}</Text>
                        ) : null}
                </View>
                )}
                
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100">
                        <Defs>
                            <LinearGradient id="moonGradient" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#F5F5F5" />
                                <Stop offset="1" stopColor="#D1D1E0" />
                            </LinearGradient>
                        </Defs>
                        
                        {/* Main Moon */}
                        <Circle 
                            cx="50" 
                            cy="50" 
                            r="25" 
                            fill="url(#moonGradient)"
                        />
                        
                        {/* Moon shadow part for crescent effect */}
                        <Circle 
                            cx="60" 
                            cy="50" 
                            r="22" 
                            fill="#071d3d" 
                            opacity="0.9" 
                        />
                        
                        {/* Moon craters */}
                        <Circle cx="38" cy="40" r="4" fill="#BEBEBE" opacity="0.3" />
                        <Circle cx="43" cy="60" r="3" fill="#BEBEBE" opacity="0.2" />
                        <Circle cx="30" cy="55" r="2" fill="#BEBEBE" opacity="0.25" />
                        
                        {/* Highlight */}
                        <Circle cx="35" cy="35" r="3" fill="white" opacity="0.2" />
                    </Svg>
                </Animated.View>
            </Animated.View>
        );
    }
};

const styles = StyleSheet.create({
    celestialBodyContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    temperatureContainer: {
        position: 'absolute',
        top: normalizeSize(-35),
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: normalizeSize(15),
        paddingVertical: normalizeSize(6),
        borderRadius: normalizeSize(15),
        minWidth: normalizeSize(80),
    },
    temperatureText: {
        color: 'white',
        fontSize: normalizeSize(22),
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    descriptionText: {
        color: 'white',
        fontSize: normalizeSize(14),
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        marginTop: normalizeSize(2),
    }
});

export default CelestialBody; 