import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WEEKLY_BOSSES, type WeeklyBoss, getActiveBossForUser } from '../constants/bosses';
import { useUserStore } from './userStore';
import { useAchievementStore } from './achievementStore';
import { useTitleStore } from './titleStore';
import { SoundEffects } from '../services/soundEffects';
import { Haptics } from '../services/haptics';

interface BossStore {
  defeatedBossIds: string[];
  isLoaded: boolean;
  initialize: (uid: string) => Promise<void>;
  getActiveBoss: () => WeeklyBoss;
  isBossDefeated: (bossId: string) => boolean;
  isAllBossesDefeated: () => boolean;
  recordBossDefeat: (bossId: string, uid: string) => Promise<{
    defeatedBoss: WeeklyBoss;
    nextBoss: WeeklyBoss | null;
    isAllConquered: boolean;
  }>;
  resetBossProgress: (uid: string) => Promise<void>;
}

export const useBossStore = create<BossStore>((set, get) => ({
  defeatedBossIds: [],
  isLoaded: false,

  initialize: async (uid: string) => {
    try {
      const storageKey = `@fitrise_defeated_boss_ids_${uid}`;
      const raw = await AsyncStorage.getItem(storageKey);
      const defeatedBossIds = raw ? JSON.parse(raw) : [];
      set({ defeatedBossIds, isLoaded: true });
    } catch (e) {
      console.warn('Error inicializando BossStore:', e);
      set({ isLoaded: true });
    }
  },

  getActiveBoss: () => {
    const { defeatedBossIds } = get();
    return getActiveBossForUser(defeatedBossIds);
  },

  isBossDefeated: (bossId: string) => {
    return get().defeatedBossIds.includes(bossId);
  },

  isAllBossesDefeated: () => {
    const { defeatedBossIds } = get();
    return WEEKLY_BOSSES.every((b) => defeatedBossIds.includes(b.id));
  },

  recordBossDefeat: async (bossId: string, uid: string) => {
    const { defeatedBossIds } = get();
    const updated = Array.from(new Set([...defeatedBossIds, bossId]));
    set({ defeatedBossIds: updated });

    try {
      const storageKey = `@fitrise_defeated_boss_ids_${uid}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error guardando progreso de jefes:', e);
    }

    const currentBoss = WEEKLY_BOSSES.find((b) => b.id === bossId) || WEEKLY_BOSSES[0];
    const nextBoss = WEEKLY_BOSSES.find((b) => !updated.includes(b.id)) || null;
    const isAllConquered = updated.length >= WEEKLY_BOSSES.length;

    // Otorgar logro Cazador de Jefes
    await useAchievementStore.getState().unlockAchievement('boss_weekly_slayer', uid);

    // Actualizar títulos del cazador
    await useTitleStore.getState().loadAndEvaluateTitle(uid, {
      bossDefeated: true,
      weeklyCircuits: 1,
      weeklyQuestDays: 1,
    });

    SoundEffects.playLevelUp();
    Haptics.triumph();

    return {
      defeatedBoss: currentBoss,
      nextBoss,
      isAllConquered,
    };
  },

  resetBossProgress: async (uid: string) => {
    set({ defeatedBossIds: [] });
    try {
      const storageKey = `@fitrise_defeated_boss_ids_${uid}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify([]));
    } catch (e) {
      console.warn('Error reiniciando progreso de jefes:', e);
    }
  },
}));
