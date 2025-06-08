import {
  PrayerTimes,
  IqamahTimes,
  calculatePrayerTimes,
  calculateIqamahTimes,
  getNextPrayer,
  calculateHijriDate,
  PrayerTimesSettings,
  DEFAULT_SETTINGS,
} from './prayerTimes';
import locationService from './LocationSettings';
import mockAsyncStorage from './MockAsyncStorage';

// Use real AsyncStorage with fallback to mock
let AsyncStorage: any;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
  console.log('Using real AsyncStorage in PrayerDataService');
} catch (error) {
  console.warn('AsyncStorage not available in PrayerDataService, using mock implementation', error);
  AsyncStorage = mockAsyncStorage;
}

interface PrayerData {
  prayerTimes: PrayerTimes;
  iqamahTimes: IqamahTimes;
  hijriDate: {
    day: number;
    month: number;
    year: number;
    monthName: string;
  };
  nextPrayer: { name: string; time: Date; };
}

// Default Iqamah offsets (in minutes) from Adhan time
const DEFAULT_IQAMAH_OFFSETS = {
  fajr: 20,
  dhuhr: 10,
  asr: 10,
  maghrib: 5,
  isha: 15,
};

// Storage key for iqamah offsets
const STORAGE_KEY_IQAMAH = '@prayer_iqamah_offsets';

/**
 * Service for managing prayer times data
 */
class PrayerDataService {
  private static instance: PrayerDataService;
  private prayerData: PrayerData | null = null;
  private prayerTimesSettings: PrayerTimesSettings;
  private iqamahOffsets = DEFAULT_IQAMAH_OFFSETS;
  private initialized = false;
  private storageAvailable = true;

  private constructor() {
    // Create prayer settings using default values and location coordinates
    const location = locationService.getLocation();
    this.prayerTimesSettings = {
      ...DEFAULT_SETTINGS,
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): PrayerDataService {
    if (!PrayerDataService.instance) {
      PrayerDataService.instance = new PrayerDataService();
    }
    return PrayerDataService.instance;
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {return;}

    try {
      // Get location
      const location = locationService.getLocation();
      // Setup prayer settings with location
      this.prayerTimesSettings = {
        ...DEFAULT_SETTINGS,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      // Load iqamah offsets from storage
      const offsetsJson = await AsyncStorage.getItem(STORAGE_KEY_IQAMAH);

      if (offsetsJson) {
        this.iqamahOffsets = JSON.parse(offsetsJson);
      }

      // Settings already initialized above

      // Calculate initial prayer data
      await this.refreshPrayerData();

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing prayer data service:', error);
      this.storageAvailable = false;

      // Use defaults if initialization fails
      const location = locationService.getLocation();
      this.prayerTimesSettings = {
        ...DEFAULT_SETTINGS,
        latitude: location.latitude,
        longitude: location.longitude,
      };
      this.iqamahOffsets = { ...DEFAULT_IQAMAH_OFFSETS };

      // Calculate initial prayer data with defaults
      await this.refreshPrayerData();

      this.initialized = true;
    }
  }

  /**
   * Refresh prayer data based on current settings
   */
  public async refreshPrayerData(forceRefresh = false): Promise<PrayerData> {
    // Get current location
    const location = locationService.getLocation();
    // Create current settings using location and default prayer settings
    const currentSettings = {
      ...this.prayerTimesSettings,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    // Log the location and settings being used
    console.log('PRAYER LOCATION DATA:', {
      latitude: currentSettings.latitude,
      longitude: currentSettings.longitude,
      timezone: currentSettings.timezone,
      method: currentSettings.method,
      adjustments: currentSettings.adjustments,
    });

    // If not initialized, force refresh
    if (!this.initialized) {forceRefresh = true;}

    // If prayer data doesn't exist or settings have changed, recalculate
    if (
      forceRefresh ||
      !this.prayerData ||
      this.shouldRecalculatePrayerTimes(currentSettings) ||
      this.prayerTimesForDifferentDate(new Date())
    ) {
      this.prayerTimesSettings = currentSettings;

      // Set timezone from device if not set
      if (this.prayerTimesSettings.timezone === undefined || this.prayerTimesSettings.timezone === null) {
        this.prayerTimesSettings.timezone = -new Date().getTimezoneOffset() / 60;
      }

      // Calculate prayer and iqamah times for current date
      const date = new Date();
      const prayerTimes = calculatePrayerTimes(date, this.prayerTimesSettings);
      const iqamahTimes = calculateIqamahTimes(prayerTimes, this.iqamahOffsets);

      // Calculate Hijri date
      const hijriDate = calculateHijriDate(date);

      // Determine next prayer
      const nextPrayer = getNextPrayer(prayerTimes, this.prayerTimesSettings);

      // Update prayer data
      this.prayerData = {
        prayerTimes,
        iqamahTimes,
        hijriDate,
        nextPrayer,
      };
    }

    // This non-null assertion is safe because we just calculated the prayer data if it was null
    return this.prayerData!;
  }

  /**
   * Get current prayer data
   */
  public async getPrayerData(): Promise<PrayerData> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.prayerData) {
      await this.refreshPrayerData(true);
    }

    // This non-null assertion is safe because we just calculated the prayer data if it was null
    return this.prayerData!;
  }

  /**
   * Update iqamah offsets
   */
  public async updateIqamahOffsets(offsets: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number
  }): Promise<void> {
    this.iqamahOffsets = offsets;

    // Recalculate iqamah times with new offsets
    if (this.prayerData) {
      this.prayerData.iqamahTimes = calculateIqamahTimes(
        this.prayerData.prayerTimes,
        this.iqamahOffsets
      );
    }

    // Store updated offsets if storage is available
    if (this.storageAvailable) {
      try {
        await AsyncStorage.setItem(STORAGE_KEY_IQAMAH, JSON.stringify(offsets));
      } catch (error) {
        console.error('Error saving iqamah offsets:', error);
        this.storageAvailable = false;
      }
    }
  }

  /**
   * Get iqamah offsets
   */
  public getIqamahOffsets(): {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number
  } {
    return { ...this.iqamahOffsets };
  }

  /**
   * Calculate prayer times for a specific date
   */
  public calculatePrayerTimesForDate(date: Date): PrayerData {
    const prayerTimes = calculatePrayerTimes(date, this.prayerTimesSettings);
    const iqamahTimes = calculateIqamahTimes(prayerTimes, this.iqamahOffsets);
    const hijriDate = calculateHijriDate(date);
    const nextPrayer = getNextPrayer(prayerTimes);

    return {
      prayerTimes,
      iqamahTimes,
      hijriDate,
      nextPrayer,
    };
  }

  /**
   * Get prayer data for a week
   */
  public getPrayerTimesForWeek(startDate = new Date()): PrayerData[] {
    const result: PrayerData[] = [];

    // Calculate prayer times for each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      result.push(this.calculatePrayerTimesForDate(date));
    }

    return result;
  }

  /**
   * Get prayer data for a month
   */
  public getPrayerTimesForMonth(startDate = new Date()): PrayerData[] {
    const result: PrayerData[] = [];

    // Calculate prayer times for each day of the month
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      result.push(this.calculatePrayerTimesForDate(date));
    }

    return result;
  }

  /**
   * Check if prayer times need to be recalculated based on settings changes
   */
  private shouldRecalculatePrayerTimes(newSettings: PrayerTimesSettings): boolean {
    // Compare relevant settings properties
    return (
      this.prayerTimesSettings.latitude !== newSettings.latitude ||
      this.prayerTimesSettings.longitude !== newSettings.longitude ||
      this.prayerTimesSettings.timezone !== newSettings.timezone ||
      this.prayerTimesSettings.method !== newSettings.method ||
      this.prayerTimesSettings.asrJuristic !== newSettings.asrJuristic ||
      JSON.stringify(this.prayerTimesSettings.adjustments) !==
        JSON.stringify(newSettings.adjustments)
    );
  }

  /**
   * Check if prayer times are for the current date
   */
  private prayerTimesForDifferentDate(date: Date): boolean {
    if (!this.prayerData) {return true;}

    // Extract date components
    const currentDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    // Extract date from prayer times (using Fajr time)
    const prayerDate = new Date(this.prayerData.prayerTimes.fajr);
    const storedDate = new Date(
      prayerDate.getFullYear(),
      prayerDate.getMonth(),
      prayerDate.getDate()
    );

    // Compare dates
    return currentDate.getTime() !== storedDate.getTime();
  }
}

export default PrayerDataService.getInstance();
