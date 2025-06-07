import * as React from 'react';
import { useState, useEffect, useContext, useCallback, createContext } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetworkScanningService from '../services/NetworkScanningService';
import DisplayConnectionService from '../services/DisplayConnectionService';
import { 
  ConnectionStatus, 
  DisplayContextType,
  DisplayProviderProps, 
  DiscoveredDevice, 
  IqamahOffsets, 
  PrayerTimesSettings, 
  ScanStatus 
} from '../types';

// Create the context with default values
const DisplayContext = createContext<DisplayContextType>({
  connectionStatus: 'disconnected',
  serverAddress: '',
  setServerAddress: () => {},
  connect: () => {},
  disconnect: () => {},
  
  discoveredDevices: [],
  scanStatus: 'idle',
  scanMessage: '',
  startScan: async () => {},
  stopScan: () => {},
  checkDevice: async () => false,
  
  settings: null,
  updateSettings: async () => {},
  updateIqamahOffsets: async () => {},
});

// Storage key for the server address
const SERVER_ADDRESS_KEY = 'display_server_address';

// Provider component
export const DisplayProvider: React.FC<DisplayProviderProps> = ({ children }) => {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [serverAddress, setServerAddress] = useState<string>('');
  
  // Scanning state
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanMessage, setScanMessage] = useState<string>('');
  
  // Settings state
  const [settings, setSettings] = useState<PrayerTimesSettings | null>(null);
  
  // Load the saved server address on mount
  useEffect(() => {
    const loadServerAddress = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem(SERVER_ADDRESS_KEY);
        if (savedAddress) {
          setServerAddress(savedAddress);
        }
      } catch (error) {
        console.error('Error loading server address:', error);
      }
    };
    
    loadServerAddress();
  }, []);
  
  // Set up connection event listeners
  useEffect(() => {
    const handleConnectionStatus = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      
      if (status === 'error') {
        Alert.alert(
          'Connection Error',
          'Failed to connect to the prayer display. Please check the address and try again.',
          [{ text: 'OK' }]
        );
      }
    };
    
    const handleSettingsUpdate = (newSettings: PrayerTimesSettings) => {
      setSettings(newSettings);
    };
    
    // Add listeners
    DisplayConnectionService.addConnectionListener(handleConnectionStatus);
    DisplayConnectionService.addSettingsListener(handleSettingsUpdate);
    
    // Clean up listeners on unmount
    return () => {
      DisplayConnectionService.removeConnectionListener(handleConnectionStatus);
      DisplayConnectionService.removeSettingsListener(handleSettingsUpdate);
    };
  }, []);
  
  // Set up scanning event listeners
  useEffect(() => {
    // Update handleDevicesUpdate to accept a single device
    const handleDeviceDiscovered = (device: DiscoveredDevice) => {
      setDiscoveredDevices(prev => {
        // Add device if it doesn't exist, otherwise update existing
        const exists = prev.some(d => d.id === device.id);
        if (exists) {
          return prev.map(d => d.id === device.id ? device : d);
        } else {
          return [...prev, device];
        }
      });
    };
    
    const handleScanStatus = (status: ScanStatus, message?: string) => {
      setScanStatus(status);
      if (message) {
        setScanMessage(message);
      }
      
      // Clear devices list when starting a new scan
      if (status === 'scanning') {
        setDiscoveredDevices([]);
      }
      
      if (status === 'error') {
        Alert.alert(
          'Scanning Error',
          message || 'An error occurred while scanning for prayer displays.',
          [{ text: 'OK' }]
        );
      }
    };
    
    // Add listeners
    NetworkScanningService.addDeviceListener(handleDeviceDiscovered);
    NetworkScanningService.addStatusListener(handleScanStatus);
    
    // Clean up listeners on unmount
    return () => {
      NetworkScanningService.removeDeviceListener(handleDeviceDiscovered);
      NetworkScanningService.removeStatusListener(handleScanStatus);
    };
  }, []);
  
  // Connect to a display
  const connect = useCallback((address: string) => {
    // Save the address for future use
    AsyncStorage.setItem(SERVER_ADDRESS_KEY, address).catch(error => {
      console.error('Error saving server address:', error);
    });
    
    // Update the state
    setServerAddress(address);
    
    // Connect to the display
    DisplayConnectionService.connect(address);
  }, []);
  
  // Disconnect from a display
  const disconnect = useCallback(() => {
    DisplayConnectionService.disconnect();
  }, []);
  
  // Start scanning for displays
  const startScan = useCallback(async () => {
    await NetworkScanningService.startScan();
  }, []);
  
  // Stop scanning for displays
  const stopScan = useCallback(() => {
    NetworkScanningService.stopScan();
  }, []);
  
  // Check if a device is available
  const checkDevice = useCallback(async (address: string) => {
    return await NetworkScanningService.checkDevice(address);
  }, []);
  
  // Update prayer times settings
  const updateSettings = useCallback(async (newSettings: PrayerTimesSettings) => {
    // Convert string values to numbers if needed
    const numericSettings = {
      ...newSettings,
      latitude: typeof newSettings.latitude === 'string' ? parseFloat(newSettings.latitude) : newSettings.latitude,
      longitude: typeof newSettings.longitude === 'string' ? parseFloat(newSettings.longitude) : newSettings.longitude,
      timezone: typeof newSettings.timezone === 'string' ? parseFloat(newSettings.timezone) : newSettings.timezone || 0,
      adjustments: {
        fajr: typeof newSettings.adjustments.fajr === 'string' ? parseFloat(newSettings.adjustments.fajr) : newSettings.adjustments.fajr,
        sunrise: typeof newSettings.adjustments.sunrise === 'string' ? parseFloat(newSettings.adjustments.sunrise) : (newSettings.adjustments.sunrise || 0),
        dhuhr: typeof newSettings.adjustments.dhuhr === 'string' ? parseFloat(newSettings.adjustments.dhuhr) : newSettings.adjustments.dhuhr,
        asr: typeof newSettings.adjustments.asr === 'string' ? parseFloat(newSettings.adjustments.asr) : newSettings.adjustments.asr,
        maghrib: typeof newSettings.adjustments.maghrib === 'string' ? parseFloat(newSettings.adjustments.maghrib) : newSettings.adjustments.maghrib,
        isha: typeof newSettings.adjustments.isha === 'string' ? parseFloat(newSettings.adjustments.isha) : newSettings.adjustments.isha,
      }
    };
    await DisplayConnectionService.updateSettings(numericSettings);
  }, []);
  
  // Update iqamah offset settings
  const updateIqamahOffsets = useCallback(async (offsets: IqamahOffsets) => {
    // Convert string values to numbers if needed
    const numericOffsets = {
      fajr: typeof offsets.fajr === 'string' ? parseFloat(offsets.fajr) : offsets.fajr,
      dhuhr: typeof offsets.dhuhr === 'string' ? parseFloat(offsets.dhuhr) : offsets.dhuhr,
      asr: typeof offsets.asr === 'string' ? parseFloat(offsets.asr) : offsets.asr,
      maghrib: typeof offsets.maghrib === 'string' ? parseFloat(offsets.maghrib) : offsets.maghrib,
      isha: typeof offsets.isha === 'string' ? parseFloat(offsets.isha) : offsets.isha,
    };
    await DisplayConnectionService.updateIqamahOffsets(numericOffsets);
  }, []);
  
  // Create the context value
  const contextValue: DisplayContextType = {
    connectionStatus,
    serverAddress,
    setServerAddress,
    connect,
    disconnect,
    
    discoveredDevices,
    scanStatus,
    scanMessage,
    startScan,
    stopScan,
    checkDevice,
    
    settings,
    updateSettings,
    updateIqamahOffsets,
  };
  
  return (
    <DisplayContext.Provider value={contextValue}>
      {children}
    </DisplayContext.Provider>
  );
};

// Custom hook to use the display context
export const useDisplay = () => {
  const context = useContext(DisplayContext);
  
  if (!context) {
    throw new Error('useDisplay must be used within a DisplayProvider');
  }
  
  return context;
}; 