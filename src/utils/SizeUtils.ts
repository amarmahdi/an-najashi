import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Create a scale factor based on screen size
const scale = Math.min(width, height) / 1000; // Normalize against a 1000px baseline

/**
 * Normalize a size dimension based on the device's screen size
 * 
 * @param size - The base size to normalize
 * @returns The normalized size appropriate for the current device
 */
export const normalizeSize = (size: number): number => {
    return Math.round(size * scale * PixelRatio.get() / 2);
};

/**
 * Scale font sizes with a minimum readable size limit
 * 
 * @param size - The base font size
 * @returns The scaled font size with minimum readability threshold
 */
export const scaleFontSize = (size: number): number => {
    const newSize = size * scale;
    return Math.round(Math.max(size * 0.65, newSize)); // Ensure minimum readable size
};

/**
 * Determine if the device has a small screen
 * 
 * @returns Boolean indicating if the device has a small screen
 */
export const isSmallScreen = (): boolean => {
    return height < 700;
};

/**
 * Get screen dimensions
 * 
 * @returns Object containing screen width and height
 */
export const getScreenDimensions = () => {
    return { width, height };
}; 