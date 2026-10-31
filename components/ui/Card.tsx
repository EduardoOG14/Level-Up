import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  default: {
    backgroundColor: Colors.bg.card,
  },
  elevated: {
    backgroundColor: Colors.bg.elevated,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
