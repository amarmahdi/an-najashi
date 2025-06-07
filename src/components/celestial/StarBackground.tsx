import React from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const StarBackground: React.FC = () => {
    // Use fewer stars and simpler animation for better performance
    return (
        <View style={styles.starsContainer}>
            {/* Fixed stars instead of animated ones for better performance */}
            {Array(25).fill(0).map((_, i) => (
                <View 
                    key={`star-${i}`} 
                    style={[
                        styles.star, 
                        { 
                            top: Math.random() * height, 
                            left: Math.random() * width,
                            width: Math.random() * 3 + 1, 
                            height: Math.random() * 3 + 1,
                            opacity: Math.random() * 0.7 + 0.3,
                        }
                    ]} 
                />
            ))}
            
            {/* Add just a few larger stars */}
            {Array(3).fill(0).map((_, i) => (
                <View 
                    key={`big-star-${i}`} 
                    style={[
                        styles.bigStar, 
                        { 
                            top: Math.random() * height, 
                            left: Math.random() * width,
                        }
                    ]} 
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    starsContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    star: {
        position: 'absolute',
        backgroundColor: '#ffffff',
        borderRadius: 10,
    },
    bigStar: {
        position: 'absolute',
        width: 4,
        height: 4,
        backgroundColor: '#ffffff',
        borderRadius: 2,
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
});

export default StarBackground; 