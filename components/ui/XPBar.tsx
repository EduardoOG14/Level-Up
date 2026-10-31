import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../constants/theme';

interface XPBarProps {
  current: number;
  required: number;
  progress: number; // 0 to 1
  level: number;
  showLabels?: boolean;
}

export function XPBar({ current, required, progress, level, showLabels = true }: XPBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.labels}>
          <Text style={styles.levelText}>LVL {level}</Text>
          <Text style={styles.xpText}>{current.toLocaleString()} / {required.toLocaleString()} XP</Text>
        </View>
      )}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: widthInterpolated }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  levelText: {
    color: Colors.brand.accent,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
  },
  xpText: {
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.xs,
  },
  track: {
    height: 8,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.brand.accent,
    borderRadius: Radius.full,
  },
});
