import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { normalizeSize, scaleFontSize } from '../../utils/SizeUtils';

const { width, height } = Dimensions.get('window');

interface SilenceOverlayProps {
  visible: boolean;
  message: string;
  onDismiss?: () => void;
  autoDismissTime?: number; // in milliseconds
}

const SilenceOverlay: React.FC<SilenceOverlayProps> = ({
  visible,
  message,
  onDismiss,
  autoDismissTime = 120000, // Default 2 minutes
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [timeRemaining, setTimeRemaining] = useState(autoDismissTime / 1000);
  const progressWidth = useRef(new Animated.Value(width * 0.85)).current;
  
  // Set up pulse animation
  useEffect(() => {
    if (visible) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]);
      
      Animated.loop(pulse).start();
    } else {
      pulseAnim.stopAnimation();
    }
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [visible, pulseAnim]);
  
  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (visible && autoDismissTime) {
      // Reset timer when overlay becomes visible
      setTimeRemaining(Math.ceil(autoDismissTime / 1000));
      
      // Animate progress bar
      Animated.timing(progressWidth, {
        toValue: 0,
        duration: autoDismissTime,
        useNativeDriver: false
      }).start();
      
      // Start countdown
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          return newTime > 0 ? newTime : 0;
        });
      }, 1000);
    } else {
      // Reset progress bar
      progressWidth.setValue(width * 0.85);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, autoDismissTime, progressWidth]);
  
  // Set up fade animation and auto-dismiss
  useEffect(() => {
    if (visible) {
      // Make sure status bar is hidden during overlay
      StatusBar.setHidden(true);
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Auto dismiss after specified time if provided
      if (autoDismissTime && onDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismissTime);
        
        return () => {
          clearTimeout(timer);
          StatusBar.setHidden(false);
        };
      }
    } else {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Restore status bar
      StatusBar.setHidden(false);
    }
    
    return () => {
      StatusBar.setHidden(false);
    };
  }, [visible, autoDismissTime, onDismiss]);
  
  const handleDismiss = () => {
    if (onDismiss) {
      // Fade out first, then call onDismiss
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onDismiss();
      });
    }
  };
  
  // Format remaining time as MM:SS
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Return null for rendering only, after all hooks have been called
  if (!visible) {
    return null;
  }
  
  // Extract prayer name from message if possible
  let prayerName = "";
  if (message.includes("Adhan")) {
    prayerName = message.split(" Adhan")[0].split("time for ")[1];
  } else if (message.includes("Iqamah")) {
    prayerName = message.split(" Iqamah")[0];
  }
  
  return (
    <TouchableWithoutFeedback onPress={handleDismiss}>
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.overlayContent}>
          {/* Pulsing icon */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🕌</Text>
            </View>
          </Animated.View>
          
          {/* Message Container */}
          <View style={styles.messageContainer}>
            {prayerName ? (
              <Text style={styles.prayerName}>{prayerName}</Text>
            ) : null}
            <Text style={styles.message}>{message}</Text>
            <View style={styles.divider} />
            <Text style={styles.silenceText}>SILENCE PLEASE</Text>
            <Text style={styles.subMessage}>
              {message.includes("Adhan") ? 
                "Adhan is being called. Please maintain silence and listen respectfully." : 
                "Iqamah will begin shortly. Please maintain silence and prepare for prayer."}
            </Text>
            
            {/* Progress bar and countdown */}
            <View style={styles.timerContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View 
                  style={[
                    styles.progressBar,
                    { width: progressWidth }
                  ]} 
                />
              </View>
              <Text style={styles.timeRemainingText}>
                Auto-closing in {formatTimeRemaining(timeRemaining)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.tapToClose}>Tap anywhere to close</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconText: {
    fontSize: scaleFontSize(60),
  },
  messageContainer: {
    backgroundColor: 'rgba(13, 71, 161, 0.6)',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(66, 165, 245, 0.6)',
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  prayerName: {
    color: '#90CAF9',
    fontSize: scaleFontSize(28),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: 'white',
    fontSize: scaleFontSize(22),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 16,
  },
  silenceText: {
    color: '#FF8A65',
    fontSize: scaleFontSize(26),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
  },
  subMessage: {
    color: 'white',
    fontSize: scaleFontSize(16),
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
    marginBottom: 20,
  },
  timerContainer: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4FC3F7',
  },
  timeRemainingText: {
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: scaleFontSize(14),
  },
  tapToClose: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: scaleFontSize(14),
    marginTop: 30,
  }
});

export default SilenceOverlay; 