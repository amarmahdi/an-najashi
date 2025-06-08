/* eslint-disable @typescript-eslint/no-unused-vars */
// Prayer times calculation using adhan-js library
// https://github.com/batoulapps/adhan-js

import {
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  PrayerTimes as AdhanPrayerTimes,
  SunnahTimes,
  Madhab,
  HighLatitudeRule,
  Prayer,
  Qibla,
} from 'adhan';

export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface IqamahTimes {
  fajr: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export type CalculationMethod = 'ISNA' | 'MWL' | 'Egypt' | 'Makkah' | 'Karachi' | 'Tehran' | 'Jafari';
export type AsrJuristicMethod = 'Standard' | 'Hanafi';
export type HighLatitudeRule = 'MiddleOfNight' | 'SeventhOfNight' | 'TwilightAngle';

export interface PrayerTimesSettings {
  latitude: number;
  longitude: number;
  timezone: number; // UTC offset in hours
  method: CalculationMethod;
  adjustments: {
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  asrJuristic: AsrJuristicMethod;
  highLatitudeRule: HighLatitudeRule;
}

// Default settings - exported for use in other services
export const DEFAULT_SETTINGS: PrayerTimesSettings = {
  latitude: 53.631611, // Edmonton
  longitude: -113.323975,
  timezone: -6, // Mountain Time
  method: 'ISNA',
  adjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  asrJuristic: 'Standard',
  highLatitudeRule: 'MiddleOfNight', // Better for high latitude locations
};

// Helper function to convert our CalculationMethod type to adhan's CalculationMethod
function getAdhanCalculationMethod(method: CalculationMethod): CalculationParameters {
  switch (method) {
    case 'MWL':
      return CalculationMethod.MuslimWorldLeague();
    case 'ISNA':
      return CalculationMethod.NorthAmerica();
    case 'Egypt':
      return CalculationMethod.Egyptian();
    case 'Makkah':
      return CalculationMethod.UmmAlQura();
    case 'Karachi':
      return CalculationMethod.Karachi();
    case 'Tehran':
      return CalculationMethod.Tehran();
    case 'Jafari':
      // Jafari method doesn't exist in adhan-js, use Other and configure manually
      const params = CalculationMethod.Other();
      params.fajrAngle = 16;
      params.ishaAngle = 14;
      params.maghribAngle = 4;
      return params;
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

// Helper function to convert our AsrJuristicMethod to adhan's Madhab
function getAdhanMadhab(asrJuristic: AsrJuristicMethod) {
  return asrJuristic === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
}

// Helper function to convert our HighLatitudeRule to adhan's HighLatitudeRule
function getAdhanHighLatitudeRule(rule: HighLatitudeRule) {
  switch (rule) {
    case 'MiddleOfNight':
      return HighLatitudeRule.MiddleOfTheNight;
    case 'SeventhOfNight':
      return HighLatitudeRule.SeventhOfTheNight;
    case 'TwilightAngle':
      return HighLatitudeRule.TwilightAngle;
    default:
      return HighLatitudeRule.MiddleOfTheNight;
  }
}

// Calculate prayer times for a given date and settings
export function calculatePrayerTimes(date: Date, settings: PrayerTimesSettings): PrayerTimes {
  console.log('Calculating prayer times with adhan-js using settings:', {
    latitude: settings.latitude,
    longitude: settings.longitude,
    timezone: settings.timezone,
    method: settings.method,
    highLatitudeRule: settings.highLatitudeRule,
    adjustments: settings.adjustments,
  });

  // Check if location is in high latitude region (above 55 degrees)
  // High latitude areas need special rules for prayer times
  const isHighLatitude = Math.abs(settings.latitude) >= 55;
  if (isHighLatitude) {
    console.log('High latitude location detected. Using', settings.highLatitudeRule, 'rule.');
  }

  // Create adhan Coordinates object
  const coordinates = new Coordinates(settings.latitude, settings.longitude);

  // Get calculation parameters based on method
  const params = getAdhanCalculationMethod('ISNA');

  // Set madhab for Asr calculation
  params.madhab = getAdhanMadhab('Standard');

  // Set high latitude rule
  params.highLatitudeRule = getAdhanHighLatitudeRule('MiddleOfNight');

  // Apply manual adjustments (convert from minutes to seconds)
  params.adjustments = {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  };

  // Create an adhan PrayerTimes object
  const prayerTimes = new AdhanPrayerTimes(coordinates, date, params);

  // Adjust for timezone (adhan returns UTC times)
  const utcOffset = settings.timezone * 60 * 60 * 1000;

  // Create a function to adjust UTC time to local time
  const adjustToTimezone = (time: Date): Date => {
    // For adhan-js, we need to adjust the Date objects to the correct timezone
    const localDate = new Date(time.getTime() + utcOffset);
    return localDate;
  };

  // Create the prayer times in the local timezone
  const fajrTime = adjustToTimezone(prayerTimes.fajr);
  const sunriseTime = adjustToTimezone(prayerTimes.sunrise);
  const dhuhrTime = adjustToTimezone(prayerTimes.dhuhr);
  const asrTime = adjustToTimezone(prayerTimes.asr);
  const maghribTime = adjustToTimezone(prayerTimes.maghrib);
  const ishaTime = adjustToTimezone(prayerTimes.isha);

  // Log the calculated times for debugging
  console.log('Prayer times calculated (local time):');
  console.log(`Fajr====: ${fajrTime}`);
  console.log(`Sunrise====: ${sunriseTime}`);
  console.log(`Dhuhr====: ${dhuhrTime}`);
  console.log(`Asr====: ${asrTime}`);
  console.log(`Maghrib====: ${maghribTime}`);
  console.log(`Isha====: ${ishaTime}`);

  // Check for potential issues with extreme latitudes
  if (fajrTime.getTime() === ishaTime.getTime() || Math.abs(fajrTime.getTime() - ishaTime.getTime()) < 60000) {
    console.warn('WARNING: Fajr and Isha times are identical or very close. This may happen in extreme latitudes, consider adjusting high latitude rule.');
  }

  return {
    fajr: fajrTime,
    sunrise: sunriseTime,
    dhuhr: dhuhrTime,
    asr: asrTime,
    maghrib: maghribTime,
    isha: ishaTime,
  };
}

// Calculate iqamah times (usually prayer time + some offset)
export function calculateIqamahTimes(prayerTimes: PrayerTimes, offsets = {
  fajr: 20,
  dhuhr: 10,
  asr: 10,
  maghrib: 5,
  isha: 15,
}): IqamahTimes {
  return {
    fajr: new Date(prayerTimes.fajr.getTime() + offsets.fajr * 60 * 1000),
    dhuhr: new Date(prayerTimes.dhuhr.getTime() + offsets.dhuhr * 60 * 1000),
    asr: new Date(prayerTimes.asr.getTime() + offsets.asr * 60 * 1000),
    maghrib: new Date(prayerTimes.maghrib.getTime() + offsets.maghrib * 60 * 1000),
    isha: new Date(prayerTimes.isha.getTime() + offsets.isha * 60 * 1000),
  };
}

// Get the next prayer time
export function getNextPrayer(prayerTimes: PrayerTimes, settings: PrayerTimesSettings = DEFAULT_SETTINGS): { name: string; time: Date } {
  const now = new Date();

  if (now < prayerTimes.fajr) { return { name: 'Fajr', time: prayerTimes.fajr }; }
  if (now < prayerTimes.sunrise) { return { name: 'Sunrise', time: prayerTimes.sunrise }; }
  if (now < prayerTimes.dhuhr) { return { name: 'Dhuhr', time: prayerTimes.dhuhr }; }
  if (now < prayerTimes.asr) { return { name: 'Asr', time: prayerTimes.asr }; }
  if (now < prayerTimes.maghrib) { return { name: 'Maghrib', time: prayerTimes.maghrib }; }
  if (now < prayerTimes.isha) { return { name: 'Isha', time: prayerTimes.isha }; }

  // After Isha, next prayer is Fajr tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Calculate prayer times for tomorrow using the same settings as today
  const tomorrowPrayers = calculatePrayerTimes(tomorrow, settings);
  return { name: 'Fajr', time: tomorrowPrayers.fajr };
}

// Format time as a string (e.g. "05:30 AM")
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Format date as a string in the format "DD MMM YYYY"
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Calculate time remaining until next prayer
export function getTimeRemaining(targetDate: Date): string {
  const now = new Date();
  let diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) { return 'Now'; }

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHrs > 0) {
    return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  } else {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  }
}

// Helper function to determine if prayer times need to be updated based on date change
export function shouldUpdatePrayerTimes(lastCalculation: Date, currentTime: Date): boolean {
  return lastCalculation.getDate() !== currentTime.getDate() ||
    lastCalculation.getMonth() !== currentTime.getMonth() ||
    lastCalculation.getFullYear() !== currentTime.getFullYear();
}

// Get Qibla direction from given coordinates
export function getQiblaDirection(latitude: number, longitude: number): number {
  // Use adhan's Qibla direction calculation
  return Qibla(new Coordinates(latitude, longitude));
}

// Calculate Hijri date using adhan-js
export function calculateHijriDate(gregorianDate: Date): {
  day: number;
  month: number;
  year: number;
  monthName: string;
} {
  // Manually calculate Hijri date since adhan.js doesn't have DateUtils
  // This is a simple implementation - for more accurate results, consider using another library

  // Base values (epoch) for calculation
  const epochAH = 1948439.5; // Julian date for 1 Muharram 1 AH

  // Convert Gregorian date to Julian day
  const year = gregorianDate.getFullYear();
  const month = gregorianDate.getMonth() + 1;
  const day = gregorianDate.getDate();

  let julianDay = 0;

  // Julian day number algorithm
  if (month <= 2) {
    julianDay = Math.floor(365.25 * (year - 1)) + Math.floor(30.6001 * (month + 12)) + day + 1720994.5;
  } else {
    julianDay = Math.floor(365.25 * year) + Math.floor(30.6001 * (month + 1)) + day + 1720994.5;
  }

  // Adjust for Gregorian calendar
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  julianDay += b;

  // Calculate Hijri date
  const daysSinceEpoch = julianDay - epochAH;
  const yearLength = 354.367; // Average Islamic year length

  const hijriYear = Math.floor(daysSinceEpoch / yearLength) + 1;

  // Calculate month and day
  const daysInYear = daysSinceEpoch % yearLength;
  let monthLength = 29.5; // Average Islamic month length
  let hijriMonth = Math.floor(daysInYear / monthLength) + 1;
  let hijriDay = Math.floor(daysInYear % monthLength) + 1;

  // Adjust month and day if needed
  if (hijriMonth > 12) {
    hijriMonth = 12;
    hijriDay = Math.floor(daysInYear - (11 * monthLength)) + 1;
  }

  // Hijri month names
  const hijriMonthNames = [
    'Muharram', 'Safar', 'Rabi Al-Awwal', 'Rabi Al-Thani',
    'Jumada Al-Awwal', 'Jumada Al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu Al-Qi\'dah', 'Dhu Al-Hijjah',
  ];

  return {
    day: hijriDay,
    month: hijriMonth,
    year: hijriYear,
    monthName: hijriMonthNames[hijriMonth - 1],
  };
}
