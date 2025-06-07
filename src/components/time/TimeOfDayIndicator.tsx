import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { normalizeSize, scaleFontSize } from '../../utils/SizeUtils';
import { getTimeOfDayName } from '../../utils/ColorUtils';

interface TimeOfDayIndicatorProps {
    simulatedHour: number | null;
}

const TimeOfDayIndicator: React.FC<TimeOfDayIndicatorProps> = ({ simulatedHour }) => {
    if (simulatedHour === null) {
        return null;
    }
    
    return (
        <View style={styles.timeOfDayIndicator}>
            <Text style={styles.timeOfDayText}>
                {getTimeOfDayName(simulatedHour)} - {simulatedHour}:00
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    timeOfDayIndicator: {
        position: 'absolute',
        top: normalizeSize(20),
        left: normalizeSize(20),
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: normalizeSize(10),
        borderRadius: normalizeSize(10),
        zIndex: 10,
    },
    timeOfDayText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: scaleFontSize(16),
    },
});

export default TimeOfDayIndicator; 