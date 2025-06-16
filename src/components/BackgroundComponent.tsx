/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import MosqueBGCenterLight from '../assets/svgs/converted/MosqueBGCenterLight';
import MosquesBGFullLight from '../assets/svgs/converted/MosquesBGFullLight';

interface BackgroundComponentProps {
  children: React.ReactNode;
}

const { width, height } = Dimensions.get('window');
const svgAspectRatio = 1671 / 2627;
const fullMosqueBgHeight = height * 1.05;
const fullMosqueBgWidth = fullMosqueBgHeight * svgAspectRatio;
const mosqueBgHeight = height * 1.05;
const mosqueBgWidth = mosqueBgHeight * svgAspectRatio;

const BackgroundComponent: React.FC<BackgroundComponentProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.mosquesWrapper}>
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
      <BlurView
        style={styles.absolute}
        blurAmount={0.4}
        blurType="light"
      />

      <View style={styles.patternsContainerTop}>
        <Image
          source={require('../assets/svgs/Patterns.png')}
          style={styles.patternImage}
        />
      </View>
      <View style={styles.content}>
        {children}
      </View>
      <View style={styles.patternsContainerBottom}>
        <Image
          source={require('../assets/svgs/Patterns.png')}
          style={styles.patternImage}
        />
      </View>
    </View>
  );
};

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
  mosquesWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mosqueWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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

export default BackgroundComponent;
