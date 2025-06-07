import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { normalizeSize, scaleFontSize } from '../../utils/SizeUtils';

interface TimeSimulationControlsProps {
    simulatedHour: number | null;
    autoSimulation: boolean;
    toggleAutoSimulation: () => void;
    changeSimulationSpeed: (faster: boolean) => void;
    setDaytime: () => void;
    setNighttime: () => void;
    setSunrise: () => void;
    setSunset: () => void;
    resetToRealTime: () => void;
}

const TimeSimulationControls: React.FC<TimeSimulationControlsProps> = ({
    simulatedHour,
    autoSimulation,
    toggleAutoSimulation,
    changeSimulationSpeed,
    setDaytime,
    setNighttime,
    setSunrise,
    setSunset,
    resetToRealTime,
}) => {
    return (
        <View style={styles.timeControls}>
            <Text style={styles.timeControlsTitle}>Time Simulation</Text>
            
            {/* Auto simulation controls */}
            <View style={styles.autoControlsContainer}>
                <Text style={[styles.timeButtonText, {marginBottom: normalizeSize(5)}]}>
                    {autoSimulation 
                        ? `Auto: ON (${simulatedHour !== null ? `${simulatedHour}:00` : 'Loading...'})`
                        : 'Auto: OFF'}
                </Text>
                
                <View style={styles.timeButtonsRow}>
                    <TouchableOpacity 
                        style={[styles.timeButton, 
                            autoSimulation ? {backgroundColor: '#d32f2f'} : {backgroundColor: '#0c7cd5'}
                        ]} 
                        onPress={toggleAutoSimulation}
                    >
                        <Text style={styles.timeButtonText}>
                            {autoSimulation ? 'Stop' : 'Start'} Auto
                        </Text>
                    </TouchableOpacity>
                    
                    {autoSimulation && (
                        <>
                            <TouchableOpacity 
                                style={styles.speedButton} 
                                onPress={() => changeSimulationSpeed(true)}
                            >
                                <Text style={styles.timeButtonText}>Faster</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.speedButton} 
                                onPress={() => changeSimulationSpeed(false)}
                            >
                                <Text style={styles.timeButtonText}>Slower</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={[styles.timeButtonText, {marginVertical: normalizeSize(5)}]}>Manual Controls:</Text>
            
            <View style={styles.timeButtonsRow}>
                <TouchableOpacity style={styles.timeButton} onPress={setDaytime}>
                    <Text style={styles.timeButtonText}>Day (12 PM)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.timeButton} onPress={setNighttime}>
                    <Text style={styles.timeButtonText}>Night (10 PM)</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.timeButtonsRow}>
                <TouchableOpacity style={styles.timeButton} onPress={setSunrise}>
                    <Text style={styles.timeButtonText}>Sunrise (6 AM)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.timeButton} onPress={setSunset}>
                    <Text style={styles.timeButtonText}>Sunset (5 PM)</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity 
                style={[styles.timeButton, { backgroundColor: '#3949ab' }]} 
                onPress={resetToRealTime}
            >
                <Text style={styles.timeButtonText}>Reset to Real Time</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    timeControls: {
        position: 'absolute',
        top: normalizeSize(100),
        right: normalizeSize(20),
        backgroundColor: 'rgba(6, 26, 64, 0.9)',
        borderRadius: normalizeSize(10),
        padding: normalizeSize(15),
        zIndex: 10,
        borderWidth: 1,
        borderColor: '#4d76bd',
        minWidth: normalizeSize(280),
    },
    timeControlsTitle: {
        color: 'white',
        fontSize: scaleFontSize(16),
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: normalizeSize(10),
    },
    timeButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: normalizeSize(8),
    },
    timeButton: {
        backgroundColor: '#0c7cd5',
        padding: normalizeSize(8),
        borderRadius: normalizeSize(5),
        marginHorizontal: normalizeSize(5),
        minWidth: normalizeSize(100),
        alignItems: 'center',
    },
    timeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: scaleFontSize(12),
    },
    autoControlsContainer: {
        marginBottom: normalizeSize(8),
    },
    divider: {
        height: 1,
        backgroundColor: '#4d76bd',
        marginVertical: normalizeSize(8),
    },
    speedButton: {
        backgroundColor: '#3949ab',
        padding: normalizeSize(8),
        borderRadius: normalizeSize(5),
        marginHorizontal: normalizeSize(3),
        minWidth: normalizeSize(60),
        alignItems: 'center',
    },
});

export default TimeSimulationControls; 