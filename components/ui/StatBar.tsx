import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants/theme';

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
  emoji: string;
}

export function StatBar({ label, value, maxValue = 100, color, emoji }: StatBarProps) {
  const progress = Math.min(value / maxValue, 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: Spacing.xs,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.sm,
  },
  value: {
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
  },
  track: {
    height: 6,
    backgroundColor: Colors.bg.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
