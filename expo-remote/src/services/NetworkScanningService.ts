import * as Network from 'expo-network';
import { Alert } from 'react-native';

// Define types
export interface DiscoveredDevice {
  id: string;
  name: string;
  address: string;
  lastSeen: Date;
}

export type ScanStatus = 'idle' | 'scanning' | 'error';

// Event listener types
type DeviceDiscoveryListener = (device: DiscoveredDevice) => void;
type ScanStatusListener = (status: ScanStatus, message?: string) => void;

class NetworkScanningService {
  private static instance: NetworkScanningService;
  private devices: Map<string, DiscoveredDevice> = new Map();
  private isScanning: boolean = false;
  private scanTimeout: NodeJS.Timeout | null = null;
  private deviceListeners: DeviceDiscoveryListener[] = [];
  private statusListeners: ScanStatusListener[] = [];
  private scanStatus: ScanStatus = 'idle';
  
  // Common ports for the prayer display app
  private ports: number[] = [3000, 8080, 8000, 9000];
  
  // Default scan timeout (in ms)
  private readonly SCAN_TIMEOUT = 10000;
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): NetworkScanningService {
    if (!NetworkScanningService.instance) {
      NetworkScanningService.instance = new NetworkScanningService();
    }
    return NetworkScanningService.instance;
  }
  
  /**
   * Add a device discovery listener
   */
  public addDeviceListener(listener: DeviceDiscoveryListener): void {
    this.deviceListeners.push(listener);
  }
  
  /**
   * Remove a device discovery listener
   */
  public removeDeviceListener(listener: DeviceDiscoveryListener): void {
    this.deviceListeners = this.deviceListeners.filter(l => l !== listener);
  }
  
  /**
   * Add a scan status listener
   */
  public addStatusListener(listener: ScanStatusListener): void {
    this.statusListeners.push(listener);
  }
  
  /**
   * Remove a scan status listener
   */
  public removeStatusListener(listener: ScanStatusListener): void {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }
  
  /**
   * Start scanning for prayer display apps on the network
   */
  public async startScan(): Promise<void> {
    if (this.isScanning) {
      return; // Already scanning
    }
    
    try {
      // Check if connected to WiFi
      const networkState = await Network.getNetworkStateAsync();
      
      if (!networkState.isConnected || networkState.type !== Network.NetworkStateType.WIFI) {
        this.setStatus('error', 'Not connected to WiFi');
        return;
      }
      
      // Clear previous devices
      this.devices.clear();
      
      // Start scanning
      this.isScanning = true;
      this.setStatus('scanning', 'Scanning network for prayer displays...');
      
      // Get IP address
      const ipAddress = await Network.getIpAddressAsync();
      
      if (!ipAddress) {
        this.setStatus('error', 'Could not determine IP address');
        this.isScanning = false;
        return;
      }
      
      // Get network prefix (e.g., 192.168.1)
      const ipParts = ipAddress.split('.');
      if (ipParts.length !== 4) {
        this.setStatus('error', 'Invalid IP address format');
        this.isScanning = false;
        return;
      }
      
      const networkPrefix = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
      
      // Scan network range for devices
      await this.scanNetworkRange(networkPrefix);
      
      // Set timeout to end scanning after SCAN_TIMEOUT
      this.scanTimeout = setTimeout(() => {
        this.stopScan();
      }, this.SCAN_TIMEOUT);
      
    } catch (error) {
      console.error('Error starting network scan:', error);
      this.setStatus('error', 'Failed to start network scan');
      this.isScanning = false;
    }
  }
  
  /**
   * Stop scanning for devices
   */
  public stopScan(): void {
    if (!this.isScanning) {
      return;
    }
    
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    
    this.isScanning = false;
    this.setStatus('idle', 'Scan completed');
  }
  
  /**
   * Get all discovered devices
   */
  public getDiscoveredDevices(): DiscoveredDevice[] {
    return Array.from(this.devices.values());
  }
  
  /**
   * Check if a specific device is available
   */
  public async checkDevice(address: string): Promise<boolean> {
    try {
      for (const port of this.ports) {
        const deviceAddress = address.includes(':') ? address : `${address}:${port}`;
        const isAvailable = await this.checkDeviceConnectivity(deviceAddress);
        
        if (isAvailable) {
          // Add or update device in the list
          const deviceId = deviceAddress;
          const device: DiscoveredDevice = {
            id: deviceId,
            name: `Prayer Display (${deviceAddress})`,
            address: deviceAddress,
            lastSeen: new Date()
          };
          
          this.devices.set(deviceId, device);
          
          // Notify listeners
          this.notifyDeviceDiscovered(device);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking device:', error);
      return false;
    }
  }
  
  /**
   * Scan network range for prayer display apps
   */
  private async scanNetworkRange(networkPrefix: string): Promise<void> {
    // Start multiple scans in parallel (up to 254 addresses)
    const scanPromises: Promise<void>[] = [];
    
    for (let i = 1; i <= 254; i++) {
      const ipAddress = `${networkPrefix}.${i}`;
      
      // Check each IP with common ports
      for (const port of this.ports) {
        scanPromises.push(this.scanAddress(`${ipAddress}:${port}`));
      }
    }
    
    try {
      // Wait for all scans to complete
      await Promise.all(scanPromises);
    } catch (error) {
      console.error('Error during network scan:', error);
    }
  }
  
  /**
   * Scan a specific IP address and port
   */
  private async scanAddress(address: string): Promise<void> {
    try {
      if (!this.isScanning) {
        return; // Scan was stopped
      }
      
      const isAvailable = await this.checkDeviceConnectivity(address);
      
      if (isAvailable) {
        // Add or update device in the list
        const deviceId = address;
        const device: DiscoveredDevice = {
          id: deviceId,
          name: `Prayer Display (${address})`,
          address,
          lastSeen: new Date()
        };
        
        this.devices.set(deviceId, device);
        
        // Notify listeners
        this.notifyDeviceDiscovered(device);
      }
    } catch (error) {
      // Silently fail for individual address scan
      console.debug(`Error scanning address ${address}:`, error);
    }
  }
  
  /**
   * Check if the device is available by trying to connect to it
   */
  private async checkDeviceConnectivity(address: string): Promise<boolean> {
    try {
      // Attempt to connect via WebSocket to check if it's our service
      const ws = new WebSocket(`ws://${address}/controller`);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 1000); // 1 second timeout
        
        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };
        
        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Set scan status and notify listeners
   */
  private setStatus(status: ScanStatus, message?: string): void {
    this.scanStatus = status;
    
    // Notify listeners
    this.statusListeners.forEach(listener => {
      listener(status, message);
    });
  }
  
  /**
   * Notify device discovery listeners
   */
  private notifyDeviceDiscovered(device: DiscoveredDevice): void {
    this.deviceListeners.forEach(listener => {
      listener(device);
    });
  }
}

// Export singleton instance
const networkScanningService = NetworkScanningService.getInstance();
export default networkScanningService; 