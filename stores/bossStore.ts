import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WEEKLY_BOSSES, type WeeklyBoss, getActiveBossForUser } from '../constants/bosses';
import { useUserStore } from './userStore';
import { useAchievementStore } from './achievementStore';
import { useTitleStore } from './titleStore';
import { SoundEffects } from '../services/soundEffects';
import { Haptics } from '../services/haptics';

export interface BossRoutineItem {
  id: string;
  name: string;
  targetCount: number;
  repsLabel: string;
  muscles: string[];
  sets: number;
  xpReward?: number;
}

export interface DefeatedBossRecord {
  bossId: string;
  bossName: string;
  bossTitle: string;
  emoji: string;
  color: string;
  defeatedAt: string; // ISO 8601
  formattedDate: string; // ej: "31 Oct, 2026 • 23:45"
  totalHP: number;
  xpReward: number;
  floorNumber: number; // 1 a 22
  routine: BossRoutineItem[];
  userLevelAtDefeat?: number;
  rankBadge?: string;
  kanjiTitle?: string;
}

function formatCombatDate(date: Date = new Date()): string {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month}, ${year} • ${hours}:${minutes}`;
}

interface BossStore {
  defeatedBossIds: string[];
  defeatHistory: DefeatedBossRecord[];
  isLoaded: boolean;
  initialize: (uid: string) => Promise<void>;
  getActiveBoss: () => WeeklyBoss;
  isBossDefeated: (bossId: string) => boolean;
  isAllBossesDefeated: () => boolean;
  getBossDefeatRecord: (bossId: string) => DefeatedBossRecord | undefined;
  recordBossDefeat: (
    bossId: string,
    uid: string,
    routineSnapshot?: BossRoutineItem[],
    userLevel?: number
  ) => Promise<{
    defeatedBoss: WeeklyBoss;
    nextBoss: WeeklyBoss | null;
    isAllConquered: boolean;
    record: DefeatedBossRecord;
  }>;
  resetBossProgress: (uid: string) => Promise<void>;
}

export const useBossStore = create<BossStore>((set, get) => ({
  defeatedBossIds: [],
  defeatHistory: [],
  isLoaded: false,

  initialize: async (uid: string) => {
    try {
      const storageKey = `@fitrise_defeated_boss_ids_${uid}`;
      const historyKey = `@fitrise_boss_defeat_history_${uid}`;

      const [rawIds, rawHistory] = await Promise.all([
        AsyncStorage.getItem(storageKey),
        AsyncStorage.getItem(historyKey),
      ]);

      const defeatedBossIds: string[] = rawIds ? JSON.parse(rawIds) : [];
      let defeatHistory: DefeatedBossRecord[] = rawHistory ? JSON.parse(rawHistory) : [];

      // Retrocompatibilidad: Si existen IDs derrotados pero no hay registro detallado, backfill
      if (defeatedBossIds.length > 0 && defeatHistory.length === 0) {
        defeatHistory = defeatedBossIds.map((id, index) => {
          const boss = WEEKLY_BOSSES.find((b) => b.id === id) || WEEKLY_BOSSES[index] || WEEKLY_BOSSES[0];
          return {
            bossId: boss.id,
            bossName: boss.name,
            bossTitle: boss.title,
            emoji: boss.emoji,
            color: boss.color,
            defeatedAt: new Date(Date.now() - (defeatedBossIds.length - index) * 86400000 * 7).toISOString(),
            formattedDate: formatCombatDate(new Date(Date.now() - (defeatedBossIds.length - index) * 86400000 * 7)),
            totalHP: boss.totalHP,
            xpReward: boss.xpReward,
            floorNumber: index + 1,
            routine: boss.circuit.map((ex) => ({
              id: ex.id,
              name: ex.name,
              targetCount: ex.targetCount,
              repsLabel: ex.repsLabel,
              muscles: ex.muscles,
              sets: ex.sets,
            })),
            userLevelAtDefeat: 1,
            rankBadge: boss.rankBadge,
            kanjiTitle: boss.kanjiTitle,
          };
        });
        await AsyncStorage.setItem(historyKey, JSON.stringify(defeatHistory));
      }

      set({ defeatedBossIds, defeatHistory, isLoaded: true });
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

  getBossDefeatRecord: (bossId: string) => {
    return get().defeatHistory.find((r) => r.bossId === bossId);
  },

  recordBossDefeat: async (bossId: string, uid: string, routineSnapshot?: BossRoutineItem[], userLevel?: number) => {
    const { defeatedBossIds, defeatHistory } = get();
    const updatedIds = Array.from(new Set([...defeatedBossIds, bossId]));

    const currentBoss = WEEKLY_BOSSES.find((b) => b.id === bossId) || WEEKLY_BOSSES[0];
    const floorNumber = WEEKLY_BOSSES.findIndex((b) => b.id === bossId) + 1;

    const newRecord: DefeatedBossRecord = {
      bossId: currentBoss.id,
      bossName: currentBoss.name,
      bossTitle: currentBoss.title,
      emoji: currentBoss.emoji,
      color: currentBoss.color,
      defeatedAt: new Date().toISOString(),
      formattedDate: formatCombatDate(new Date()),
      totalHP: currentBoss.totalHP,
      xpReward: currentBoss.xpReward,
      floorNumber: floorNumber > 0 ? floorNumber : updatedIds.length,
      routine: routineSnapshot || currentBoss.circuit.map((ex) => ({
        id: ex.id,
        name: ex.name,
        targetCount: ex.targetCount,
        repsLabel: ex.repsLabel,
        muscles: ex.muscles,
        sets: ex.sets,
      })),
      userLevelAtDefeat: userLevel || 1,
      rankBadge: currentBoss.rankBadge,
      kanjiTitle: currentBoss.kanjiTitle,
    };

    // Actualizar historial asegurando no duplicar
    const filteredHistory = defeatHistory.filter((r) => r.bossId !== bossId);
    const updatedHistory = [...filteredHistory, newRecord];

    set({ defeatedBossIds: updatedIds, defeatHistory: updatedHistory });

    try {
      const storageKey = `@fitrise_defeated_boss_ids_${uid}`;
      const historyKey = `@fitrise_boss_defeat_history_${uid}`;
      await Promise.all([
        AsyncStorage.setItem(storageKey, JSON.stringify(updatedIds)),
        AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory)),
      ]);
    } catch (e) {
      console.warn('Error guardando progreso de jefes:', e);
    }

    const nextBoss = WEEKLY_BOSSES.find((b) => !updatedIds.includes(b.id)) || null;
    const isAllConquered = updatedIds.length >= WEEKLY_BOSSES.length;

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
      record: newRecord,
    };
  },

  resetBossProgress: async (uid: string) => {
    set({ defeatedBossIds: [], defeatHistory: [] });
    try {
      const storageKey = `@fitrise_defeated_boss_ids_${uid}`;
      const historyKey = `@fitrise_boss_defeat_history_${uid}`;
      await Promise.all([
        AsyncStorage.setItem(storageKey, JSON.stringify([])),
        AsyncStorage.setItem(historyKey, JSON.stringify([])),
      ]);
    } catch (e) {
      console.warn('Error reiniciando progreso de jefes:', e);
    }
  },
}));
