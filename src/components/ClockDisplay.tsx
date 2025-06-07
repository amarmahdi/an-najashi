import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../styles/theme';

interface ClockDisplayProps {
  size?: 'small' | 'medium' | 'large';
  showSeconds?: boolean;
  color?: string;
}

const ClockDisplay: React.FC<ClockDisplayProps> = ({ 
  size = 'medium', 
  showSeconds = true,
  color = COLORS.textLight,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    // Update the clock every second
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Clear the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);
  
  // Format the time with or without seconds
  const formattedTime = showSeconds 
    ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  // Determine the font size based on the size prop
  let fontSize;
  switch(size) {
    case 'small':
      fontSize = FONTS.medium;
      break;
    case 'large':
      fontSize = FONTS.xlarge;
      break;
    default:
      fontSize = FONTS.large;
  }
  
  return (
    <Text style={[styles.clock, { fontSize, color }]}>
      {formattedTime}
    </Text>
  );
};

const styles = StyleSheet.create({
  clock: {
    fontWeight: '600',
  },
});

export default ClockDisplay; 