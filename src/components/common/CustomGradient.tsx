import React from 'react';
import {
    View,
    StyleSheet,
} from 'react-native';

interface CustomGradientProps {
    colors: string[];
}

const CustomGradient: React.FC<CustomGradientProps> = ({ colors }) => {
    // Use View for smoother rendering
    return (
        <View style={styles.customGradientContainer}>
            {colors.map((color, index) => {
                // Calculate precise positioning for each slice
                const percentage = (index / (colors.length - 1)) * 100;
                const nextPercentage = ((index + 1) / (colors.length - 1)) * 100;
                const height = nextPercentage - percentage;
                
                return (
                    <View 
                        key={`gradient-${index}`} 
                        style={[
                            styles.customGradientLayer,
                            { 
                                backgroundColor: color,
                                top: `${percentage}%`,
                                height: `${height === 0 ? 1 : height}%`,
                                opacity: 0.9, // Slight transparency helps blend
                            }
                        ]}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    customGradientContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    customGradientLayer: {
        position: 'absolute',
        width: '100%',
        left: 0,
        right: 0,
    },
});

export default CustomGradient; 