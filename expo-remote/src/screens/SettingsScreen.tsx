import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useDisplay } from '../context/DisplayContext';
import { PrayerTimesSettings, IqamahOffsets } from '../types';

// Define screen props for navigation
interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const {
    connectionStatus,
    disconnect,
    settings,
    updateSettings,
    updateIqamahOffsets
  } = useDisplay();

  // Local state for settings
  const [localSettings, setLocalSettings] = useState<PrayerTimesSettings>({
    latitude: '',
    longitude: '',
    timezone: '',
    method: 'MWL',
    asrJuristic: 'Standard',
    adjustments: {
      fajr: '',
      dhuhr: '',
      asr: '',
      maghrib: '',
      isha: ''
    }
  });
  
  // Local state for iqamah offsets
  const [iqamahOffsets, setIqamahOffsets] = useState<IqamahOffsets>({
    fajr: '',
    dhuhr: '',
    asr: '',
    maghrib: '',
    isha: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Update local settings when settings from context change
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);
  
  // Go back to connect screen if disconnected
  useEffect(() => {
    if (connectionStatus !== 'connected') {
      navigation.navigate('Connect');
    }
  }, [connectionStatus, navigation]);
  
  // Handle input change for main settings
  const handleChange = (field: string, value: string) => {
    setLocalSettings((prev: PrayerTimesSettings) => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if exists
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };
  
  // Handle input change for adjustment settings
  const handleAdjustmentChange = (prayer: string, value: string) => {
    setLocalSettings((prev: PrayerTimesSettings) => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        [prayer]: value
      }
    }));
    
    // Clear error for this field if exists
    const errorKey = `adjustments.${prayer}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[errorKey];
        return updated;
      });
    }
  };
  
  // Handle input change for iqamah offsets
  const handleIqamahChange = (prayer: string, value: string) => {
    setIqamahOffsets((prev: IqamahOffsets) => ({
      ...prev,
      [prayer]: value
    }));
    
    // Clear error for this field if exists
    const errorKey = `iqamah.${prayer}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[errorKey];
        return updated;
      });
    }
  };
  
  // Validate settings before saving
  const validateSettings = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate main settings
    if (!localSettings.latitude || isNaN(Number(localSettings.latitude))) {
      newErrors['latitude'] = 'Please enter a valid latitude';
    }
    
    if (!localSettings.longitude || isNaN(Number(localSettings.longitude))) {
      newErrors['longitude'] = 'Please enter a valid longitude';
    }
    
    if (!localSettings.timezone || isNaN(Number(localSettings.timezone))) {
      newErrors['timezone'] = 'Please enter a valid timezone offset';
    }
    
    // Validate adjustments
    Object.entries(localSettings.adjustments).forEach(([prayer, value]) => {
      if (value === undefined || value === null || isNaN(Number(value))) {
        newErrors[`adjustments.${prayer}`] = `Please enter a valid ${prayer} adjustment`;
      }
    });
    
    // Validate iqamah offsets
    Object.entries(iqamahOffsets).forEach(([prayer, value]) => {
      if (value === undefined || value === null || isNaN(Number(value)) || Number(value) < 0) {
        newErrors[`iqamah.${prayer}`] = `Please enter a valid ${prayer} iqamah offset`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Save settings
  const handleSave = async () => {
    // Validate settings
    if (!validateSettings()) {
      return;
    }

    setSaving(true);
    
    try {
      // Convert string values to numbers where needed for API
      const numericSettings: PrayerTimesSettings = {
        ...localSettings,
        latitude: parseFloat(localSettings.latitude as string) || 0,
        longitude: parseFloat(localSettings.longitude as string) || 0,
        timezone: parseFloat(localSettings.timezone as string) || 0,
        adjustments: {
          fajr: parseFloat(localSettings.adjustments.fajr as string) || 0,
          dhuhr: parseFloat(localSettings.adjustments.dhuhr as string) || 0,
          asr: parseFloat(localSettings.adjustments.asr as string) || 0,
          maghrib: parseFloat(localSettings.adjustments.maghrib as string) || 0,
          isha: parseFloat(localSettings.adjustments.isha as string) || 0
        }
      };
      
      // Convert iqamah offsets to numbers
      const numericOffsets: IqamahOffsets = {
        fajr: parseFloat(iqamahOffsets.fajr as string) || 0,
        dhuhr: parseFloat(iqamahOffsets.dhuhr as string) || 0,
        asr: parseFloat(iqamahOffsets.asr as string) || 0,
        maghrib: parseFloat(iqamahOffsets.maghrib as string) || 0,
        isha: parseFloat(iqamahOffsets.isha as string) || 0
      };

      await updateSettings(numericSettings);
      await updateIqamahOffsets(numericOffsets);
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle disconnect
  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from the prayer display?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: () => {
            disconnect();
            navigation.navigate('Connect');
          }
        }
      ]
    );
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Prayer Display Settings</Text>
        
        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionText}>
            {connectionStatus === 'connected' 
              ? '✓ Connected to Prayer Display' 
              : 'Not connected'}
          </Text>
        </View>
        
        {/* Location Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Settings</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Latitude:</Text>
            <TextInput
              style={[styles.input, errors.latitude && styles.inputError]}
              value={String(localSettings.latitude || '')}
              onChangeText={(value) => handleChange('latitude', value)}
              keyboardType="numeric"
              placeholder="Enter latitude"
            />
          </View>
          {errors.latitude && (
            <Text style={styles.errorText}>{errors.latitude}</Text>
          )}
          
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Longitude:</Text>
            <TextInput
              style={[styles.input, errors.longitude && styles.inputError]}
              value={String(localSettings.longitude || '')}
              onChangeText={(value) => handleChange('longitude', value)}
              keyboardType="numeric"
              placeholder="Enter longitude"
            />
          </View>
          {errors.longitude && (
            <Text style={styles.errorText}>{errors.longitude}</Text>
          )}
          
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Timezone:</Text>
            <TextInput
              style={[styles.input, errors.timezone && styles.inputError]}
              value={String(localSettings.timezone || '')}
              onChangeText={(value) => handleChange('timezone', value)}
              keyboardType="numeric"
              placeholder="Enter timezone (e.g., 3 for GMT+3)"
            />
          </View>
          {errors.timezone && (
            <Text style={styles.errorText}>{errors.timezone}</Text>
          )}
          
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Calculation Method:</Text>
            <TextInput
              style={styles.input}
              value={localSettings.method}
              onChangeText={(value) => handleChange('method', value)}
              keyboardType="numeric"
              placeholder="Method (2=ISNA, 3=MWL, 4=Makkah)"
            />
          </View>
          <Text style={styles.helpText}>
            2=ISNA, 3=MWL, 4=Makkah, 5=Egypt, 7=Kuwait, 
            8=Qatar, 9=Singapore, 10=France, 11=Turkey, 12=Russia
          </Text>
        </View>
        
        {/* Prayer Time Adjustments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prayer Time Adjustments (minutes)</Text>
          
          {Object.entries(localSettings.adjustments).map(([prayer, value]) => (
            <React.Fragment key={prayer}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>{prayer.charAt(0).toUpperCase() + prayer.slice(1)}:</Text>
                <TextInput
                  style={[styles.input, errors[`adjustments.${prayer}`] && styles.inputError]}
                  value={String(value || '')}
                  onChangeText={(newValue) => handleAdjustmentChange(prayer, newValue)}
                  keyboardType="numeric"
                  placeholder={`${prayer} adjustment`}
                />
              </View>
              {errors[`adjustments.${prayer}`] && (
                <Text style={styles.errorText}>{errors[`adjustments.${prayer}`]}</Text>
              )}
            </React.Fragment>
          ))}
          <Text style={styles.helpText}>
            Use positive values to add minutes, negative to subtract
          </Text>
        </View>
        
        {/* Iqamah Offsets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Iqamah Times (minutes after adhan)</Text>
          
          {Object.entries(iqamahOffsets).map(([prayer, value]) => (
            <View key={`iqamah-${prayer}`} style={styles.settingRow}>
              <Text style={styles.settingLabel}>{prayer.charAt(0).toUpperCase() + prayer.slice(1)}</Text>
              <TextInput
                style={[styles.input, errors[`iqamah.${prayer}`] && styles.inputError]}
                value={String(value)}
                onChangeText={(newValue) => handleIqamahChange(prayer, newValue)}
                keyboardType="numeric"
                placeholder={`${prayer} offset in minutes`}
              />
            </View>
          ))}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={handleDisconnect}
          >
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Save Settings</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  connectionStatus: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  connectionText: {
    color: '#388E3C',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37474F',
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    width: 100,
    fontSize: 16,
    color: '#546E7A',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginLeft: 100,
    marginBottom: 8,
  },
  helpText: {
    color: '#78909C',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 5,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    width: 100,
    fontSize: 16,
    color: '#546E7A',
  },
});

export default SettingsScreen; 