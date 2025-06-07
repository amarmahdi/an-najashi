import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../styles/theme';
import { normalizeSize, scaleFontSize } from '../utils/SizeUtils';
import { useDisplay } from '../context/DisplayContext';
import locationService from '../core/LocationSettings';
import prayerDataService from '../core/PrayerDataService';
import weatherService from '../core/WeatherService';

// Types for prayer calculation settings
type CalculationMethod = 'MWL' | 'ISNA' | 'Egypt' | 'Makkah' | 'Karachi' | 'Tehran' | 'Jafari';
type AsrJuristicMethod = 'Standard' | 'Hanafi';
type HighLatitudeRule = 'MiddleOfNight' | 'SeventhOfNight' | 'TwilightAngle';

interface SettingsScreenProps {
  onBack?: () => void;
  onSaveSettings?: () => void;
}

// Available calculation methods
const CALCULATION_METHODS: CalculationMethod[] = ['MWL', 'ISNA', 'Egypt', 'Makkah', 'Karachi', 'Tehran', 'Jafari'];

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onSaveSettings }) => {
  // Use the display context
  const {
    connect,
    disconnect,
    connectionStatus,
    statusMessage,
    serverAddress,
    setServerAddress,
    settings,
    iqamahOffsets,
    isLoading,
    updateSettings,
    updateIqamahOffsets
  } = useDisplay();

  // Local settings state (initialized from context)
  const [localSettings, setLocalSettings] = useState(settings || locationService.getSettings());
  const [localIqamahOffsets, setLocalIqamahOffsets] = useState(iqamahOffsets || {
    fajr: 20,
    dhuhr: 10,
    asr: 10,
    maghrib: 5,
    isha: 15
  });
  
  // Display connection state
  const [displayAddress, setDisplayAddress] = useState(serverAddress);
  
  // State for weather API key
  const [apiKey, setApiKey] = useState<string>('');
  
  // Update local settings when context settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);
  
  // Update local iqamah offsets when context offsets change
  useEffect(() => {
    if (iqamahOffsets) {
      setLocalIqamahOffsets(iqamahOffsets);
    }
  }, [iqamahOffsets]);
  
  // Load API key on mount
  useEffect(() => {
    // This is just to initialize the weather service
    // and trigger the loadApiKey method
    const loadApiKey = async () => {
      await weatherService.initialize();
      try {
        // Use localStorage directly as WeatherService may not have getApiKey method yet
        const existingKey = localStorage.getItem('weather_api_key');
        if (existingKey) {
          setApiKey(existingKey);
        }
      } catch (error) {
        console.error('Error loading API key:', error);
      }
    };
    
    loadApiKey();
  }, []);
  
  // Connect to display
  const handleConnect = () => {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
      // Disconnect if already connected
      disconnect();
    } else {
      // Connect to display
      if (displayAddress && displayAddress.trim() !== '') {
        connect(displayAddress);
      } else {
        Alert.alert('Invalid Address', 'Please enter a valid server address');
      }
    }
  };
  
  // Save settings
  const handleSaveSettings = () => {
    // First save the API key if provided
    const saveApiKey = async () => {
      if (apiKey) {
        localStorage.setItem('weather_api_key', apiKey);
        await weatherService.setApiKey(apiKey);
      }
    };
    
    // Then save all settings
    saveApiKey()
      .then(() => locationService.saveSettings(localSettings))
      .then(() => {
        // Refresh prayer data with new settings
        return prayerDataService.refreshPrayerData(true);
      })
      .then(() => {
        Alert.alert('Success', 'Settings saved successfully');
        
        // If connected to display, update remote settings
        if (connectionStatus === 'connected') {
          updateSettings(localSettings);
          updateIqamahOffsets(localIqamahOffsets);
        }
        
        // Notify parent component
        if (onSaveSettings) {
          onSaveSettings();
        }
      })
      .catch(error => {
        console.error('Error saving settings:', error);
        Alert.alert('Error', 'Failed to save settings');
      });
  };
  
  // Update location
  const handleLocationUpdate = () => {
    // Check if we can access device location
    locationService.checkLocationPermission()
      .then(hasPermission => {
        if (hasPermission) {
          locationService.setUseDeviceLocation(true)
            .then(() => {
              // Reload settings from service
              const updatedSettings = locationService.getSettings();
              setLocalSettings(updatedSettings);
              Alert.alert('Success', 'Location updated to device location');
            })
            .catch(error => {
              console.error('Error updating location:', error);
              Alert.alert('Error', 'Failed to update location');
            });
        } else {
          Alert.alert(
            'Permission Required',
            'Location permission is required to use this feature',
            [{ text: 'OK' }]
          );
        }
      });
  };
  
  // Helper to render section headers
  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
  
  // Helper to render selectable options
  const renderOption = (label: string, isSelected: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.optionButton, isSelected && styles.selectedOption]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Display Connection Section */}
        {renderSectionHeader('Display Connection')}
        <View style={styles.displaySection}>
          <Text style={styles.label}>Server Address:</Text>
          <TextInput
            style={styles.textInput}
            value={displayAddress}
            onChangeText={setDisplayAddress}
            placeholder="192.168.1.100:3000"
            placeholderTextColor="#666"
          />
          <TouchableOpacity
            style={[
              styles.connectButton,
              connectionStatus === 'connected' ? styles.disconnectButton : {}
            ]}
            onPress={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {connectionStatus === 'connected' ? 'Disconnect' : 'Connect'}
              </Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.statusText}>
            Status: {connectionStatus} {statusMessage ? `(${statusMessage})` : ''}
          </Text>
        </View>
        
        {/* Prayer Times Settings */}
        {renderSectionHeader('Prayer Times Settings')}
        
        {/* Location */}
        <View style={styles.settingSection}>
          <Text style={styles.label}>Location:</Text>
          <View style={styles.coordinateInputs}>
            <View style={styles.coordinateInput}>
              <Text style={styles.subLabel}>Latitude:</Text>
              <TextInput
                style={styles.textInput}
                value={String(localSettings.latitude)}
                onChangeText={(value) => {
                  setLocalSettings({
                    ...localSettings,
                    latitude: parseFloat(value) || 0
                  });
                }}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.coordinateInput}>
              <Text style={styles.subLabel}>Longitude:</Text>
              <TextInput
                style={styles.textInput}
                value={String(localSettings.longitude)}
                onChangeText={(value) => {
                  setLocalSettings({
                    ...localSettings,
                    longitude: parseFloat(value) || 0
                  });
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <TouchableOpacity style={styles.locationButton} onPress={handleLocationUpdate}>
            <Text style={styles.buttonText}>Use Device Location</Text>
          </TouchableOpacity>
        </View>
        
        {/* Calculation Method */}
        <View style={styles.settingSection}>
          <Text style={styles.label}>Calculation Method:</Text>
          <View style={styles.optionsContainer}>
            {CALCULATION_METHODS.map((method) => (
              <View key={method} style={styles.optionItem}>
                {renderOption(
                  method,
                  localSettings.method === method,
                  () => setLocalSettings({
                    ...localSettings,
                    method
                  })
                )}
              </View>
            ))}
          </View>
        </View>
        
        {/* Asr Juristic Method */}
        <View style={styles.settingSection}>
          <Text style={styles.label}>Asr Calculation:</Text>
          <View style={styles.optionsRow}>
            {renderOption(
              'Standard (Shafi, Maliki, Hanbali)',
              localSettings.asrJuristic === 'Standard',
              () => setLocalSettings({
                ...localSettings,
                asrJuristic: 'Standard'
              })
            )}
            
            {renderOption(
              'Hanafi',
              localSettings.asrJuristic === 'Hanafi',
              () => setLocalSettings({
                ...localSettings,
                asrJuristic: 'Hanafi'
              })
            )}
          </View>
        </View>
        
        {/* Time Adjustments */}
        <View style={styles.settingSection}>
          <Text style={styles.label}>Time Adjustments (minutes):</Text>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Fajr:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localSettings.adjustments.fajr)}
              onChangeText={(value) => {
                setLocalSettings({
                  ...localSettings,
                  adjustments: {
                    ...localSettings.adjustments,
                    fajr: parseInt(value) || 0
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Sunrise:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localSettings.adjustments.sunrise)}
              onChangeText={(value) => {
                setLocalSettings({
                  ...localSettings,
                  adjustments: {
                    ...localSettings.adjustments,
                    sunrise: parseInt(value) || 0
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Dhuhr:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localSettings.adjustments.dhuhr)}
              onChangeText={(value) => {
                setLocalSettings({
                  ...localSettings,
                  adjustments: {
                    ...localSettings.adjustments,
                    dhuhr: parseInt(value) || 0
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Asr:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localSettings.adjustments.asr)}
              onChangeText={(value) => {
                setLocalSettings({
                  ...localSettings,
                  adjustments: {
                    ...localSettings.adjustments,
                    asr: parseInt(value) || 0
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Maghrib:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localSettings.adjustments.maghrib)}
              onChangeText={(value) => {
                setLocalSettings({
                  ...localSettings,
                  adjustments: {
                    ...localSettings.adjustments,
                    maghrib: parseInt(value) || 0
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Isha:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localSettings.adjustments.isha)}
              onChangeText={(value) => {
                setLocalSettings({
                  ...localSettings,
                  adjustments: {
                    ...localSettings.adjustments,
                    isha: parseInt(value) || 0
                  }
                });
              }}
              keyboardType="numeric"
            />
          </View>
        </View>
        
        {/* Iqamah Times */}
        {renderSectionHeader('Iqamah Times')}
        <View style={styles.settingSection}>
          <Text style={styles.label}>Iqamah Offsets (minutes after Adhan):</Text>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Fajr:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localIqamahOffsets.fajr)}
              onChangeText={(value) => {
                setLocalIqamahOffsets({
                  ...localIqamahOffsets,
                  fajr: parseInt(value) || 0
                });
              }}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Dhuhr:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localIqamahOffsets.dhuhr)}
              onChangeText={(value) => {
                setLocalIqamahOffsets({
                  ...localIqamahOffsets,
                  dhuhr: parseInt(value) || 0
                });
              }}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Asr:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localIqamahOffsets.asr)}
              onChangeText={(value) => {
                setLocalIqamahOffsets({
                  ...localIqamahOffsets,
                  asr: parseInt(value) || 0
                });
              }}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Maghrib:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localIqamahOffsets.maghrib)}
              onChangeText={(value) => {
                setLocalIqamahOffsets({
                  ...localIqamahOffsets,
                  maghrib: parseInt(value) || 0
                });
              }}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.adjustmentRow}>
            <Text style={styles.adjustmentLabel}>Isha:</Text>
            <TextInput
              style={styles.adjustmentInput}
              value={String(localIqamahOffsets.isha)}
              onChangeText={(value) => {
                setLocalIqamahOffsets({
                  ...localIqamahOffsets,
                  isha: parseInt(value) || 0
                });
              }}
              keyboardType="numeric"
            />
          </View>
        </View>
        
        {/* Add the weather API section before the bottom actions */}
        {renderSectionHeader('Weather Settings')}
        <View style={styles.settingSection}>
          <Text style={styles.label}>OpenWeatherMap API Key:</Text>
          <TextInput
            style={styles.textInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your OpenWeatherMap API key"
            placeholderTextColor="#666"
            secureTextEntry={false}
          />
          <Text style={styles.helperText}>
            Sign up for a free API key at openweathermap.org
          </Text>
          <Text style={[styles.helperText, { marginTop: 5, color: '#f57c00' }]}>
            Note: New API keys can take 2-4 hours to activate. Mock weather data will be shown until then.
          </Text>
        </View>
      </ScrollView>
      
      {/* Bottom Actions */}
      <View style={styles.actionButtons}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveSettings}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: normalizeSize(16),
    paddingBottom: normalizeSize(100),
  },
  sectionHeader: {
    backgroundColor: COLORS.primaryDark,
    padding: normalizeSize(10),
    borderRadius: normalizeSize(5),
    marginVertical: normalizeSize(10),
  },
  sectionHeaderText: {
    color: 'white',
    fontSize: scaleFontSize(18),
    fontWeight: 'bold',
  },
  displaySection: {
    backgroundColor: 'white',
    borderRadius: normalizeSize(5),
    padding: normalizeSize(16),
    marginBottom: normalizeSize(16),
  },
  settingSection: {
    backgroundColor: 'white',
    borderRadius: normalizeSize(5),
    padding: normalizeSize(16),
    marginBottom: normalizeSize(16),
  },
  label: {
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
    marginBottom: normalizeSize(8),
    color: COLORS.primaryDark,
  },
  subLabel: {
    fontSize: scaleFontSize(14),
    color: '#666',
    marginBottom: normalizeSize(4),
  },
  textInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: normalizeSize(5),
    padding: normalizeSize(10),
    color: '#333',
    fontSize: scaleFontSize(16),
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    padding: normalizeSize(12),
    borderRadius: normalizeSize(5),
    marginTop: normalizeSize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectButton: {
    backgroundColor: COLORS.error,
  },
  locationButton: {
    backgroundColor: COLORS.secondary,
    padding: normalizeSize(12),
    borderRadius: normalizeSize(5),
    marginTop: normalizeSize(10),
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: scaleFontSize(16),
  },
  statusText: {
    marginTop: normalizeSize(10),
    color: '#666',
    textAlign: 'center',
    fontSize: scaleFontSize(14),
  },
  coordinateInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    flex: 1,
    marginRight: normalizeSize(10),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: normalizeSize(8),
  },
  optionItem: {
    width: '50%',
    padding: normalizeSize(4),
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalizeSize(8),
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    padding: normalizeSize(12),
    borderRadius: normalizeSize(5),
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    color: '#333',
    fontSize: scaleFontSize(14),
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalizeSize(10),
  },
  adjustmentLabel: {
    width: '40%',
    fontSize: scaleFontSize(16),
    color: '#555',
  },
  adjustmentInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: normalizeSize(5),
    padding: normalizeSize(10),
    color: '#333',
    fontSize: scaleFontSize(16),
  },
  actionButtons: {
    position: 'absolute',
    bottom: normalizeSize(20),
    left: normalizeSize(20),
    right: normalizeSize(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: COLORS.secondary,
    padding: normalizeSize(15),
    borderRadius: normalizeSize(5),
    flex: 1,
    marginRight: normalizeSize(10),
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.success,
    padding: normalizeSize(15),
    borderRadius: normalizeSize(5),
    flex: 2,
    alignItems: 'center',
  },
  helperText: {
    marginTop: normalizeSize(10),
    color: '#666',
    textAlign: 'center',
    fontSize: scaleFontSize(14),
  },
});

export default SettingsScreen;
