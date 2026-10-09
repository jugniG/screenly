import React from 'react';
import { Pressable, View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { colors, radius, spacing } from './theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Tailwind classes, preferred over `style` for new call sites. */
  className?: string;
  padding?: keyof typeof spacing;
  /** When set the card becomes tappable. Omit it for static, non-interactive cards. */
  onPress?: () => void;
}

export function Card({ children, style, className, padding = 'md', onPress }: CardProps) {
  const content = (
    <View className={className} style={[styles.card, { padding: spacing[padding] }, style]}>
      {children}
    </View>
  );

  if (!onPress) return content;

  // Nested touchables still work: a child TouchableOpacity inside this wins the
  // gesture, which is what lets a delete button sit inside a tappable card.
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'rgba(28, 25, 23, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});