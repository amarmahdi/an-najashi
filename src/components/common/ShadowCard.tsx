import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';

interface ShadowCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  cornerRadius?: number;
  elevation?: number;
  shadowOpacity?: number;
  backgroundColor?: string;
}

/**
 * ShadowCard - A cross-platform component that provides consistent shadow effects
 * even with rounded corners on both iOS and Android
 */
const ShadowCard: React.FC<ShadowCardProps> = ({
  children,
  style,
  cornerRadius = 15,
  elevation = 8,
  shadowOpacity = 0.5,
  backgroundColor = 'white',
}) => {
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: shadowOpacity,
      shadowRadius: elevation / 2,
    },
    android: {
      elevation: elevation,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: shadowOpacity,
      shadowRadius: elevation / 2,
    },
  });

  return (
    <View
      style={[
        styles.container,
        shadowStyle,
        {
          borderRadius: cornerRadius,
          backgroundColor: backgroundColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // We use overflow hidden on Android to ensure the shadow doesn't extend beyond the border radius
    // On iOS, we use visible to allow the shadow to show properly
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
});

export default ShadowCard; 