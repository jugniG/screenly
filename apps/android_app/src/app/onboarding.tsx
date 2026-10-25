import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  type DimensionValue,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Onboarding mirrors the landing page's demo phones: three live mock screens
 * rather than pasted screenshots, so they stay on-design as the app evolves.
 * The first two show the product; the third shows the stake - the part that
 * makes the product different - rendered as the actual block screen the user
 * will one day meet.
 */

const { width } = Dimensions.get('window');

type SlideKind = 'usage' | 'limits' | 'stake';

const SLIDES: { id: string; kind: SlideKind; title: string; sub: string }[] = [
  {
    id: '1',
    kind: 'usage',
    title: 'See where your day goes.',
    sub: 'A quiet read of your screen time, every day.',
  },
  {
    id: '2',
    kind: 'limits',
    title: 'Set limits that hold.',
    sub: 'Screenly steps in at the limit you chose - at the moment you chose it.',
  },
  {
    id: '3',
    kind: 'stake',
    title: 'Put money where your time is.',
    sub: `Stake on a limit you set. Meet it, and the full amount comes back.`,
  },
];

const BAR_HEIGHTS = [41, 67, 56, 86, 48, 32, 23];
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const MOST_USED: { app: string; time: string; width: number }[] = [
  { app: 'YouTube', time: '1h 04m', width: 70 },
  { app: 'X', time: '38m', width: 43 },
  { app: 'Chess', time: '15m', width: 22 },
];

const LIMITS: { app: string; track: DimensionValue; reached: boolean; right: string; note: string }[] = [
  { app: 'YouTube', track: '100%', reached: true, right: '', note: 'Limit reached. Locked until tomorrow.' },
  { app: 'Chess', track: '33%', reached: false, right: '15m used', note: 'of 45m' },
  { app: 'X', track: '80%', reached: false, right: '4m used', note: 'of 5m' },
];

const X_PATH =
  'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z';

/**
 * Brand marks for the apps the demo data names. Proportions are computed from
 * `size` because the same mark renders at row size and at the stake screen's
 * large size; type-safe views/SVG rather than letter chips.
 */
function AppMark({ app, size }: { app: string; size: number }) {
  if (app === 'YouTube') {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.23,
          backgroundColor: '#FF0000',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.28,
            borderTopWidth: size * 0.17,
            borderBottomWidth: size * 0.17,
            borderLeftColor: '#FFFFFF',
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            marginLeft: size * 0.05,
          }}
        />
      </View>
    );
  }
  if (app === 'Chess') {
    return (
      <Image
        source={require('../../assets/images/chesscom.webp')}
        style={{ width: size, height: size, borderRadius: size * 0.23 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.23,
        backgroundColor: '#F1F1EC',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
        <Path fill="#0F1419" d={X_PATH} />
      </Svg>
    </View>
  );
}

function PhoneStatus() {
  return (
    <View className="flex-row items-center justify-between px-1">
      <Text className="font-medium text-[9px] text-text-muted">7:24</Text>
      <View className="flex-row items-center gap-1">
        <Ionicons name="cellular" size={9} color="#8B9083" />
        <Ionicons name="wifi" size={9} color="#8B9083" />
        <Ionicons name="battery-half" size={11} color="#8B9083" />
      </View>
    </View>
  );
}

function UsageScreen() {
  return (
    <>
      <PhoneStatus />
      <View className="items-center mt-5">
        <Text className="font-medium text-[9px] text-muted-foreground uppercase tracking-[1.5px]">
          Today
        </Text>
        <Text className="font-bold text-[30px] text-foreground mt-1">2h 48m</Text>
        <Text className="font-regular text-[10px] text-text-muted mt-0.5">
          A little less scrolling. A little more living.
        </Text>
      </View>

      <View className="flex-row items-end justify-between h-[104px] mt-5 px-1 gap-1.5">
        {BAR_HEIGHTS.map((height, i) => (
          <View key={i} className="flex-1 items-center justify-end h-full">
            <View
              className={`w-full rounded-md ${i === 3 ? 'bg-lime' : 'bg-surface-alt'}`}
              style={{ height: `${height}%` }}
            />
            <Text
              className={`text-[7px] mt-1 font-medium ${i === 3 ? 'text-foreground' : 'text-text-muted'}`}
            >
              {DAY_INITIALS[i]}
            </Text>
          </View>
        ))}
      </View>

      <Text className="font-bold text-[12px] text-foreground mt-5 mb-2.5">Most used</Text>
      {MOST_USED.map((row) => (
        <View key={row.app} className="flex-row items-center gap-2 mb-2.5">
          <AppMark app={row.app} size={28} />
          <View className="flex-1">
            <View className="flex-row justify-between">
              <Text className="font-medium text-[10px] text-foreground">{row.app}</Text>
              <Text className="text-[9px] text-text-muted">{row.time}</Text>
            </View>
            <View className="h-[3px] rounded-full bg-surface-alt mt-1">
              <View className="h-full rounded-full bg-lime" style={{ width: `${row.width}%` }} />
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

function LimitsScreen() {
  return (
    <>
      <PhoneStatus />
      <View className="mt-5">
        <Text className="font-medium text-[9px] text-muted-foreground">Good evening,</Text>
        <Text className="font-bold text-[22px] text-foreground mt-0.5">Your limits</Text>
      </View>

      {LIMITS.map((limit) => (
        <View
          key={limit.app}
          className="rounded-xl border border-border bg-surface p-2.5 mb-2"
        >
          <View className="flex-row items-center gap-2">
            <AppMark app={limit.app} size={28} />
            <Text className="font-semibold text-[11px] text-foreground flex-1">{limit.app}</Text>
            {limit.reached ? (
              <View className="flex-row items-center gap-1 rounded-full bg-lime px-1.5 py-0.5">
                <Ionicons name="lock-closed" size={9} color="#183E32" />
                <Text className="font-semibold text-[8px] text-forest">Locked</Text>
              </View>
            ) : (
              <Text className="text-[9px] text-text-muted">{limit.right}</Text>
            )}
          </View>
          <View className="h-[4px] rounded-full bg-surface-alt mt-2">
            <View
              className={`h-full rounded-full ${limit.reached ? 'bg-forest' : 'bg-lime'}`}
              style={{ width: limit.reached ? '88%' : limit.track }}
            />
          </View>
          <Text className={`text-[8px] mt-1.5 ${limit.reached ? 'text-foreground font-medium' : 'text-text-muted'}`}>
            {limit.note}
          </Text>
        </View>
      ))}

      <View className="flex-row items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 mt-1">
        <Ionicons name="shield-checkmark" size={13} color="#D9EF8A" />
        <Text className="font-medium text-[9px] text-on-forest">
          Your evening is looking a little greener.
        </Text>
      </View>
    </>
  );
}

function StakeScreen() {
  return (
    <>
      <PhoneStatus />
      <View className="items-center mt-6">
        <AppMark app="YouTube" size={44} />
        <Text className="font-bold text-[13px] text-on-forest mt-2">YouTube</Text>
        <Text className="font-regular text-[9px] text-danger-on-forest mt-0.5">
          This app is blocked
        </Text>
      </View>

      <View className="items-center bg-forest-lift border border-forest-border rounded-xl py-4 px-3.5 mt-5">
        <Text className="font-semibold text-[8px] tracking-[1.2px] text-on-forest-dim">YOUR STAKE</Text>
        <Text className="font-bold text-[22px] text-on-forest mt-0.5">₹100</Text>
        <Text className="font-regular text-[8px] text-on-forest-muted text-center leading-[13px] mt-1">
          Back in full in 30 days - as long as you don't break the lock.
        </Text>
      </View>

      <View className="flex-row gap-1.5 mt-5">
        <View className="flex-1 items-center justify-center py-2.5 rounded-lg border border-forest-border">
          <Text className="font-semibold text-[9px] text-on-forest-muted">Back to home</Text>
        </View>
        <View className="flex-1 items-center justify-center py-2.5 rounded-lg bg-lime">
          <Text className="font-semibold text-[9px] text-forest">Unlock early −₹100</Text>
        </View>
      </View>

      <View className="items-center mt-4">
        <Ionicons name="refresh" size={11} color="#D9EF8A" />
        <Text className="font-regular text-[8px] text-on-forest-dim text-center leading-[13px] mt-1 px-4">
          Meet the challenge and the whole stake returns. Leave early and it's the price of the door.
        </Text>
      </View>
    </>
  );
}

const SLIDE_CONTENT = {
  usage: UsageScreen,
  limits: LimitsScreen,
  stake: StakeScreen,
};

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = currentIndex === SLIDES.length - 1;

  async function finish() {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    router.replace('/(protected)/(tabs)');
  }

  function next() {
    if (isLast) {
      finish();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }

  return (
    <View className="flex-1 bg-background">
      <TouchableOpacity className="absolute top-5 right-6 z-10" onPress={finish}>
        <Text className="font-medium text-sm text-muted-foreground">Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => {
          const MockScreen = SLIDE_CONTENT[item.kind];
          const forest = item.kind === 'stake';

          return (
            <View style={{ width }} className="flex-1 px-6 pt-16">
              <View className="items-center">
                <View
                  className={
                    forest
                      ? 'border border-transparent bg-forest rounded-[28px] p-3'
                      : 'border border-border-soft bg-surface rounded-[28px] p-3'
                  }
                  style={{
                    width: width - 96,
                    height: 460,
                  }}
                >
                  <MockScreen />
                </View>
              </View>

              <View className="items-center mt-7">
                <Text className="font-bold text-[22px] text-foreground text-center leading-[30px]">
                  {item.title}
                </Text>
                <Text className="font-regular text-[13px] text-text-secondary text-center leading-[20px] mt-2.5 px-3">
                  {item.sub}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View className="px-6 pb-6 pt-3 gap-4 items-center">
        <View className="flex-row items-center gap-1.5">
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [6, 20, 6],
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
                className="h-1.5 rounded-full bg-forest"
                style={{ width: dotWidth, opacity }}
              />
            );
          })}
        </View>

        <TouchableOpacity
          className="w-full rounded-2xl bg-forest py-4 items-center"
          onPress={next}
          activeOpacity={0.85}
        >
          <Text className="font-semibold text-[16px] text-white">
            {isLast ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
