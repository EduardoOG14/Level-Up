import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACHIEVEMENTS_LIST, type Achievement } from '../constants/achievements';
import { useUserStore, type UserProfile } from './userStore';
import { Haptics } from '../services/haptics';

interface AchievementStore {
  unlockedIds: string[];
  lastUnlockedId: string | null;
  isLoaded: boolean;

  // Acciones
  loadAchievements: (uid: string) => Promise<void>;
  unlockAchievement: (id: string, uid: string) => Promise<boolean>;
  checkAutomaticAchievements: (uid: string, user: UserProfile, extra?: {
    weeklyCircuits?: number;
    completedQuestDaysCount?: number;
    waterCupsToday?: number;
    weightLogsCount?: number;
    bossDefeated?: boolean;
  }) => Promise<string[]>;
  isAllCompleted: () => boolean;
  resetAchievements: (uid?: string) => Promise<void>;
}

export const useAchievementStore = create<AchievementStore>((set, get) => ({
  unlockedIds: [],
  lastUnlockedId: null,
  isLoaded: false,

  loadAchievements: async (uid: string) => {
    try {
      const storageKey = `@fitrise_achievements_${uid}`;
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        const ids = JSON.parse(raw);
        set({ unlockedIds: Array.isArray(ids) ? ids : [], isLoaded: true });
      } else {
        set({ unlockedIds: [], isLoaded: true });
      }
    } catch (e) {
      console.warn('Error loading achievements:', e);
      set({ isLoaded: true });
    }
  },

  unlockAchievement: async (id: string, uid: string) => {
    const { unlockedIds } = get();
    if (unlockedIds.includes(id)) return false;

    const achievement = ACHIEVEMENTS_LIST.find((a) => a.id === id);
    if (!achievement) return false;

    const updated = [...unlockedIds, id];
    set({ unlockedIds: updated, lastUnlockedId: id });

    // Otorgar bono de XP
    await useUserStore.getState().addXP(achievement.xpReward, 'discipline');

    // Vibración háptica de triunfo
    Haptics.triumph();

    // Guardar en AsyncStorage
    try {
      const storageKey = `@fitrise_achievements_${uid}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error persisting achievement:', e);
    }

    return true;
  },

  checkAutomaticAchievements: async (uid: string, user: UserProfile, extra = {}) => {
    const { unlockedIds } = get();
    const newUnlocked: string[] = [];

    const toCheck: { id: string; condition: boolean }[] = [
      // Progresión
      { id: 'prog_first_step', condition: user.level >= 2 },
      { id: 'prog_level_5', condition: user.level >= 5 },
      { id: 'prog_level_10', condition: user.level >= 10 },
      { id: 'prog_level_20', condition: user.level >= 20 },
      { id: 'prog_level_30', condition: user.level >= 30 },
      { id: 'prog_level_50', condition: user.level >= 50 },
      { id: 'prog_rank_d', condition: user.rank !== 'E' },
      { id: 'prog_rank_c', condition: ['C', 'B', 'A', 'S', 'SS', 'SSS'].includes(user.rank) },
      { id: 'prog_rank_b', condition: ['B', 'A', 'S', 'SS', 'SSS'].includes(user.rank) },
      { id: 'prog_rank_s', condition: ['S', 'SS', 'SSS'].includes(user.rank) },

      // Misiones
      { id: 'quest_first', condition: (user.questsCompleted || 0) >= 1 },
      { id: 'quest_total_10', condition: (user.questsCompleted || 0) >= 10 },
      { id: 'quest_total_50', condition: (user.questsCompleted || 0) >= 50 },
      { id: 'quest_total_100', condition: (user.questsCompleted || 0) >= 100 },
      { id: 'quest_full_day_1', condition: (extra.completedQuestDaysCount || 0) >= 1 },
      { id: 'quest_full_day_3', condition: (extra.completedQuestDaysCount || 0) >= 3 },
      { id: 'quest_full_day_7', condition: (extra.completedQuestDaysCount || 0) >= 7 },
      { id: 'quest_full_day_14', condition: (extra.completedQuestDaysCount || 0) >= 14 },
      { id: 'quest_full_day_30', condition: (extra.completedQuestDaysCount || 0) >= 30 },
      { id: 'quest_bonus_claim', condition: (user.questsCompleted || 0) >= 5 },

      // Circuitos y Mazmorras
      { id: 'circuit_first', condition: (user.workoutsCompleted || 0) >= 1 },
      { id: 'circuit_3_weekly', condition: (extra.weeklyCircuits || 0) >= 3 },
      { id: 'circuit_total_5', condition: (user.workoutsCompleted || 0) >= 5 },
      { id: 'circuit_total_15', condition: (user.workoutsCompleted || 0) >= 15 },
      { id: 'circuit_total_30', condition: (user.workoutsCompleted || 0) >= 30 },
      { id: 'dungeon_ia_first', condition: (user.workoutsCompleted || 0) >= 1 },
      { id: 'dungeon_ia_5', condition: (user.workoutsCompleted || 0) >= 5 },
      { id: 'dungeon_ia_10', condition: (user.workoutsCompleted || 0) >= 10 },
      { id: 'plan_active_set', condition: true },
      { id: 'boss_weekly_slayer', condition: !!extra.bossDefeated },

      // Ejercicios
      { id: 'ex_pushups_master', condition: (user.workoutsCompleted || 0) >= 2 },
      { id: 'ex_squats_master', condition: (user.workoutsCompleted || 0) >= 2 },
      { id: 'ex_pike_master', condition: (user.workoutsCompleted || 0) >= 3 },
      { id: 'ex_diamond_master', condition: (user.workoutsCompleted || 0) >= 3 },
      { id: 'ex_lunges_master', condition: (user.workoutsCompleted || 0) >= 2 },
      { id: 'ex_plank_master', condition: (user.workoutsCompleted || 0) >= 2 },
      { id: 'ex_climbers_master', condition: (user.workoutsCompleted || 0) >= 3 },
      { id: 'ex_burpee_master', condition: (user.workoutsCompleted || 0) >= 4 },
      { id: 'ex_cadence_perfect', condition: (user.workoutsCompleted || 0) >= 1 },
      { id: 'ex_bodyweight_pure', condition: user.equipment?.includes('none') ?? false },

      // Disciplina
      { id: 'disc_water_cup', condition: (extra.waterCupsToday || 0) >= 1 },
      { id: 'disc_water_full_day', condition: (extra.waterCupsToday || 0) >= 8 },
      { id: 'disc_water_3_days', condition: (extra.completedQuestDaysCount || 0) >= 3 },
      { id: 'disc_weight_first', condition: (extra.weightLogsCount || 0) >= 1 },
      { id: 'disc_weight_4_weeks', condition: (extra.weightLogsCount || 0) >= 4 },
      { id: 'disc_avatar_custom', condition: !!user.avatar },
      { id: 'disc_name_custom', condition: user.name !== 'Jin-Woo' && user.name !== 'Cazador' },
      { id: 'disc_voice_listener', condition: true },

      // Leyendas
      { id: 'leg_streak_7', condition: user.streak >= 7 },
      { id: 'leg_streak_30', condition: user.streak >= 30 },
      { id: 'leg_xp_5000', condition: user.totalXP >= 5000 },
      { id: 'leg_xp_20000', condition: user.totalXP >= 20000 },
    ];

    for (const item of toCheck) {
      if (item.condition && !unlockedIds.includes(item.id)) {
        await get().unlockAchievement(item.id, uid);
        newUnlocked.push(item.id);
      }
    }

    return newUnlocked;
  },

  isAllCompleted: () => {
    const { unlockedIds } = get();
    return unlockedIds.length >= ACHIEVEMENTS_LIST.length;
  },

  resetAchievements: async (uid?: string) => {
    set({ unlockedIds: [], lastUnlockedId: null });
    if (uid) {
      try {
        await AsyncStorage.removeItem(`@fitrise_achievements_${uid}`);
      } catch (e) {
        console.warn('Error clearing achievements:', e);
      }
    }
  },
}));
