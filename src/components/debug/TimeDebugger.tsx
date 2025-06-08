import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimeDebuggerProps {
  actualTime: Date;
  appTime: Date;
  simulatedHour: number | null;
  isSimulating: boolean;
}

const TimeDebugger: React.FC<TimeDebuggerProps> = ({
  actualTime,
  appTime,
  simulatedHour,
  isSimulating,
}) => {
  const formatDebugTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.debugBox}>
        <Text style={styles.title}>⚠️ TIME DEBUG MODE ⚠️</Text>
        <Text style={styles.text}>
          Device Time: {formatDebugTime(actualTime)}
        </Text>
        <Text style={styles.text}>
          App Time: {formatDebugTime(appTime)}
        </Text>
        <Text style={styles.highlight}>
          Simulation {isSimulating ? 'ON' : 'OFF'}
          {isSimulating && simulatedHour !== null ? ` (Hour: ${simulatedHour})` : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  debugBox: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
  },
  highlight: {
    color: 'yellow',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 5,
  },
});

export default TimeDebugger;
