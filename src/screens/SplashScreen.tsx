import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import SvgComponent from '../assets/svgs/converted/SplashLogo';
import MosqueBGCenterLight from '../assets/svgs/converted/MosqueBGCenterLight';
import MosquesBGFullLight from '../assets/svgs/converted/MosquesBGFullLight';


interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Wait for 3 seconds and then call onFinish
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  return (
    <View style={styles.container}>
      {/* Background Mosques - these will be blurred */}
      <View style={styles.fullMosqueWrapper}>
        <MosquesBGFullLight
          width={fullMosqueBgWidth}
          height={fullMosqueBgHeight}
        />
      </View>
      <View style={styles.mosqueWrapper}>
        <MosqueBGCenterLight
          width={mosqueBgWidth}
          height={mosqueBgHeight}
        />
      </View>

      {/* BlurView - sits on top of backgrounds, behind foreground content */}
      <BlurView
        style={styles.absolute}
        blurAmount={0.4}
        blurType="light"
      />

      <View style={styles.content}>
        {/* Foreground Content - remains sharp */}
        <View style={styles.patternsContainerTop}>
          <Image
            source={require('../assets/svgs/Patterns.png')}
            style={styles.patternImage}
          />
        </View>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.logoContainer}>
            <SvgComponent
              width={logoSize}
              height={logoSize}
            />
          </View>
        </Animated.View>
        <View style={styles.patternsContainerBottom}>
          <Image
            source={require('../assets/svgs/Patterns.png')}
            style={styles.patternImage}
          />
        </View>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');
const logoSize = Math.min(width * 0.35, height * 0.35);
const svgAspectRatio = 1671 / 2627;
const mosqueBgWidth = width * 0.7; // 70% of screen width for the centered overlay
const mosqueBgHeight = mosqueBgWidth * svgAspectRatio;

const fullSvgAspectRatio = 1380 / 3848; // Aspect ratio for MosquesBGFullLight
const fullMosqueBgWidth = width; // Full screen width for the background
const fullMosqueBgHeight = fullMosqueBgWidth * fullSvgAspectRatio;

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#ECFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternsContainerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 200,
  },
  patternsContainerBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 200,
  },
  patternImage: {
    width: '100%',
    height: 50,
    resizeMode: 'cover',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  logoContainer: {
    width: logoSize,
    height: logoSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'absolute',
    zIndex: 11,

  },
  mosqueWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fullMosqueWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center', // Not strictly necessary if child is full width
    zIndex: 2,
  },
  mosqueBackground: {
    position: 'absolute',
    bottom: 0,
    // Horizontally centered by alignItems: 'center' on styles.container
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
