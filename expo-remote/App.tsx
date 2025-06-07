import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DisplayProvider } from './src/context/DisplayContext';
import ConnectScreen from './src/screens/ConnectScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Create the stack navigator
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <DisplayProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Connect"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#f5f8fa' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Connect" component={ConnectScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </DisplayProvider>
    </SafeAreaProvider>
  );
}
