// Network scanning types
export interface DiscoveredDevice {
  id: string;
  name: string;
  address: string;
  lastSeen: Date;
}

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';

// Connection types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type ConnectionListener = (status: ConnectionStatus) => void;
export type DeviceListener = (devices: DiscoveredDevice[]) => void;
export type ScanStatusListener = (status: ScanStatus, message?: string) => void;
export type SettingsListener = (settings: PrayerTimesSettings) => void;
export type IqamahListener = (offsets: IqamahOffsets) => void;

// Message types for WebSocket communication
export interface WebSocketMessage {
  type: string;
  data?: any;
}

export interface PrayerTimesSettings {
  latitude: string | number;
  longitude: string | number;
  method: string;
  asrJuristic: string;
  adjustments: {
    fajr: string | number;
    sunrise?: string | number;
    dhuhr: string | number;
    asr: string | number;
    maghrib: string | number;
    isha: string | number;
  };
  timeFormat?: string;
  timezone?: string | number;
}

export interface IqamahOffsets {
  fajr: string | number;
  dhuhr: string | number;
  asr: string | number;
  maghrib: string | number;
  isha: string | number;
}

// Display context types
export interface DisplayContextType {
  connectionStatus: ConnectionStatus;
  serverAddress: string;
  setServerAddress: (address: string) => void;
  connect: (address: string) => void;
  disconnect: () => void;
  
  discoveredDevices: DiscoveredDevice[];
  scanStatus: ScanStatus;
  scanMessage: string;
  startScan: () => Promise<void>;
  stopScan: () => void;
  checkDevice: (address: string) => Promise<boolean>;
  
  settings: PrayerTimesSettings | null;
  updateSettings: (settings: PrayerTimesSettings) => Promise<void>;
  updateIqamahOffsets: (offsets: IqamahOffsets) => Promise<void>;
}

export interface DisplayProviderProps {
  children: React.ReactNode;
} 