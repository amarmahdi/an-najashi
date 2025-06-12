/* eslint-disable no-trailing-spaces */
/* eslint-disable no-catch-shadow */
/* eslint-disable @typescript-eslint/no-shadow */
import React, {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  Coordinates,
  PrayerTimes as AdhanPrayerTimes,
  Madhab,
  CalculationMethod,
  HighLatitudeRule,
} from 'adhan';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, toZonedTime } from 'date-fns-tz';
import locationService from '../core/LocationSettings';
import { calculateHijriDate } from '../core/prayerTimes';

interface PrayerTimesContextProps {
  prayerTimes: string[] | null;
  iqamahTimes: string[] | null;
  loading: boolean;
  error: string | null;
  method: any;
  setMethod: (method: any) => void;
  coordinates: Coordinates | null;
  timeZone: string | null;
  currentTime: string | null;
  gregorianDate: string | null;
  hijriDate: string | null;
  hijriDateEnglish: string | null;
  saveSettings: () => Promise<void>;
  prayerNames: string[];
  iqamahOffsets: number[];
  setIqamahOffsets: (offsets: number[]) => void;
  prayerTimeAdjustments: number[];
  setPrayerTimeAdjustments: (adjustments: number[]) => void;
  nextIqamah: string | null;
  nextIqamahName: string | null;
  remainingTime: string | null;
  formatDatesAndTimes: () => any;
  // Legacy compatibility
  prayerData: {
    prayerTimes: { [key: string]: Date };
    iqamahTimes: { [key: string]: Date };
    gregorianDate: string;
    hijriDate: string;
  } | null;
  formatTime: (date: Date) => string;
  getTimeRemaining: (targetDate: Date) => string;
}

const PrayerTimesContext = createContext<PrayerTimesContextProps>(
  {} as PrayerTimesContextProps,
);

export const usePrayerTimes = () => useContext(PrayerTimesContext);

export enum HighLatitudeRuleType {
  middleOfTheNight = 'MiddleOfNight',
  seventhOfTheNight = 'SeventhOfNight',
  twilightAngle = 'TwilightAngle',
}

export const PrayerTimesProvider: FC<PropsWithChildren> = ({ children }) => {
  // State variables
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<string[] | null>(null);
  const [iqamahTimes, setIqamahTimes] = useState<string[] | null>(null);
  const [method, setMethod] = useState<any>({
    method: 'ISNA',
    highLatitudeRule: HighLatitudeRuleType.twilightAngle,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>('');
  const [gregorianDate, setGregorianDate] = useState<string | null>('');
  const [hijriDate, setHijriDate] = useState<string | null>('');
  const [hijriDateEnglish, setHijriDateEnglish] = useState<string | null>('');
  const [prayerNames] = useState<string[]>([
    'Fajr',
    'Sunrise',
    'Dhuhr',
    'Asr',
    'Maghrib',
    'Isha',
  ]);
  const [iqamahOffsets, setIqamahOffsets] = useState<number[]>([
    30, 0, 30, 15, 5, 15,
  ]);
  const [prayerTimeAdjustments, setPrayerTimeAdjustments] = useState<number[]>([
    0, 0, 0, 0, 0, 0,
  ]);
  const [nextIqamah, setNextIqamah] = useState<string | null>(null);
  const [nextIqamahName, setNextIqamahName] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  // Helper functions
  const getTimezoneOffsetHours = useCallback((): number => {
    return -new Date().getTimezoneOffset() / 60;
  }, []);

  const formatTimezoneString = useCallback((): string => {
    const offset = getTimezoneOffsetHours();
    return `UTC${offset >= 0 ? '+' : ''}${offset}`;
  }, [getTimezoneOffsetHours]);

  const formatTime = useCallback((date: Date) => {
    try {
      // The adhan library already returns local time Date objects
      // No need for timezone conversion
      return format(date, 'hh:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      // Fallback to basic formatting
      return format(date, 'hh:mm a');
    }
  }, []);

  // Initialize coordinates and timezone
  useEffect(() => {
    const loc = locationService.getLocation();
    setCoordinates(new Coordinates(loc.latitude, loc.longitude));
    setTimeZone(formatTimezoneString());
  }, [formatTimezoneString]);

  // Load saved settings from AsyncStorage
  const loadSavedMethodSettings = useCallback(async () => {
    try {
      const savedMethod = await AsyncStorage.getItem('@prayer_method');
      if (savedMethod) {
        setMethod(JSON.parse(savedMethod));
      }
    } catch (err) {
      console.error('Error loading method settings:', err);
    }
  }, []);

  const loadSavedOffsets = useCallback(async () => {
    try {
      const savedOffsets = await AsyncStorage.getItem('@iqamah_offsets');
      if (savedOffsets) {
        setIqamahOffsets(JSON.parse(savedOffsets));
      }
    } catch (err) {
      console.error('Error loading iqamah offsets:', err);
    }
  }, []);
  
  const loadSavedPrayerAdjustments = useCallback(async () => {
    try {
      const savedAdjustments = await AsyncStorage.getItem('@prayer_adjustments');
      if (savedAdjustments) {
        setPrayerTimeAdjustments(JSON.parse(savedAdjustments));
      }
    } catch (err) {
      console.error('Error loading prayer time adjustments:', err);
    }
  }, []);

  // Save settings to AsyncStorage
  const saveMethodSettings = useCallback(async (newMethod: any) => {
    try {
      await AsyncStorage.setItem('@prayer_method', JSON.stringify(newMethod));
    } catch (err) {
      console.error('Error saving method settings:', err);
    }
  }, []);

  const saveIqamahOffsets = useCallback(async (offsets: number[]) => {
    try {
      await AsyncStorage.setItem('@iqamah_offsets', JSON.stringify(offsets));
    } catch (err) {
      console.error('Error saving iqamah offsets:', err);
    }
  }, []);
  
  const savePrayerAdjustments = useCallback(async (adjustments: number[]) => {
    try {
      await AsyncStorage.setItem('@prayer_adjustments', JSON.stringify(adjustments));
    } catch (err) {
      console.error('Error saving prayer time adjustments:', err);
    }
  }, []);

  // Choose calculation method
  const chooseMethod = useCallback((methodName: string) => {
    switch (methodName) {
      case 'ISNA':
        return CalculationMethod.NorthAmerica();
      case 'MWL':
        return CalculationMethod.MuslimWorldLeague();
      case 'Egypt':
        return CalculationMethod.Egyptian();
      case 'Makkah':
        return CalculationMethod.UmmAlQura();
      case 'Karachi':
        return CalculationMethod.Karachi();
      case 'Tehran':
        return CalculationMethod.Tehran();
      default:
        return CalculationMethod.NorthAmerica();
    }
  }, []);

  // Convert time string to Date object
  const convertTimeStrToDate = useCallback((timeStr: string | undefined): Date => {
    if (!timeStr) {
      return new Date(); // Return current date if no time string
    }

    try {
      const [time, period] = timeStr.split(' ');
      if (!time || !period) {
        return new Date(); // Return current date if invalid format
      }

      const [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        return new Date(); // Return current date if invalid numbers
      }

      const date = new Date();
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }
      date.setHours(hour24, minutes, 0, 0);
      return date;
    } catch (error) {
      console.error('Error converting time string to date:', error);
      return new Date(); // Return current date on error
    }
  }, []);

  // Initialize prayer times
  const initializePrayerTimes = useCallback(async () => {
    if (!coordinates) {
      return;
    }

    setLoading(true);
    try {
      const params = chooseMethod(method.method);
      params.madhab = Madhab.Shafi;

      // Map the UI high latitude rule to the actual adhan library rule
      switch (method.highLatitudeRule) {
        case HighLatitudeRuleType.middleOfTheNight:
          params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
          break;
        case HighLatitudeRuleType.seventhOfTheNight:
          params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
          break;
        case HighLatitudeRuleType.twilightAngle:
          params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
          break;
        default:
          params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight; // fallback
      }

      console.log('=== PRAYER CALCULATION DEBUG ===');
      console.log('Method:', method.method);
      console.log('High Latitude Rule (UI):', method.highLatitudeRule);
      console.log('High Latitude Rule (adhan):', params.highLatitudeRule);
      console.log('Coordinates:', coordinates);
      console.log('Prayer Time Adjustments:', prayerTimeAdjustments);

      const adhanPrayerTimes = new AdhanPrayerTimes(coordinates, new Date(), params);

      // Get the base prayer times
      const baseTimes = [
        adhanPrayerTimes.fajr,
        adhanPrayerTimes.sunrise,
        adhanPrayerTimes.dhuhr,
        adhanPrayerTimes.asr,
        adhanPrayerTimes.maghrib,
        adhanPrayerTimes.isha,
      ];
      
      // Apply the prayer time adjustments
      const adjustedTimes = baseTimes.map((time, index) => {
        // Apply the adjustment in minutes
        return new Date(time.getTime() + (prayerTimeAdjustments[index] || 0) * 60000);
      });
      
      // Format the adjusted times
      const times = adjustedTimes.map(time => formatTime(time));

      console.log('Prayer Times Calculated:', times);
      console.log('================================');

      setPrayerTimes(times);

      // Calculate iqamah times
      const iqamahTimesArray = times.map((time, index) => {
        if (index === 1) {
          return ''; // No iqamah for sunrise
        }
        const prayerDate = convertTimeStrToDate(time);
        const iqamahDate = new Date(prayerDate.getTime() + iqamahOffsets[index] * 60000);
        return formatTime(iqamahDate);
      });

      setIqamahTimes(iqamahTimesArray);
      setError(null);
    } catch (err) {
      console.error('Error calculating prayer times:', err);
      setError('Failed to calculate prayer times');
    } finally {
      setLoading(false);
    }
  }, [coordinates, method, iqamahOffsets, prayerTimeAdjustments, chooseMethod, formatTime, convertTimeStrToDate]);

  // Update prayer times settings
  const updatePrayerTimesSettings = useCallback(async () => {
    await saveMethodSettings(method);
    await saveIqamahOffsets(iqamahOffsets);
    await savePrayerAdjustments(prayerTimeAdjustments);
    await initializePrayerTimes();
  }, [method, iqamahOffsets, prayerTimeAdjustments, saveMethodSettings, saveIqamahOffsets, savePrayerAdjustments, initializePrayerTimes]);

  // Calculate remaining time until next iqamah
  const updateRemainingTime = useCallback((nextTime: string | null) => {
    if (!nextTime || !currentTime) {
      setRemainingTime(null);
      return;
    }

    const now = convertTimeStrToDate(currentTime);
    const next = convertTimeStrToDate(nextTime);

    if (next < now) {
      next.setDate(next.getDate() + 1);
    }

    const diffMs = next.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    setRemainingTime(`${hours}h ${minutes}m`);
  }, [currentTime, convertTimeStrToDate]);

  // Calculate next iqamah
  const calculateNextIqamah = useCallback(() => {
    if (!iqamahTimes || !currentTime) {
      return;
    }

    const now = new Date();
    let nextTime: string | null = null;
    let nextName: string | null = null;

    for (let i = 0; i < iqamahTimes.length; i++) {
      const iqamah = iqamahTimes[i];
      if (!iqamah || i === 1) {
        continue; // Skip sunrise
      }
      const iqamahTime = convertTimeStrToDate(iqamah);
      if (iqamahTime > now) {
        nextTime = iqamah;
        nextName = prayerNames[i];
        break;
      }
    }

    setNextIqamah(nextTime);
    setNextIqamahName(nextName);
    updateRemainingTime(nextTime);
  }, [iqamahTimes, currentTime, prayerNames, convertTimeStrToDate, updateRemainingTime]);

  // Format dates for UI display
  const formatDatesAndTimes = useCallback(() => {
    const gregYearArray = gregorianDate ? gregorianDate.split(' ') : [];
    const hijriYearArray = hijriDateEnglish ? hijriDateEnglish.split(' ') : [];

    let dayMonth = '';
    let gregYear = '';
    let hijriYear = '';
    let hijriDayMonth = '';

    if (gregYearArray.length >= 3) {
      dayMonth = `${gregYearArray[0]} ${gregYearArray[1]}`.toUpperCase();
      gregYear = gregYearArray[2];
    }

    if (hijriYearArray.length >= 3) {
      hijriYear = hijriYearArray[0];
      hijriDayMonth = `${hijriYearArray[2]} ${hijriYearArray[1]}`.toUpperCase();
    }

    return { dayMonth, gregYear, hijriYear, hijriDayMonth };
  }, [gregorianDate, hijriDateEnglish]);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      await loadSavedMethodSettings();
      await loadSavedOffsets();
      await loadSavedPrayerAdjustments();
    };
    loadSettings();
  }, [loadSavedMethodSettings, loadSavedOffsets, loadSavedPrayerAdjustments]);

  // Initialize prayer times when coordinates or method changes
  useEffect(() => {
    if (coordinates) {
      initializePrayerTimes();
    }
  }, [coordinates, method, initializePrayerTimes]);

  // Update current time and date
  useEffect(() => {
    const updateTimeAndDate = () => {
      try {
        const now = new Date();
        const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const zonedTime = toZonedTime(now, deviceTimeZone);
        setCurrentTime(format(zonedTime, 'hh:mm a'));
        setGregorianDate(format(zonedTime, 'dd MMMM, yyyy'));
        
        // Calculate and set Hijri date
        const hijriDateObj = calculateHijriDate(now);
        setHijriDate(`${hijriDateObj.day} ${hijriDateObj.monthName}, ${hijriDateObj.year}`);
        setHijriDateEnglish(`${hijriDateObj.year} ${hijriDateObj.monthName} ${hijriDateObj.day}`);
      } catch (err) {
        console.error('Error updating time and date:', err);
        // Fallback to basic formatting
        const now = new Date();
        setCurrentTime(format(now, 'hh:mm a'));
        setGregorianDate(format(now, 'dd MMMM, yyyy'));
      }
    };

    updateTimeAndDate();
    const intervalId = setInterval(updateTimeAndDate, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Calculate next iqamah when times change
  useEffect(() => {
    if (prayerTimes && iqamahTimes && currentTime) {
      calculateNextIqamah();
    }
  }, [prayerTimes, iqamahTimes, currentTime, calculateNextIqamah]);

  // Update remaining time every minute
  useEffect(() => {
    if (nextIqamah) {
      const intervalId = setInterval(() => {
        updateRemainingTime(nextIqamah);
      }, 60000);

      return () => clearInterval(intervalId);
    }
  }, [nextIqamah, updateRemainingTime]);

  return (
    <PrayerTimesContext.Provider
      value={{
        prayerTimes,
        iqamahTimes,
        loading,
        error,
        method,
        setMethod,
        coordinates,
        timeZone,
        currentTime,
        gregorianDate,
        hijriDate,
        hijriDateEnglish,
        saveSettings: updatePrayerTimesSettings,
        prayerNames,
        iqamahOffsets,
        setIqamahOffsets,
        prayerTimeAdjustments,
        setPrayerTimeAdjustments,
        nextIqamah,
        nextIqamahName,
        remainingTime,
        formatDatesAndTimes,
        prayerData: prayerTimes && iqamahTimes ? {
          prayerTimes: {
            Fajr: convertTimeStrToDate(prayerTimes[0]),
            Sunrise: convertTimeStrToDate(prayerTimes[1]),
            Dhuhr: convertTimeStrToDate(prayerTimes[2]),
            Asr: convertTimeStrToDate(prayerTimes[3]),
            Maghrib: convertTimeStrToDate(prayerTimes[4]),
            Isha: convertTimeStrToDate(prayerTimes[5]),
          },
          iqamahTimes: {
            Fajr: convertTimeStrToDate(iqamahTimes[0]),
            Dhuhr: convertTimeStrToDate(iqamahTimes[2]),
            Asr: convertTimeStrToDate(iqamahTimes[3]),
            Maghrib: convertTimeStrToDate(iqamahTimes[4]),
            Isha: convertTimeStrToDate(iqamahTimes[5]),
          },
          gregorianDate: gregorianDate || '',
          hijriDate: hijriDate || '',
        } : null,
        formatTime,
        getTimeRemaining: (targetDate: Date) => {
          const now = new Date();
          const diffMs = targetDate.getTime() - now.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          return `${hours}h ${minutes}m`;
        },
      }}
    >
      {children}
    </PrayerTimesContext.Provider>
  );
};

export default PrayerTimesContext;
