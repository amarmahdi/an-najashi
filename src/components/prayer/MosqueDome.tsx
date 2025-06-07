import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    Dimensions,
    PixelRatio,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Create a scale factor based on screen size
const scale = Math.min(width, height) / 1000; // Normalize against a 1000px baseline

// Function to scale sizes dynamically
const normalizeSize = (size: number): number => {
    return Math.round(size * scale * PixelRatio.get() / 2);
};

interface MosqueDomeProps {
    style: ViewStyle;
    isHighlighted?: boolean;
}

const MosqueDome: React.FC<MosqueDomeProps> = ({ style, isHighlighted = false }) => (
    <View style={[styles.mosqueDomeContainer, style]}>
        {/* Main dome */}
        <View style={[
            styles.dome,
            isHighlighted ? styles.highlightedDome : {}
        ]}>
            {/* Dome window details */}
            <View style={styles.domeWindow} />

            {/* Gold finial */}
            <View style={styles.domeFinial}>
                <View style={styles.finialBall} />
                <View style={styles.finialPole} />
            </View>
        </View>

        {/* Minaret 1 */}
        {isHighlighted && (
            <View style={[styles.minaret, { left: normalizeSize(5) }]}>
                <View style={styles.minaretTop} />
            </View>
        )}

        {/* Minaret 2 */}
        {isHighlighted && (
            <View style={[styles.minaret, { right: normalizeSize(5) }]}>
                <View style={styles.minaretTop} />
            </View>
        )}
    </View>
);

const styles = StyleSheet.create({
    mosqueDomeContainer: {
        alignItems: 'center',
        position: 'absolute',
        top: normalizeSize(-30),
    },
    dome: {
        borderTopLeftRadius: normalizeSize(65),
        borderTopRightRadius: normalizeSize(65),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 5,
    },
    highlightedDome: {
        shadowColor: '#4d9fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
    },
    domeWindow: {
        width: normalizeSize(30),
        height: normalizeSize(40),
        borderTopLeftRadius: normalizeSize(15),
        borderTopRightRadius: normalizeSize(15),
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        position: 'absolute',
        bottom: 0,
    },
    domeFinial: {
        position: 'absolute',
        top: normalizeSize(-15),
        alignItems: 'center',
    },
    finialBall: {
        width: normalizeSize(12),
        height: normalizeSize(12),
        borderRadius: normalizeSize(6),
        backgroundColor: 'gold',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 3,
    },
    finialPole: {
        width: normalizeSize(3),
        height: normalizeSize(10),
        backgroundColor: 'gold',
        position: 'absolute',
        bottom: normalizeSize(-7),
    },
    minaret: {
        width: normalizeSize(15),
        height: normalizeSize(40),
        backgroundColor: '#4d9fff',
        position: 'absolute',
        top: normalizeSize(20),
        borderTopLeftRadius: normalizeSize(7),
        borderTopRightRadius: normalizeSize(7),
    },
    minaretTop: {
        width: normalizeSize(15),
        height: normalizeSize(10),
        borderTopLeftRadius: normalizeSize(7),
        borderTopRightRadius: normalizeSize(7),
        backgroundColor: 'gold',
        position: 'absolute',
        top: normalizeSize(-5),
    },
});

export default MosqueDome; 