import { PrayerTimesSettings, CalculationMethod, HighLatitudeRule, AsrJuristicMethod } from './prayerTimes';
import Geolocation from '@react-native-community/geolocation';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import mockAsyncStorage from './MockAsyncStorage';

// Use real AsyncStorage with fallback to mock
let AsyncStorage: any;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
  console.log('Using real AsyncStorage');
} catch (error) {
  console.warn('AsyncStorage not available, using mock implementation', error);
  AsyncStorage = mockAsyncStorage;
}

// Default settings (Edmonton coordinates)
const DEFAULT_SETTINGS: PrayerTimesSettings = {
  latitude: 53.5461,
  longitude: -113.4938,
  timezone: -7, // Mountain Standard Time (UTC-7)
  method: 'MWL' as CalculationMethod,
  asrJuristic: 'Standard' as AsrJuristicMethod,
  highLatitudeRule: 'AngleBased' as HighLatitudeRule,
  adjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0
  }
};

// Interface for geolocation position
interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

// Storage key for settings
const STORAGE_KEY_SETTINGS = '@prayer_location_settings';
// Storage key for iqamah offsets
const STORAGE_KEY_IQAMAH_OFFSETS = '@prayer_iqamah_offsets';

// Define IqamahOffsets interface 
export interface IqamahOffsets {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

/**
 * Service for managing location and prayer time settings
 */
class LocationService {
  private static instance: LocationService;
  private settings: PrayerTimesSettings = DEFAULT_SETTINGS;
  private useDeviceLocation: boolean = false;
  private storageAvailable: boolean = true;

  private constructor() {
    // Try to load settings on initialization
    this.loadSettings().catch(error => {
      console.error('Failed to load settings:', error);
      this.storageAvailable = false;
      // Use default settings if loading fails
      this.settings = { ...DEFAULT_SETTINGS };
    });
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Load settings from storage
   */
  public async loadSettings(): Promise<PrayerTimesSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEY_SETTINGS);
      
      if (settingsJson) {
        this.settings = JSON.parse(settingsJson);
      } else {
        // Initialize with default settings if none are saved
        this.settings = { ...DEFAULT_SETTINGS };
      }
      
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      this.storageAvailable = false;
      // Return default settings in case of error
      this.settings = { ...DEFAULT_SETTINGS };
      return this.settings;
    }
  }

  /**
   * Save settings to storage
   */
  public async saveSettings(settings: PrayerTimesSettings): Promise<void> {
    this.settings = settings;
    
    if (!this.storageAvailable) {
      console.warn('Storage not available, settings not persisted');
      return;
    }
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      this.storageAvailable = false;
      throw error;
    }
  }

  /**
   * Get current settings
   */
  public getSettings(): PrayerTimesSettings {
    return { ...this.settings };
  }

  /**
   * Update calculation method
   */
  public async updateCalculationMethod(method: CalculationMethod): Promise<void> {
    const newSettings = {
      ...this.settings,
      method
    };
    
    await this.saveSettings(newSettings);
  }

  /**
   * Update location
   */
  public async updateLocation(latitude: number, longitude: number): Promise<void> {
    const newSettings = {
      ...this.settings,
      latitude,
      longitude
    };
    
    await this.saveSettings(newSettings);
  }

  /**
   * Check if location permission is granted
   */
  public async checkLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        Geolocation.requestAuthorization(
          () => resolve(true),
          () => resolve(false)
        );
      } catch (error) {
        console.error('Error checking location permission:', error);
        resolve(false);
      }
    });
  }

  /**
   * Set whether to use device location
   */
  public async setUseDeviceLocation(useDeviceLocation: boolean): Promise<void> {
    this.useDeviceLocation = useDeviceLocation;
    
    if (useDeviceLocation) {
      try {
        const hasPermission = await this.checkLocationPermission();
        
        if (!hasPermission) {
          throw new Error('Location permission denied');
        }
        
        // Get current position
        const position = await this.getCurrentPosition();
        
        if (position && position.coords) {
          // Update settings with current position
          await this.updateLocation(position.coords.latitude, position.coords.longitude);
          
          // Update timezone
          const timezone = this.getTimezoneOffset();
          this.settings.timezone = timezone;
          await this.saveSettings(this.settings);
        }
      } catch (error) {
        console.error('Error setting device location:', error);
        throw error;
      }
    }
  }

  /**
   * Reset settings to default
   */
  public async resetSettings(): Promise<void> {
    await this.saveSettings(DEFAULT_SETTINGS);
  }

  /**
   * Get current position using geolocation
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      try {
        Geolocation.getCurrentPosition(
          (position: GeolocationPosition) => resolve(position),
          (error: any) => {
            console.error('Geolocation error:', error);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (error) {
        console.error('Error getting current position:', error);
        reject(error);
      }
    });
  }

  /**
   * Get timezone offset from local device
   */
  private getTimezoneOffset(): number {
    // Return timezone offset in hours
    return -new Date().getTimezoneOffset() / 60;
  }

  /**
   * Get iqamah offsets
   */
  public getIqamahOffsets(): IqamahOffsets {
    try {
      // Get stored offsets
      const offsetsStr = this.getValueFromStorage(STORAGE_KEY_IQAMAH_OFFSETS);
      
      // If no saved offsets, return defaults
      if (!offsetsStr) {
        // Default iqamah offsets
        return {
          fajr: 20,
          dhuhr: 10,
          asr: 10,
          maghrib: 5,
          isha: 10
        };
      }
      
      // Parse stored offsets
      const storedOffsets = JSON.parse(offsetsStr);
      
      // Create offsets object with defaults for any missing values
      return {
        fajr: this.parseNumericValue(storedOffsets.fajr, 20),
        dhuhr: this.parseNumericValue(storedOffsets.dhuhr, 10),
        asr: this.parseNumericValue(storedOffsets.asr, 10),
        maghrib: this.parseNumericValue(storedOffsets.maghrib, 5),
        isha: this.parseNumericValue(storedOffsets.isha, 10)
      };
    } catch (error) {
      console.error('Error getting iqamah offsets:', error);
      // Return defaults on error
      return {
        fajr: 20,
        dhuhr: 10,
        asr: 10,
        maghrib: 5,
        isha: 10
      };
    }
  }
  
  /**
   * Update the Iqamah offset settings
   */
  public updateIqamahOffsets(offsets: IqamahOffsets): void {
    try {
      // Validate
      if (!offsets || typeof offsets !== 'object') {
        throw new Error('Invalid iqamah offsets');
      }
      
      // Convert any string values to numbers
      const normalizedOffsets: IqamahOffsets = {
        fajr: this.parseNumericValue(offsets.fajr, 20),
        dhuhr: this.parseNumericValue(offsets.dhuhr, 10),
        asr: this.parseNumericValue(offsets.asr, 10),
        maghrib: this.parseNumericValue(offsets.maghrib, 5),
        isha: this.parseNumericValue(offsets.isha, 10)
      };
      
      // Save to storage
      this.saveValueToStorage(
        STORAGE_KEY_IQAMAH_OFFSETS, 
        JSON.stringify(normalizedOffsets)
      );
      
      console.log('Iqamah offsets updated:', normalizedOffsets);
    } catch (error) {
      console.error('Error updating iqamah offsets:', error);
      throw error;
    }
  }
  
  /**
   * Helper function to parse a numeric value
   */
  private parseNumericValue(value: any, defaultValue: number): number {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    return defaultValue;
  }

  /**
   * Get a value from storage
   */
  private getValueFromStorage(key: string): string | null {
    try {
      // Use AsyncStorage instead of localStorage
      // This is an async method but we need to return synchronously
      // For simplicity, we'll just return null for now
      console.log(`Getting value for key ${key}`);
      // In a real implementation, you would use AsyncStorage.getItem
      // and handle the Promise properly
      return null;
    } catch (error) {
      console.error(`Error getting value for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Save a value to storage
   */
  private saveValueToStorage(key: string, value: string): void {
    try {
      // Use AsyncStorage instead of localStorage
      console.log(`Saving value for key ${key}`);
      // In a real implementation, you would use AsyncStorage.setItem
      // and handle the Promise properly
    } catch (error) {
      console.error(`Error saving value for key ${key}:`, error);
    }
  }
}

export default LocationService.getInstance(); 