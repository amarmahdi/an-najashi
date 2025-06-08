/* eslint-disable @typescript-eslint/no-unused-vars */
import locationService from '../core/LocationSettings';
import { DEFAULT_SETTINGS } from '../core/prayerTimes';
import nativeSocketService from './NativeSocketService';

// Local types for settings to avoid dependency issues
interface IqamahOffsets {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

interface PrayerTimesSettings {
  calculationMethod: string;
  asrMethod: string;
  adjustments: {
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
}

/**
 * WebSocketControllerService
 *
 * This service manages WebSocket connections for the Prayer Display control.
 * It uses NativeSocketService to handle socket connections and message processing.
 */
class WebSocketControllerService {
  private static instance: WebSocketControllerService;
  private isRunning: boolean = false;

  private constructor() {
    // Private constructor for singleton
    this.initialize();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): WebSocketControllerService {
    if (!WebSocketControllerService.instance) {
      WebSocketControllerService.instance = new WebSocketControllerService();
    }
    return WebSocketControllerService.instance;
  }

  /**
   * Initialize the service
   */
  private initialize(): void {
    // Add message handler to process incoming messages
    nativeSocketService.addMessageHandler(this.handleMessage.bind(this));

    // Add error handler
    nativeSocketService.addErrorHandler(this.handleError.bind(this));

    console.log('WebSocketControllerService initialized');
  }

  /**
   * Start the WebSocket server
   */
  public start(): Promise<void> {
    console.log('Starting WebSocketControllerService...');

    if (this.isRunning) {
      console.log('WebSocketControllerService already running');
      return Promise.resolve();
    }

    return nativeSocketService.start(3000)
      .then(() => {
        this.isRunning = true;
        console.log('WebSocketControllerService started successfully on port 3000');
      })
      .catch(error => {
        console.error('Failed to start WebSocketControllerService:', error);
        this.isRunning = false;
        throw error;
      });
  }

  /**
   * Stop the WebSocket server
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('WebSocketControllerService not running');
      return;
    }

    try {
      nativeSocketService.stop();
      this.isRunning = false;
      console.log('WebSocketControllerService stopped');
    } catch (error) {
      console.error('Error stopping WebSocketControllerService:', error);
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: any): void {
    console.log('WebSocketControllerService received message:', JSON.stringify(data));

    try {
      // Check if data has a type field
      if (data && data.type) {
        switch (data.type) {
          case 'GET_SETTINGS':
            this.handleGetSettings();
            break;

          case 'UPDATE_SETTINGS':
            this.handleUpdateSettings(data.settings);
            break;

          case 'GET_IQAMAH_OFFSETS':
            this.handleGetIqamahOffsets();
            break;

          case 'UPDATE_IQAMAH_OFFSETS':
            this.handleUpdateIqamahOffsets(data.offsets);
            break;

          case 'HEARTBEAT':
            this.handleHeartbeat(data);
            break;

          default:
            console.warn(`Unknown message type: ${data.type}`);
        }
      } else {
        console.warn('Received message without type field:', data);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('WebSocketControllerService error:', error);
  }

  /**
   * Handle GET_SETTINGS request
   */
  private handleGetSettings(): void {
    try {
      // Get location coordinates
      const location = locationService.getLocation();
      // Combine with prayer settings
      const settings = {
        ...DEFAULT_SETTINGS,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      nativeSocketService.broadcast({
        type: 'SETTINGS',
        settings,
      });
    } catch (error) {
      console.error('Error handling GET_SETTINGS:', error);

      nativeSocketService.broadcast({
        type: 'ERROR',
        error: 'Failed to get settings',
      });
    }
  }

  /**
   * Handle UPDATE_SETTINGS request
   */
  private handleUpdateSettings(settings: any): void {
    try {
      console.log('Updating settings:', settings);
      // Extract location coordinates from settings
      if (settings && settings.latitude !== undefined && settings.longitude !== undefined) {
        // Only update location part in LocationService
        locationService.updateLocation(settings.latitude, settings.longitude);
      }

      nativeSocketService.broadcast({
        type: 'SETTINGS_UPDATED',
        success: true,
      });
    } catch (error) {
      console.error('Error handling UPDATE_SETTINGS:', error);

      nativeSocketService.broadcast({
        type: 'ERROR',
        error: 'Failed to update settings',
      });
    }
  }

  /**
   * Handle GET_IQAMAH_OFFSETS request
   */
  private handleGetIqamahOffsets(): void {
    try {
      const offsets = locationService.getIqamahOffsets();

      nativeSocketService.broadcast({
        type: 'IQAMAH_OFFSETS',
        offsets,
      });
    } catch (error) {
      console.error('Error handling GET_IQAMAH_OFFSETS:', error);

      nativeSocketService.broadcast({
        type: 'ERROR',
        error: 'Failed to get iqamah offsets',
      });
    }
  }

  /**
   * Handle UPDATE_IQAMAH_OFFSETS request
   */
  private handleUpdateIqamahOffsets(offsets: any): void {
    try {
      console.log('Updating iqamah offsets:', offsets);
      // Use the public updateIqamahOffsets method
      locationService.updateIqamahOffsets(offsets);

      nativeSocketService.broadcast({
        type: 'IQAMAH_OFFSETS_UPDATED',
        success: true,
      });
    } catch (error) {
      console.error('Error handling UPDATE_IQAMAH_OFFSETS:', error);

      nativeSocketService.broadcast({
        type: 'ERROR',
        error: 'Failed to update iqamah offsets',
      });
    }
  }

  /**
   * Handle HEARTBEAT message
   */
  private handleHeartbeat(data: any): void {
    // Respond to heartbeat to keep connection alive
    nativeSocketService.broadcast({
      type: 'HEARTBEAT_RESPONSE',
      timestamp: Date.now(),
      id: data.id || 'unknown',
    });
  }

  /**
   * Check if the service is running
   */
  public isServerRunning(): boolean {
    return this.isRunning && nativeSocketService.isRunning();
  }

  /**
   * Get the number of connected clients
   */
  public getClientCount(): number {
    return nativeSocketService.getClientCount();
  }

  /**
   * Get the port the server is running on
   */
  public getPort(): number {
    return nativeSocketService.getPort();
  }

  /**
   * Broadcast a message to all clients
   */
  public broadcast(data: any): void {
    nativeSocketService.broadcast(data);
  }
}

// Export singleton instance
const webSocketControllerService = WebSocketControllerService.getInstance();
export default webSocketControllerService;
