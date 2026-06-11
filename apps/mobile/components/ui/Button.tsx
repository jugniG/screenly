import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { colors, fonts, radius, spacing } from './theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps {
  /** Display text */
  title?: string;
  /** Alias for title — backwards compat */
  label?: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  /** Optional icon name (currently: 'google') */
  icon?: 'google';
}

export function Button({
  title,
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  icon,
}: ButtonProps) {
  const text = title ?? label ?? '';

  const variantStyle: ViewStyle = {
    primary:   { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    outline:   { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.borderSoft },
    ghost:     { backgroundColor: 'transparent' },
    danger:    { backgroundColor: colors.danger },
  }[variant];

  const textColor = {
    primary:   '#fff',
    secondary: colors.text,
    outline:   colors.text,
    ghost:     colors.primary,
    danger:    '#fff',
  }[variant];

  return (
    <TouchableOpacity
      style={[styles.base, variantStyle, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary} size="small" />
      ) : (
        <View style={styles.content}>
          {icon === 'google' && (
            <Text style={[styles.iconText, { color: textColor }]}>G  </Text>
          )}
          <Text style={[styles.label, { color: textColor }]}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  disabled: { opacity: 0.5 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  iconText: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
});
