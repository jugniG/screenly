import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../components/ui/theme';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  apps: 'grid',
  stats: 'bar-chart',
  account: 'person',
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
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
            color={focused ? colors.primary : colors.textMuted}
          />
        ),
      })}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home' }} />
      <Tabs.Screen name="apps"    options={{ title: 'Apps' }} />
      <Tabs.Screen name="stats"   options={{ title: 'Stats' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
