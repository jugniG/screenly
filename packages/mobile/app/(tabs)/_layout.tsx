import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../components/ui/theme';

function TabIcon({ focused, color, children }: { focused: boolean; color: string; children: string }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <View style={[styles.iconDot]} />
    </View>
  );
}

// Simple text-based tab icons since we don't have an icon library set up
function Icon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home:    '⬛',
    apps:    '◻',
    stats:   '▦',
    account: '○',
  };
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'Poppins-Medium',
          fontSize: 11,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIconEmoji focused={focused} emoji="🏠" />
          ),
        }}
      />
      <Tabs.Screen
        name="apps"
        options={{
          title: 'My Apps',
          tabBarIcon: ({ focused }) => (
            <TabIconEmoji focused={focused} emoji="📱" />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => (
            <TabIconEmoji focused={focused} emoji="📊" />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => (
            <TabIconEmoji focused={focused} emoji="👤" />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIconEmoji({ focused, emoji }: { focused: boolean; emoji: string }) {
  const { Text } = require('react-native');
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 60,
    paddingTop: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {},
  iconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  tabIcon: {},
  tabIconActive: {},
});
