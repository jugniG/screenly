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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts, radius } from '../components/ui/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    bg: '#0D0D1A',
    accent: '#7C5CFF',
    image: require('../assets/screens/image1.png'),
    titleParts: [
      { text: 'Ever opened an app\nfor 5 minutes... ', color: '#fff' },
      { text: 'and lost an hour?', color: '#7C5CFF' },
    ],
    subParts: [
      { text: 'Apps are designed to keep you scrolling. ', color: '#9CA3AF' },
      { text: 'Screenly', color: '#7C5CFF' },
      { text: ' helps you take back control.', color: '#9CA3AF' },
    ],
  },
  {
    id: '2',
    bg: '#0A1A0D',
    accent: '#22C55E',
    image: require('../assets/screens/image2.png'),
    titleParts: [
      { text: 'Screenly can help you\n', color: '#fff' },
      { text: 'optimize your\nphone usage.', color: '#22C55E' },
    ],
    subParts: [
      { text: "Define time windows or max usage for your apps and we don't let you go over.\nIt's urgent? You can ", color: '#9CA3AF' },
      { text: 'unlock it with just $5.', color: '#22C55E' },
    ],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<Animated.FlatList<(typeof SLIDES)[number]>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const current = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  async function finish() {
    await AsyncStorage.setItem('onboarding_done', '1');
    router.replace('/(auth)/sign-up');
  }

  async function skip() {
    await AsyncStorage.setItem('onboarding_done', '1');
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
    <View style={[styles.root, { backgroundColor: current.bg }]}>
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
          <View style={[styles.slide, { width, backgroundColor: item.bg }]}>
            {/* Centered phone screenshot */}
            <View style={styles.imageWrap}>
              <Image
                source={item.image}
                style={styles.phoneImage}
                resizeMode="contain"
              />
            </View>

            {/* Text below image */}
            <View style={styles.textBlock}>
              <Text style={styles.title}>
                {item.titleParts.map((p, i) => (
                  <Text key={i} style={{ color: p.color }}>{p.text}</Text>
                ))}
              </Text>
              <Text style={styles.sub}>
                {item.subParts.map((p, i) => (
                  <Text key={i} style={{ color: p.color }}>{p.text}</Text>
                ))}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Dots + CTA */}
      <View style={[styles.footer, { backgroundColor: current.bg }]}>
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
  root: { flex: 1 },

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
    width: width * 0.72,
    height: undefined,
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
