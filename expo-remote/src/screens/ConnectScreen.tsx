import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useDisplay } from '../context/DisplayContext';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';

// Define screen props for navigation
interface ConnectScreenProps {
  navigation: any;
}

const ConnectScreen: React.FC<ConnectScreenProps> = ({ navigation }) => {
  const { 
    connectionStatus, 
    connect, 
    serverAddress, 
    setServerAddress,
    discoveredDevices, 
    scanStatus, 
    scanMessage,
    startScan, 
    stopScan,
    checkDevice
  } = useDisplay();
  
  const [manualAddress, setManualAddress] = useState(serverAddress);
  const [isScanning, setIsScanning] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check for biometric authentication support
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (enrolled) {
          authenticateUser();
        } else {
          // Biometrics not enrolled, consider authenticated
          setIsAuthenticated(true);
        }
      } else {
        // No biometrics available, consider authenticated
        setIsAuthenticated(true);
      }
    })();
  }, []);
  
  // Update local scanning state when scan status changes
  useEffect(() => {
    setIsScanning(scanStatus === 'scanning');
  }, [scanStatus]);
  
  // Navigate to settings when connected
  useEffect(() => {
    if (connectionStatus === 'connected') {
      navigation.navigate('Settings');
    }
  }, [connectionStatus, navigation]);
  
  // Authenticate user with biometrics
  const authenticateUser = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Prayer Display Remote',
        fallbackLabel: 'Use passcode',
      });
      
      if (result.success) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert(
        'Authentication Failed',
        'Please try again to access the Prayer Display Remote'
      );
    }
  };
  
  // Handle scanning for devices
  const handleScan = async () => {
    if (isScanning) {
      stopScan();
    } else {
      await startScan();
    }
  };
  
  // Handle connecting to a device
  const handleConnect = (address = manualAddress) => {
    if (!address || address.trim() === '') {
      Alert.alert('Invalid Address', 'Please enter a valid server address');
      return;
    }
    
    connect(address);
  };
  
  // Handle connecting to a discovered device
  const handleDeviceConnect = (device: any) => {
    setManualAddress(device.address);
    handleConnect(device.address);
  };
  
  // Manually check a specific address
  const handleManualCheck = async () => {
    if (!manualAddress || manualAddress.trim() === '') {
      Alert.alert('Invalid Address', 'Please enter a valid server address');
      return;
    }
    
    // Check if device is available
    const isAvailable = await checkDevice(manualAddress);
    
    if (isAvailable) {
      Alert.alert(
        'Device Found',
        `Found Prayer Display at ${manualAddress}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: () => handleConnect(manualAddress) }
        ]
      );
    } else {
      Alert.alert(
        'Device Not Found',
        `Could not find Prayer Display at ${manualAddress}`,
        [{ text: 'OK' }]
      );
    }
  };
  
  // If not authenticated, show an authentication message
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Prayer Display Remote</Text>
        <Text style={styles.subtitle}>Authentication Required</Text>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={authenticateUser}
        >
          <Text style={styles.buttonText}>Authenticate</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Prayer Display Remote</Text>
        <Text style={styles.subtitle}>Connect to Your Prayer Display</Text>
        
        {/* Device Info */}
        <View style={styles.deviceInfoContainer}>
          <Text style={styles.deviceInfoText}>
            Device: {Device.modelName || 'Unknown'}
          </Text>
        </View>
        
        {/* Manual Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Connection</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter server address (e.g., 192.168.1.100:3000)"
              value={manualAddress}
              onChangeText={setManualAddress}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.checkButton]} 
                onPress={handleManualCheck}
              >
                <Text style={styles.buttonText}>Check</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.connectButton]} 
                onPress={() => handleConnect()}
              >
                <Text style={styles.buttonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Scanning Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Network Discovery</Text>
            <TouchableOpacity 
              style={[
                styles.scanButton, 
                isScanning ? styles.stopScanButton : styles.startScanButton
              ]} 
              onPress={handleScan}
            >
              <Text style={styles.buttonText}>
                {isScanning ? 'Stop Scan' : 'Start Scan'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {isScanning && (
            <View style={styles.scanningContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.scanningText}>{scanMessage || 'Scanning network...'}</Text>
            </View>
          )}
          
          {discoveredDevices.length > 0 ? (
            <FlatList
              data={discoveredDevices}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.deviceItem} 
                  onPress={() => handleDeviceConnect(item)}
                >
                  <View style={styles.deviceItemContent}>
                    <Text style={styles.deviceName}>{item.name}</Text>
                    <Text style={styles.deviceAddress}>{item.address}</Text>
                    <Text style={styles.deviceLastSeen}>
                      Last seen: {item.lastSeen.toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={styles.connectIconContainer}>
                    <Text style={styles.connectIcon}>→</Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.deviceList}
            />
          ) : (
            <View style={styles.noDevicesContainer}>
              <Text style={styles.noDevicesText}>
                {isScanning 
                  ? 'Searching for devices...' 
                  : 'No devices found. Tap "Start Scan" to search for prayer displays.'}
              </Text>
            </View>
          )}
        </View>
        
        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Connection Status:</Text>
          <Text 
            style={[
              styles.statusText, 
              connectionStatus === 'connected' ? styles.statusConnected : 
              connectionStatus === 'connecting' ? styles.statusConnecting :
              connectionStatus === 'error' ? styles.statusError :
              styles.statusDisconnected
            ]}
          >
            {connectionStatus.toUpperCase()}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#546E7A',
    textAlign: 'center',
    marginBottom: 20,
  },
  deviceInfoContainer: {
    backgroundColor: '#E1F5FE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  deviceInfoText: {
    color: '#0277BD',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37474F',
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    backgroundColor: '#78909C',
    marginRight: 10,
  },
  connectButton: {
    backgroundColor: '#2196F3',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 40,
  },
  scanButton: {
    padding: 8,
    borderRadius: 5,
    minWidth: 90,
    alignItems: 'center',
  },
  startScanButton: {
    backgroundColor: '#4CAF50',
  },
  stopScanButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scanningContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scanningText: {
    marginTop: 10,
    fontSize: 16,
    color: '#455A64',
  },
  deviceList: {
    maxHeight: 300,
  },
  deviceItem: {
    backgroundColor: '#EEF6FF',
    borderRadius: 8,
    marginBottom: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  deviceItemContent: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37474F',
    marginBottom: 5,
  },
  deviceAddress: {
    fontSize: 14,
    color: '#455A64',
    marginBottom: 3,
  },
  deviceLastSeen: {
    fontSize: 12,
    color: '#78909C',
  },
  connectIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  connectIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noDevicesContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noDevicesText: {
    color: '#78909C',
    textAlign: 'center',
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  statusTitle: {
    fontSize: 16,
    marginRight: 10,
    color: '#546E7A',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusConnected: {
    color: '#4CAF50',
  },
  statusConnecting: {
    color: '#FF9800',
  },
  statusDisconnected: {
    color: '#78909C',
  },
  statusError: {
    color: '#F44336',
  },
});

export default ConnectScreen; 