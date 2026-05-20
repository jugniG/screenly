import { useEffect, useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../components/ui/theme';
import { authClient } from '../../lib/auth';
import ScreenlyEnforcer from '../../modules/screenly-enforcer/src/ScreenlyEnforcerModule';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  account: 'person',
};

export default function TabsLayout() {
  const { data: session, isPending, isFetching } = authClient.useSession() as any;
  const [permsOk, setPermsOk] = useState<boolean | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      const [hasUsage, hasA11y] = await Promise.all([
        ScreenlyEnforcer.hasUsageStatsPermission(),
        ScreenlyEnforcer.isAccessibilityServiceEnabled(),
      ]);
      setPermsOk(hasUsage && hasA11y);
    })();
  }, []);

  if (isPending || isFetching) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  if (!session) {
    return <Redirect href="/onboarding" />;
  }

  if (permsOk === false) {
    return <Redirect href="/setup" />;
  }

  if (permsOk === null) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneContainerStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'Poppins-Medium',
          fontSize: 10,
          marginTop: -2,
        },
        tabBarIcon: ({ focused }) => (
          <Ionicons
            name={`${TAB_ICONS[route.name]}${focused ? '' : '-outline'}` as any}
            size={22}
            color={focused ? colors.text : colors.textMuted}
          />
        ),
      })}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
