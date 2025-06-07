/**
 * ColorUtils - Utility functions for color manipulation and gradient generation
 */

/**
 * Interpolate between two hex colors
 * 
 * @param color1 - Starting hex color (format: #RRGGBB)
 * @param color2 - Ending hex color (format: #RRGGBB)
 * @param factor - Interpolation factor (0 to 1)
 * @returns Interpolated hex color
 */
export const interpolateColor = (color1: string, color2: string, factor: number): string => {
    // Extract RGB components from hex colors
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);
    
    // Interpolate between the RGB values
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
    
    // Convert back to hex format
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Create a smooth gradient array from base colors
 * 
 * @param baseColors - Array of base colors to interpolate between
 * @param steps - Number of steps between each adjacent pair of colors
 * @returns An array of colors forming a smooth gradient
 */
export const createSmoothGradient = (baseColors: string[], steps: number = 30): string[] => {
    const smoothGradient: string[] = [];
    
    // Process each adjacent pair of colors
    for (let i = 0; i < baseColors.length - 1; i++) {
        const color1 = baseColors[i];
        const color2 = baseColors[i + 1];
        
        // Add the first color
        if (i === 0) smoothGradient.push(color1);
        
        // Create intermediate steps between the two colors
        for (let step = 1; step <= steps; step++) {
            const factor = step / steps;
            smoothGradient.push(interpolateColor(color1, color2, factor));
        }
    }
    
    // Add the last color
    smoothGradient.push(baseColors[baseColors.length - 1]);
    
    return smoothGradient;
};

// Time period definitions
export interface TimePeriod {
    name: string;
    startTime: number;
    endTime: number;
    colors: string[];
}

// Define all time periods and their color palettes
export const TIME_PERIODS: TimePeriod[] = [
    { name: 'night', startTime: 0, endTime: 5, colors: ['#041529', '#051d33', '#071d3d', '#0c2c5a'] },
    { name: 'dawn', startTime: 5, endTime: 7, colors: ['#614051', '#9a5842', '#d17032', '#f5cb8c'] },
    { name: 'morning', startTime: 7, endTime: 11, colors: ['#71a6d2', '#84b5df', '#97c4e7', '#def2ff'] },
    { name: 'midday', startTime: 11, endTime: 15, colors: ['#3a8bd8', '#4a99e3', '#5dabff', '#8ec7ff'] },
    { name: 'afternoon', startTime: 15, endTime: 18, colors: ['#d18237', '#e09546', '#e9a856', '#ffd3a0'] },
    { name: 'sunset', startTime: 18, endTime: 20, colors: ['#392e58', '#6d3a40', '#a34a28', '#e47551'] },
    { name: 'night', startTime: 20, endTime: 24, colors: ['#041529', '#051d33', '#071d3d', '#0c2c5a'] }
];

/**
 * Get background colors based on the current time
 * 
 * @param hour - Current hour (0-23) or null to use the current system time
 * @returns Array of colors for the current time period with smooth transitions
 */
export const getBackgroundColors = (hour: number | null): string[] => {
    const currentHour = hour !== null ? hour : new Date().getHours();
    // Add minutes to create smoother transitions between hours
    const currentTime = new Date();
    const minutes = currentTime.getMinutes() / 60; // Convert to fraction of hour
    const preciseTime = hour !== null ? currentHour + 0.5 : currentHour + minutes; // Use middle of hour for simulated hour
    
    // Find the current period and possibly the next period for transitions
    let currentPeriod = TIME_PERIODS.find(period => 
        preciseTime >= period.startTime && preciseTime < period.endTime
    );
    
    // If at the exact boundary or not found, default to night
    if (!currentPeriod) {
        currentPeriod = TIME_PERIODS[0]; // Default to night
    }
    
    // If we're close to the boundary (within 30 minutes), blend with the next period
    const BLEND_THRESHOLD = 0.5; // 30 minutes in decimal hours
    const timeLeftInPeriod = currentPeriod.endTime - preciseTime;
    
    // Only blend if we're approaching the end of a period
    if (timeLeftInPeriod <= BLEND_THRESHOLD) {
        // Find the next period (loop back to beginning if at end of day)
        const nextPeriodIndex = TIME_PERIODS.indexOf(currentPeriod) + 1;
        const nextPeriod = nextPeriodIndex < TIME_PERIODS.length ? 
                           TIME_PERIODS[nextPeriodIndex] : TIME_PERIODS[0];
        
        // Calculate blend factor (0 = current period, 1 = next period)
        const blendFactor = 1 - (timeLeftInPeriod / BLEND_THRESHOLD);
        
        // Blend each color in the palette
        return currentPeriod.colors.map((color, index) => {
            return interpolateColor(color, nextPeriod.colors[index], blendFactor);
        });
    }
    
    // If not near a boundary, just return the current period colors
    return currentPeriod.colors;
};

/**
 * Get the name of the time of day based on the hour
 * 
 * @param hour - Hour (0-23) or null to use the current system time
 * @returns Name of the time of day (Dawn, Morning, Midday, Afternoon, Sunset, Night)
 */
export const getTimeOfDayName = (hour: number | null): string => {
    const currentHour = hour !== null ? hour : new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 7) return "Dawn";
    if (currentHour >= 7 && currentHour < 11) return "Morning";
    if (currentHour >= 11 && currentHour < 15) return "Midday";
    if (currentHour >= 15 && currentHour < 18) return "Afternoon";
    if (currentHour >= 18 && currentHour < 20) return "Sunset";
    return "Night";
}; 