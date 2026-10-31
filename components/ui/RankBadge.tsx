import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRankByLevel, type RankKey } from '../../constants/ranks';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';

interface RankBadgeProps {
  rankKey: RankKey | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const RANK_DATA: Record<string, { emoji: string; color: string; name: string }> = {
  E: { emoji: '🪨', color: '#9CA3AF', name: 'E-Rank' },
  D: { emoji: '🥉', color: '#78716C', name: 'D-Rank' },
  C: { emoji: '🥈', color: '#C0C0C0', name: 'C-Rank' },
  B: { emoji: '🥇', color: '#F59E0B', name: 'B-Rank' },
  A: { emoji: '💎', color: '#10B981', name: 'A-Rank' },
  S: { emoji: '🔥', color: '#3B82F6', name: 'S-Rank' },
  SS: { emoji: '⚡', color: '#8B5CF6', name: 'SS-Rank' },
  SSS: { emoji: '👑', color: '#F97316', name: 'SSS-Rank' },
};

export function RankBadge({ rankKey, size = 'md', showLabel = true }: RankBadgeProps) {
  const rank = RANK_DATA[rankKey] || RANK_DATA['E'];

  const sizeMap = {
    sm: { container: 40, emoji: 18, fontSize: Fonts.sizes.xs },
    md: { container: 56, emoji: 24, fontSize: Fonts.sizes.sm },
    lg: { container: 80, emoji: 36, fontSize: Fonts.sizes.base },
  };

  const s = sizeMap[size];

  return (
    <View style={styles.wrapper}>
      <View style={[
        styles.badge,
        {
          width: s.container,
          height: s.container,
          borderRadius: s.container / 2,
          borderColor: rank.color,
          backgroundColor: rank.color + '22',
        }
      ]}>
        <Text style={{ fontSize: s.emoji }}>{rank.emoji}</Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: rank.color, fontSize: s.fontSize }]}>
          {rank.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  label: {
    fontWeight: 'bold',
  },
});
