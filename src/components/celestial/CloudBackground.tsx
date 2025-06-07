import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
    Easing,
    Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { normalizeSize } from '../../utils/SizeUtils';

const { width, height } = Dimensions.get('window');

// SVG paths for different cloud shapes
const CLOUD_PATHS = [
    // Simple fluffy cloud
    "M25,60 C13.4,60.8 5,50.4 5,40 C5,29.6 13.4,19.2 25,20 C25,10 35,0 50,0 C65,0 75,10 75,20 C86.6,19.2 95,29.6 95,40 C95,50.4 86.6,60.8 75,60 L25,60 Z",
    // More complex cloud
    "M20,60 C10,61 0,50 0,40 C0,30 8,20 20,20 C20,10 30,0 45,0 C60,0 75,10 75,25 C85,25 95,35 95,45 C95,55 85,60 75,60 L20,60 Z",
    // Wide cloud
    "M10,50 C4.5,50.7 0,41.7 0,35 C0,26.8 7.2,20 15,20 C15,8.9 25.6,0 40,0 C54.4,0 65,8.9 65,20 C72.8,20 80,26.8 80,35 C80,41.7 75.5,50.7 70,50 L10,50 Z"
];

interface CloudBackgroundProps {
    cloudDensity?: 'low' | 'medium' | 'high';
}

interface CloudData {
    id: number;
    size: number;
    opacity: number;
    yPosition: number;
    animation: Animated.Value;
    active: boolean;
    cloudPath: string;
}

const CloudBackground: React.FC<CloudBackgroundProps> = ({ 
    cloudDensity = 'medium' 
}) => {
    // Track clouds with a ref to avoid re-renders
    const cloudsRef = useRef<CloudData[]>([]);
    const nextCloudIdRef = useRef(0);
    const activeCloudCountRef = useRef(0);
    
    // Determine max clouds based on density
    const maxClouds = 
        cloudDensity === 'low' ? 2 : 
        cloudDensity === 'high' ? 6 : 4;
    
    // Create cloud spawn timer ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Force re-render when clouds change
    const [, forceUpdate] = useState({});
    
    // Initialize cloud system
    useEffect(() => {
        // Pre-create pool of cloud objects
        cloudsRef.current = Array(maxClouds).fill(0).map((_, index) => ({
            id: index,
            size: Math.random() * 0.7 + 0.5, // Scale between 0.5 and 1.2
            opacity: Math.random() * 0.3 + 0.4, // Between 0.4 and 0.7
            yPosition: Math.random() * (height * 0.4), // Top 40% of screen
            animation: new Animated.Value(-0.2), // Start off screen (-0.2 of screen width)
            active: false,
            cloudPath: CLOUD_PATHS[Math.floor(Math.random() * CLOUD_PATHS.length)] // Random cloud shape
        }));
        
        // Initialize system with first cloud
        spawnCloud();
        
        // Start timer for spawning clouds
        startCloudTimer();
        
        return () => {
            // Clean up timer and animations on unmount
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            
            cloudsRef.current.forEach(cloud => {
                cloud.animation.stopAnimation();
            });
        };
    }, [maxClouds]);
    
    // Function to start a cloud spawning timer
    const startCloudTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        
        timerRef.current = setTimeout(() => {
            spawnCloud();
            // Restart timer for next cloud
            startCloudTimer();
        }, 5000); // 5 seconds between spawns
    };
    
    // Function to spawn a new cloud
    const spawnCloud = () => {
        // Only spawn if we're under max cloud count
        if (activeCloudCountRef.current >= maxClouds) {
            return;
        }
        
        // Find an inactive cloud to use
        const inactiveCloud = cloudsRef.current.find(cloud => !cloud.active);
        
        if (inactiveCloud) {
            // Reset and activate this cloud
            inactiveCloud.id = nextCloudIdRef.current++;
            inactiveCloud.size = Math.random() * 0.7 + 0.5;
            inactiveCloud.opacity = Math.random() * 0.3 + 0.4;
            inactiveCloud.yPosition = Math.random() * (height * 0.4);
            inactiveCloud.animation.setValue(-0.2); // Start off-screen left
            inactiveCloud.active = true;
            inactiveCloud.cloudPath = CLOUD_PATHS[Math.floor(Math.random() * CLOUD_PATHS.length)]; // Random cloud shape
            
            // Increment active count
            activeCloudCountRef.current++;
            
            // Force a re-render to show the new cloud
            forceUpdate({});
            
            // Start animation for this cloud
            const cloudSpeed = 30000 + (Math.random() * 20000); // 30-50 seconds to cross screen
            
            Animated.timing(inactiveCloud.animation, {
                toValue: 1.2, // End off-screen right (1.2 of screen width)
                duration: cloudSpeed,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(() => {
                // When animation completes, deactivate the cloud
                inactiveCloud.active = false;
                activeCloudCountRef.current--;
                
                // Force update to remove it
                forceUpdate({});
            });
        }
    };
    
    return (
        <View style={styles.container}>
            {cloudsRef.current.map(cloud => {
                // Only render active clouds
                if (!cloud.active) return null;
                
                // Calculate dimensions
                const cloudWidth = normalizeSize(180 * cloud.size);
                const cloudHeight = normalizeSize(100 * cloud.size);
                
                // Calculate position based on animation value
                const translateX = cloud.animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, width], // Move from 0 to screen width
                });
                
                // Create SVG props
                const AnimatedSvg = Animated.createAnimatedComponent(Svg);
                
                return (
                    <Animated.View 
                        key={`cloud-${cloud.id}`} 
                        style={[
                            styles.cloudContainer,
                            {
                                width: cloudWidth,
                                height: cloudHeight,
                                top: cloud.yPosition,
                                zIndex: Math.floor(cloud.size * 10), // Larger clouds in front
                                transform: [{ translateX }],
                                opacity: cloud.opacity,
                            }
                        ]}
                    >
                        <AnimatedSvg
                            width="100%"
                            height="100%"
                            viewBox="0 0 100 60"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <Path
                                d={cloud.cloudPath}
                                fill="white"
                                stroke="rgba(255, 255, 255, 0.3)"
                                strokeWidth="1"
                            />
                        </AnimatedSvg>
                    </Animated.View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 1, // Above background but below other elements
    },
    cloudContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default CloudBackground; 