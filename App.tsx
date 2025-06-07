/**
 * An-Najashi Mosque Prayer Times Display
 * React Native TV App
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, Alert } from 'react-native';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';

// Import context provider
import { DisplayProvider } from './src/context/DisplayContext';

// Import services
import weatherService from './src/core/WeatherService';
import webSocketControllerService from './src/services/WebSocketControllerService';

function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Auto-hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Initialize weather service
  useEffect(() => {
    const initWeatherService = async () => {
      try {
        console.log('Initializing weather service...');
        
        // Use the API key directly first
        const OPENWEATHERMAP_API_KEY = "7d4da3647d0642dce9775f406f661c0f";
        console.log('Using API key:', OPENWEATHERMAP_API_KEY);
        
        // Set API key first
        await weatherService.setApiKey(OPENWEATHERMAP_API_KEY);
        
        // Then initialize service
        await weatherService.initialize();
        
        console.log('Weather service initialized, attempting to refresh weather...');
        
        // Explicitly refresh
        const weatherData = await weatherService.refreshWeather();
        console.log('Weather data after refresh:', weatherData);
      } catch (error) {
        console.error('Failed to initialize weather service:', error);
      }
    };
    
    initWeatherService();
    
    // Clean up service when app unmounts
    return () => {
      if (typeof weatherService.cleanup === 'function') {
        weatherService.cleanup();
      }
    };
  }, []);

  // Initialize WebSocket controller service
  useEffect(() => {
    const startWebSocketService = async () => {
      try {
        // Start WebSocket service for remote control
        await webSocketControllerService.start();
        
        console.log('WebSocket server started successfully');
        
        // Provide instructions for connecting remote app
        console.log('');
        console.log('==== REMOTE CONTROLLER CONNECTION INSTRUCTIONS ====');
        console.log('To connect the remote controller app:');
        console.log('1. Make sure your remote device is on the same network');
        console.log('2. In the remote app, enter the IP address of this device:');
        console.log('   - For real device: use your actual local IP address (e.g., 192.168.x.x:3000)');
        console.log('   - For emulator: use 10.0.2.2:3000 (Android emulator special IP)');
        console.log('');
        console.log('If you have trouble connecting directly:');
        console.log('1. For debugging, use ADB port forwarding:');
        console.log('   adb forward tcp:3000 tcp:3000');
        console.log('2. Then connect to localhost:3000 in the remote app');
        console.log('===============================================');
        console.log('');
      } catch (error) {
        console.error('Error starting WebSocket controller service:', error);
        Alert.alert(
          'Connection Service Error',
          'Failed to start the remote control service. Settings changes will not be available through the remote app.',
          [{ text: 'OK' }]
        );
      }
    };
    
    startWebSocketService();

    // Cleanup function to stop WebSocket service when unmounting
    return () => {
      webSocketControllerService.stop();
    };
  }, []);

  return (
    <DisplayProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar hidden />
        <View style={styles.container}>
          {showSplash ? (
            <SplashScreen onFinish={() => setShowSplash(false)} />
          ) : (
            <HomeScreen />
          )}
        </View>
      </SafeAreaView>
    </DisplayProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
