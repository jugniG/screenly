import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, spacing, radius } from '../components/ui/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '📱',
    accentColor: '#5C6EFF',
    bgColor: '#EEF0FF',
    title: 'You unlock your\nphone 96 times a day.',
    subtitle: 'Most of it is mindless. Screenly helps you see exactly where your time goes — and take it back.',
    stat: '3h 15m',
    statLabel: 'average daily screen time',
  },
  {
    id: '2',
    emoji: '🔒',
    accentColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    title: 'Block the apps\nthat drain you.',
    subtitle: 'Set daily limits or time windows for any app. When you hit the limit, it locks — no workarounds.',
    stat: '40%',
    statLabel: 'more focus time reported by users',
  },
  {
    id: '3',
    emoji: '⏳',
    accentColor: '#10B981',
    bgColor: '#F0FFF4',
    title: 'Break free,\non your terms.',
    subtitle: 'Need 5 more minutes? Take a free cooldown. Emergency? Unlock instantly — no judgment.',
    stat: '5 min',
    statLabel: 'free cooldown, always available',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  async function finish() {
    await AsyncStorage.setItem('onboarding_done', '1');
    router.replace('/(auth)/sign-in');
  }

  function next() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finish();
    }
  }

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skip} onPress={finish}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Big visual card */}
            <View style={[styles.visualCard, { backgroundColor: item.bgColor }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={[styles.statBubble, { backgroundColor: item.accentColor }]}>
                <Text style={styles.statNumber}>{item.stat}</Text>
                <Text style={styles.statLabel}>{item.statLabel}</Text>
              </View>
            </View>

            {/* Text */}
            <View style={styles.textBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Dots + CTA */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity, backgroundColor: SLIDES[currentIndex].accentColor },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: SLIDES[currentIndex].accentColor }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {isLast ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skip: {
    position: 'absolute',
    top: 56,
    right: spacing.xl,
    zIndex: 10,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    alignItems: 'center',
  },
  visualCard: {
    width: '100%',
    height: height * 0.38,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 80,
  },
  statBubble: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#fff',
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
    gap: spacing.lg,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },
  cta: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#fff',
  },
});
