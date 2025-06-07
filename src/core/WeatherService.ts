import locationService from './LocationSettings';
import mockAsyncStorage from './MockAsyncStorage';

// Use real AsyncStorage with fallback to mock
let AsyncStorage: any;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  console.warn('AsyncStorage not available, using mock implementation', error);
  AsyncStorage = mockAsyncStorage;
}

// Storage keys
const STORAGE_KEY_WEATHER = '@weather_data';
const STORAGE_KEY_API_KEY = '@weather_api_key';

// Default OpenWeatherMap API key - replace with your own from openweathermap.org
const DEFAULT_API_KEY = ''; // You'll need to set this with your own key

// Types
interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  lastUpdated: number;
}

class WeatherService {
  private static instance: WeatherService;
  private apiKey: string = DEFAULT_API_KEY;
  private weatherData: WeatherData | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private storageAvailable: boolean = true;

  private constructor() {
    this.loadApiKey().catch(error => {
      console.error('Failed to load API key:', error);
      this.storageAvailable = false;
    });
    
    // Load cached weather if available
    this.loadCachedWeather().catch(error => {
      console.error('Failed to load cached weather:', error);
    });
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  /**
   * Initialize service and start refresh interval
   */
  public async initialize(customApiKey?: string): Promise<void> {
    if (customApiKey) {
      await this.setApiKey(customApiKey);
    }
    
    // Fetch weather immediately
    await this.refreshWeather();
    
    // Set up refresh interval (every 30 minutes)
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(async () => {
      try {
        await this.refreshWeather();
      } catch (error) {
        console.error('Error refreshing weather:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Clean up interval on unmount/shutdown
   */
  public cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Set API key
   */
  public async setApiKey(apiKey: string): Promise<void> {
    this.apiKey = apiKey;
    
    if (this.storageAvailable) {
      try {
        await AsyncStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
      } catch (error) {
        console.error('Error saving API key:', error);
        throw error;
      }
    }
  }

  /**
   * Get the currently stored API key
   */
  public async getApiKey(): Promise<string> {
    return this.apiKey;
  }

  /**
   * Load API key from storage
   */
  private async loadApiKey(): Promise<string> {
    try {
      const apiKey = await AsyncStorage.getItem(STORAGE_KEY_API_KEY);
      
      if (apiKey) {
        this.apiKey = apiKey;
      }
      
      return this.apiKey;
    } catch (error) {
      console.error('Error loading API key:', error);
      this.storageAvailable = false;
      return this.apiKey;
    }
  }

  /**
   * Load cached weather data
   */
  private async loadCachedWeather(): Promise<WeatherData | null> {
    try {
      const weatherJson = await AsyncStorage.getItem(STORAGE_KEY_WEATHER);
      
      if (weatherJson) {
        const parsed = JSON.parse(weatherJson);
        
        // Check if the data is less than 1 hour old
        const now = Date.now();
        if (parsed.lastUpdated && now - parsed.lastUpdated < 3600000) {
          this.weatherData = parsed;
          return parsed;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading cached weather:', error);
      return null;
    }
  }

  /**
   * Save weather data to cache
   */
  private async cacheWeatherData(data: WeatherData): Promise<void> {
    if (this.storageAvailable) {
      try {
        // Add timestamp to data
        const dataWithTimestamp = {
          ...data,
          lastUpdated: Date.now()
        };
        
        await AsyncStorage.setItem(STORAGE_KEY_WEATHER, JSON.stringify(dataWithTimestamp));
      } catch (error) {
        console.error('Error caching weather data:', error);
      }
    }
  }

  /**
   * Get current weather data
   */
  public getWeatherData(): WeatherData | null {
    return this.weatherData;
  }

  /**
   * Refresh weather data from API
   */
  public async refreshWeather(): Promise<WeatherData | null> {
    if (!this.apiKey) {
      console.warn('No API key set for weather service');
      return this.provideMockWeatherData();
    }
    
    try {
      console.log('Refreshing weather with API key:', this.apiKey);
      const settings = locationService.getSettings();
      const { latitude, longitude } = settings;
      
      console.log(`Fetching weather for coordinates: lat=${latitude}, lon=${longitude}`);
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${this.apiKey}`;
      console.log('Weather API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Weather API error: ${response.status} ${response.statusText}`);
        console.error('Error details:', errorText);
        
        // If we get a 401 (unauthorized) error, provide mock data
        if (response.status === 401) {
          console.log('Using mock weather data while waiting for API key activation');
          return this.provideMockWeatherData();
        }
        
        throw new Error(`Weather API returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Weather data received:', data);
      
      // Format the weather data
      const weatherData: WeatherData = {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        lastUpdated: Date.now()
      };
      
      this.weatherData = weatherData;
      
      // Cache the data
      await this.cacheWeatherData(weatherData);
      
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return this.provideMockWeatherData();
    }
  }
  
  /**
   * Provide mock weather data when API is not available
   */
  private provideMockWeatherData(): WeatherData {
    console.log('Providing mock weather data');
    const mockData: WeatherData = {
      temperature: 23, // Example temperature
      feelsLike: 24,
      description: 'API key activating',
      icon: '01d', // Clear sky icon
      lastUpdated: Date.now()
    };
    
    this.weatherData = mockData;
    return mockData;
  }
}

// Export singleton instance
const weatherService = WeatherService.getInstance();
export default weatherService; 