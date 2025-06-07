import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { PrayerTimesSettings } from '../core/prayerTimes';
import displayService, { ConnectionStatus, IqamahOffsets } from '../services/DisplayConnectionService';

// Context interface
interface DisplayContextType {
  // Connection state
  connectionStatus: ConnectionStatus;
  statusMessage: string;
  connect: (serverAddress: string) => void;
  disconnect: () => void;
  
  // Settings
  settings: PrayerTimesSettings | null;
  iqamahOffsets: IqamahOffsets | null;
  isLoading: boolean;
  
  // Update methods
  updateSettings: (settings: PrayerTimesSettings) => Promise<void>;
  updateIqamahOffsets: (offsets: IqamahOffsets) => Promise<void>;
  requestSettings: () => void;

  // Server address
  serverAddress: string;
  setServerAddress: (address: string) => void;
}

// Create context with default values
const DisplayContext = createContext<DisplayContextType>({
  // Default values
  connectionStatus: 'disconnected',
  statusMessage: '',
  connect: () => {},
  disconnect: () => {},
  
  settings: null,
  iqamahOffsets: null,
  isLoading: false,
  
  updateSettings: async () => {},
  updateIqamahOffsets: async () => {},
  requestSettings: () => {},

  serverAddress: '',
  setServerAddress: () => {},
});

// Provider props
interface DisplayProviderProps {
  children: ReactNode;
  initialServerAddress?: string;
}

// Provider component
export const DisplayProvider: React.FC<DisplayProviderProps> = ({ 
  children,
  initialServerAddress = '192.168.1.100:3000'
}) => {
  // State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [settings, setSettings] = useState<PrayerTimesSettings | null>(null);
  const [iqamahOffsets, setIqamahOffsets] = useState<IqamahOffsets | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverAddress, setServerAddress] = useState<string>(initialServerAddress);

  // Handle connection status changes
  const handleConnectionStatus = useCallback((status: ConnectionStatus, message?: string) => {
    setConnectionStatus(status);
    if (message) {
      setStatusMessage(message);
    }

    // Handle loading state
    if (status === 'connecting') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }

    // Show alert for connection errors
    if (status === 'error') {
      Alert.alert('Connection Error', message || 'Failed to connect to prayer display');
    }
  }, []);

  // Handle settings changes
  const handleSettingsUpdate = useCallback((newSettings: PrayerTimesSettings) => {
    setSettings(newSettings);
    setIsLoading(false);
  }, []);

  // Handle Iqamah offsets changes
  const handleIqamahUpdate = useCallback((newOffsets: IqamahOffsets) => {
    setIqamahOffsets(newOffsets);
  }, []);

  // Set up event listeners on mount
  useEffect(() => {
    // Add listeners
    displayService.addConnectionListener(handleConnectionStatus);
    displayService.addSettingsListener(handleSettingsUpdate);
    displayService.addIqamahListener(handleIqamahUpdate);

    // Clean up on unmount
    return () => {
      displayService.removeConnectionListener(handleConnectionStatus);
      displayService.removeSettingsListener(handleSettingsUpdate);
      displayService.removeIqamahListener(handleIqamahUpdate);
      displayService.disconnect();
    };
  }, [handleConnectionStatus, handleSettingsUpdate, handleIqamahUpdate]);

  // Connect to display
  const connect = useCallback((address: string) => {
    setIsLoading(true);
    setServerAddress(address);
    displayService.connect(address);
  }, []);

  // Disconnect from display
  const disconnect = useCallback(() => {
    displayService.disconnect();
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings: PrayerTimesSettings) => {
    setIsLoading(true);
    try {
      await displayService.updateSettings(newSettings);
      setSettings(newSettings);
      Alert.alert('Success', 'Prayer settings have been updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update prayer settings');
      console.error('Failed to update settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update Iqamah offsets
  const updateIqamahOffsets = useCallback(async (newOffsets: IqamahOffsets) => {
    setIsLoading(true);
    try {
      await displayService.updateIqamahOffsets(newOffsets);
      setIqamahOffsets(newOffsets);
      Alert.alert('Success', 'Iqamah times have been updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update Iqamah times');
      console.error('Failed to update Iqamah offsets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request settings
  const requestSettings = useCallback(() => {
    if (connectionStatus === 'connected') {
      setIsLoading(true);
      displayService.requestSettings();
    }
  }, [connectionStatus]);

  // Context value
  const value: DisplayContextType = {
    connectionStatus,
    statusMessage,
    connect,
    disconnect,
    
    settings,
    iqamahOffsets,
    isLoading,
    
    updateSettings,
    updateIqamahOffsets,
    requestSettings,

    serverAddress,
    setServerAddress,
  };

  return (
    <DisplayContext.Provider value={value}>
      {children}
    </DisplayContext.Provider>
  );
};

// Custom hook for using the context
export const useDisplay = () => useContext(DisplayContext);

export default DisplayContext; 