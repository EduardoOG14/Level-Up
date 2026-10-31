import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'exercise' | 'nutrition' | 'hydration' | 'sleep' | 'mental';
  xpReward: number;
  statBoost?: { stat: string; value: number };
  icon: string;
  completed: boolean;
  exerciseName?: string;
  targetMuscles?: string[];
  sets?: number;
  reps?: string;
  duration?: string;
  difficulty?: string;
  instructions?: string[];
  cortexAdvice?: string;
  videoUrl?: string;
}

interface QuestCardProps {
  quest: Quest;
  onComplete: (questId: string) => void;
  onPress?: (quest: Quest) => void;
}

const categoryColors: Record<string, string> = {
  exercise: Colors.brand.primary,
  nutrition: '#10B981',
  hydration: '#3B82F6',
  sleep: '#8B5CF6',
  mental: '#F59E0B',
};

export function QuestCard({ quest, onComplete, onPress }: QuestCardProps) {
  const color = categoryColors[quest.category] || Colors.brand.primary;

  return (
    <TouchableOpacity
      style={[styles.container, quest.completed && styles.completed]}
      onPress={() => onPress?.(quest)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '22' }]}>
        <Text style={styles.icon}>{quest.icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, quest.completed && styles.completedText]}>
          {quest.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {quest.description}
        </Text>
        <View style={styles.rewards}>
          <Text style={styles.xp}>+{quest.xpReward} XP</Text>
          {quest.statBoost && (
            <Text style={styles.statBoost}>
              +{quest.statBoost.value} {quest.statBoost.stat}
            </Text>
          )}
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={10} color={Colors.brand.accent} />
            <Text style={styles.videoBadgeText}>Ver video</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.checkBtn, { borderColor: color }, quest.completed && { backgroundColor: color }]}
        onPress={(e) => {
          e.stopPropagation?.();
          if (!quest.completed) {
            onComplete(quest.id);
          }
        }}
        disabled={quest.completed}
        activeOpacity={0.7}
      >
        <Text style={styles.checkIcon}>{quest.completed ? '✓' : ''}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completed: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.text.muted,
  },
  description: {
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.sm,
    marginBottom: Spacing.xs,
  },
  rewards: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  xp: {
    color: Colors.brand.accent,
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },
  statBoost: {
    color: Colors.brand.primary,
    fontSize: Fonts.sizes.xs,
    textTransform: 'capitalize',
  },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  videoBadgeText: {
    color: Colors.brand.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
