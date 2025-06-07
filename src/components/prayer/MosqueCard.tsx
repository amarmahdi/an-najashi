import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface MosqueCardProps {
  width: number;
  height: number;
  gradientColors?: string[];
  style?: ViewStyle;
  children?: React.ReactNode;
  isHighlighted?: boolean;
}

const MosqueCard: React.FC<MosqueCardProps> = ({
  width,
  height,
  gradientColors = ["#673AB7", "#5E35B1", "#4527A0"], // Purple colors for default
  style,
  children,
  isHighlighted = false,
}) => {
  // Calculate scaling factors to maintain the original SVG aspect ratio
  const originalWidth = 500;
  const originalHeight = 800;
  const scaleFactor = Math.min(width / originalWidth, height / originalHeight);
  
  // Scale the SVG viewBox to fit our component size
  const viewBoxWidth = width / scaleFactor;
  const viewBoxHeight = height / scaleFactor;
  
  // Center the viewBox
  const viewBoxX = (originalWidth - viewBoxWidth) / 2;
  const viewBoxY = (originalHeight - viewBoxHeight) / 2;
  
  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${originalWidth} ${originalHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="cardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0" stopColor={gradientColors[0]} />
            <Stop offset="0.5" stopColor={gradientColors[1]} />
            <Stop offset="1" stopColor={gradientColors[2]} />
          </LinearGradient>
        </Defs>

        {/* The exact mosque shape from the provided SVG path */}
        <Path
          fill="url(#cardGradient)"
          d="M33.816 773.778 29.357 361.03c0-20.438 24.508-71.535 78.013-71.535v-62.449c0-20.439 13.376-66.426 84.715-91.974 46.37-24.527 60.207-67.563 60.207-67.563s12.168 43.036 58.538 67.563c71.339 25.548 84.715 71.535 84.715 91.974v62.449c53.505 0 79.681 39.744 79.681 60.182l-4.459 424.101H33.816Z"
        />
      </Svg>

      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  contentContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '15%', // Adjusted to position content properly within the mosque shape
  },
});

export default MosqueCard; 