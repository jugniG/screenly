import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radius } from '../components/ui/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    accent: colors.primary,
    image: require('../assets/screens/image1.png')
  },
  {
    id: '2',
    accent: colors.primary,
    image: require('../assets/screens/image2.png')
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<Animated.FlatList<(typeof SLIDES)[number]>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const current = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  function finish() {
    router.replace('/(auth)/sign-up');
  }

  function skip() {
    router.replace('/(auth)/sign-in');
  }

  function next() {
    if (isLast) {
      finish();
    } else {
      (flatListRef.current as any)?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }

  return (
    <View style={[styles.root]}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.skip} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={e => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width}]}>
            {/* Centered phone screenshot */}
            <View style={styles.imageWrap}>
              <Image
                source={item.image}
                style={styles.phoneImage}
                resizeMode="contain"
              />
            </View>
          </View>
        )}
      />

      {/* Dots + CTA */}
      <View style={[styles.footer]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [6, 20, 6], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: current.accent }]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: current.accent }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1,backgroundColor:'#101112' },

  skip: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#9CA3AF',
  },

  slide: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  phoneImage: {
    width: width ,
    height: undefined,
    top:0,
    aspectRatio: 0.46,
  },

  textBlock: {
    paddingBottom: 12,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 10,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
    gap: 16,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: radius.full,
  },
  cta: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#fff',
  },
});
