import { PrayerTimesSettings } from '../core/prayerTimes';

// Type for the connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Interface for Iqamah offsets
export interface IqamahOffsets {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

// Connection events listeners
type ConnectionListener = (status: ConnectionStatus, message?: string) => void;
type SettingsListener = (settings: PrayerTimesSettings) => void;
type IqamahListener = (iqamahOffsets: IqamahOffsets) => void;

/**
 * Service for managing connection to the prayer display
 */
export class DisplayConnectionService {
  private static instance: DisplayConnectionService;
  private socket: WebSocket | null = null;
  private serverAddress: string = '';
  private connectionStatus: ConnectionStatus = 'disconnected';
  private connectionListeners: ConnectionListener[] = [];
  private settingsListeners: SettingsListener[] = [];
  private iqamahListeners: IqamahListener[] = [];
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): DisplayConnectionService {
    if (!DisplayConnectionService.instance) {
      DisplayConnectionService.instance = new DisplayConnectionService();
    }
    return DisplayConnectionService.instance;
  }

  /**
   * Connect to the display app
   * @param serverAddress Address of the server (e.g. "192.168.1.100:3000")
   */
  public connect(serverAddress: string): void {
    this.serverAddress = serverAddress;
    this.setStatus('connecting', 'Connecting to prayer display...');

    try {
      // Close existing connection if any
      if (this.socket) {
        this.socket.close();
      }

      // Clear any existing reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // Create new WebSocket connection
      this.socket = new WebSocket(`ws://${serverAddress}/controller`);

      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error connecting to display:', error);
      this.setStatus('error', 'Failed to connect to display');
    }
  }

  /**
   * Disconnect from the display app
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.setStatus('disconnected', 'Disconnected from prayer display');
  }

  /**
   * Update prayer settings on the display app
   * @param settings New prayer settings
   */
  public updateSettings(settings: PrayerTimesSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.connectionStatus !== 'connected') {
        reject(new Error('Not connected to display'));
        return;
      }

      try {
        const message = {
          type: 'update_settings',
          settings,
        };

        this.socket.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        console.error('Error updating settings:', error);
        reject(error);
      }
    });
  }

  /**
   * Update Iqamah time offsets on the display app
   * @param offsets New Iqamah time offsets
   */
  public updateIqamahOffsets(offsets: IqamahOffsets): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.connectionStatus !== 'connected') {
        reject(new Error('Not connected to display'));
        return;
      }

      try {
        const message = {
          type: 'update_iqamah_offsets',
          offsets,
        };

        this.socket.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        console.error('Error updating Iqamah offsets:', error);
        reject(error);
      }
    });
  }

  /**
   * Request current settings from the display app
   */
  public requestSettings(): void {
    if (!this.socket || this.connectionStatus !== 'connected') {
      console.error('Not connected to display');
      return;
    }

    try {
      const message = {
        type: 'get_settings',
      };

      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error requesting settings:', error);
    }
  }

  /**
   * Add a connection status listener
   * @param listener Function to call when connection status changes
   */
  public addConnectionListener(listener: ConnectionListener): void {
    this.connectionListeners.push(listener);
    // Immediately notify the listener of current status
    listener(this.connectionStatus);
  }

  /**
   * Remove a connection status listener
   * @param listener Function to remove
   */
  public removeConnectionListener(listener: ConnectionListener): void {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  /**
   * Add a settings listener
   * @param listener Function to call when settings are received
   */
  public addSettingsListener(listener: SettingsListener): void {
    this.settingsListeners.push(listener);
  }

  /**
   * Remove a settings listener
   * @param listener Function to remove
   */
  public removeSettingsListener(listener: SettingsListener): void {
    this.settingsListeners = this.settingsListeners.filter(l => l !== listener);
  }

  /**
   * Add an Iqamah offsets listener
   * @param listener Function to call when Iqamah offsets are received
   */
  public addIqamahListener(listener: IqamahListener): void {
    this.iqamahListeners.push(listener);
  }

  /**
   * Remove an Iqamah offsets listener
   * @param listener Function to remove
   */
  public removeIqamahListener(listener: IqamahListener): void {
    this.iqamahListeners = this.iqamahListeners.filter(l => l !== listener);
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.setStatus('connected', 'Connected to prayer display');

    // Start heartbeat to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // Send heartbeat every 30 seconds

    // Request current settings
    this.requestSettings();
  }

  /**
   * Handle WebSocket message event
   * In React Native, the data is accessed as a string from event.data
   */
  private handleMessage(event: any): void {
    try {
      // Parse the WebSocket message data
      const data = JSON.parse(typeof event.data === 'string' ? event.data : '{}');

      switch (data.type) {
        case 'settings':
          // Notify settings listeners
          this.settingsListeners.forEach(listener => {
            listener(data.settings);
          });
          break;

        case 'iqamah_offsets':
          // Notify Iqamah offsets listeners
          this.iqamahListeners.forEach(listener => {
            listener(data.offsets);
          });
          break;

        case 'error':
          console.error('Error from display:', data.message);
          this.setStatus('error', data.message || 'Unknown error from display');
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(): void {
    this.socket = null;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.setStatus('disconnected', 'Disconnected from prayer display');

    // Try to reconnect after a delay
    this.reconnectTimeout = setTimeout(() => {
      if (this.serverAddress) {
        this.connect(this.serverAddress);
      }
    }, 5000); // 5 seconds
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: any): void {
    console.error('WebSocket error:', event);
    this.setStatus('error', 'Connection error');
  }

  /**
   * Set connection status and notify listeners
   */
  private setStatus(status: ConnectionStatus, message?: string): void {
    this.connectionStatus = status;
    this.connectionListeners.forEach(listener => {
      listener(status, message);
    });
  }
}

export default DisplayConnectionService.getInstance();
