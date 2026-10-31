import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './userStore';
import { Haptics } from '../services/haptics';

export const TARGET_WATER_CUPS = 8;
export const ML_PER_CUP = 250;

/**
 * Calcula la meta de hidratación clínica (35 ml / kg)
 */
export function getClinicalWaterTargetMl(weight?: number): number {
  const w = Math.max(weight || 70, 40);
  return Math.max(Math.round((w * 35) / 250) * 250, 1750);
}

export function getClinicalWaterTargetCups(weight?: number): number {
  return Math.max(Math.round(getClinicalWaterTargetMl(weight) / ML_PER_CUP), 7);
}

interface WaterStore {
  cupsDrank: number;
  currentMl: number;
  targetMl: number;
  completedToday: boolean;
  bonusClaimed: boolean;
  lastDrinkTimestamp: number | null;
  isLoaded: boolean;

  // Acciones
  loadTodayWater: (uid: string) => Promise<void>;
  drinkCup: (uid: string) => Promise<{ isFull: boolean }>;
  undoCup: (uid: string) => Promise<void>;
  resetWater: () => void;
  isWaterFullToday: () => boolean;
}

export const getTodayDateKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const useWaterStore = create<WaterStore>((set, get) => ({
  cupsDrank: 0,
  currentMl: 0,
  targetMl: TARGET_WATER_CUPS * ML_PER_CUP,
  completedToday: false,
  bonusClaimed: false,
  lastDrinkTimestamp: null,
  isLoaded: false,

  loadTodayWater: async (uid: string) => {
    try {
      const todayKey = getTodayDateKey();
      const storageKey = `@fitrise_water_${todayKey}_${uid}`;
      const userWeight = useUserStore.getState().user?.weight;
      const targetCups = getClinicalWaterTargetCups(userWeight);
      const targetMl = targetCups * ML_PER_CUP;

      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        const count = data.cupsDrank || 0;
        set({
          cupsDrank: count,
          currentMl: count * ML_PER_CUP,
          targetMl,
          completedToday: count >= targetCups,
          bonusClaimed: !!data.bonusClaimed,
          lastDrinkTimestamp: data.lastDrinkTimestamp || null,
          isLoaded: true,
        });
      } else {
        set({
          cupsDrank: 0,
          currentMl: 0,
          targetMl,
          completedToday: false,
          bonusClaimed: false,
          lastDrinkTimestamp: null,
          isLoaded: true,
        });
      }
    } catch (err) {
      console.warn('Error loading water tracker:', err);
      set({ isLoaded: true });
    }
  },

  drinkCup: async (uid: string) => {
    const { cupsDrank, targetMl, bonusClaimed } = get();
    const targetCups = Math.max(Math.round(targetMl / ML_PER_CUP), 7);
    if (cupsDrank >= targetCups) {
      return { isFull: true };
    }

    const newCount = cupsDrank + 1;
    const isNowFull = newCount >= targetCups;
    const nowTimestamp = Date.now();
    let shouldClaimBonus = false;

    if (isNowFull && !bonusClaimed) {
      shouldClaimBonus = true;
    }

    set({
      cupsDrank: newCount,
      currentMl: newCount * ML_PER_CUP,
      targetMl,
      completedToday: isNowFull,
      bonusClaimed: bonusClaimed || shouldClaimBonus,
      lastDrinkTimestamp: nowTimestamp,
    });

    // Otorgar +10 XP de Vitalidad por cada vaso
    await useUserStore.getState().addXP(10, 'vitality');

    if (shouldClaimBonus) {
      // Bono de +50 XP al completar la meta de 8 vasos (2L)
      await useUserStore.getState().addXP(50, 'vitality');
      Haptics.success();
    } else {
      Haptics.light();
    }

    // Persistir estado del día
    try {
      const todayKey = getTodayDateKey();
      const storageKey = `@fitrise_water_${todayKey}_${uid}`;
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          cupsDrank: newCount,
          bonusClaimed: bonusClaimed || shouldClaimBonus,
          lastDrinkTimestamp: nowTimestamp,
        })
      );
    } catch (e) {
      console.warn('Error persisting water intake:', e);
    }

    return { isFull: isNowFull };
  },

  undoCup: async (uid: string) => {
    const { cupsDrank, bonusClaimed } = get();
    if (cupsDrank <= 0) return;

    const newCount = cupsDrank - 1;
    set({
      cupsDrank: newCount,
      currentMl: newCount * ML_PER_CUP,
      targetMl: TARGET_WATER_CUPS * ML_PER_CUP,
      completedToday: newCount >= TARGET_WATER_CUPS,
    });
    Haptics.light();

    try {
      const todayKey = getTodayDateKey();
      const storageKey = `@fitrise_water_${todayKey}_${uid}`;
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          cupsDrank: newCount,
          bonusClaimed: newCount >= TARGET_WATER_CUPS ? bonusClaimed : false,
          lastDrinkTimestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Error updating water after undo:', e);
    }
  },

  resetWater: () => {
    set({
      cupsDrank: 0,
      completedToday: false,
      bonusClaimed: false,
      lastDrinkTimestamp: null,
      isLoaded: false,
    });
  },

  isWaterFullToday: () => {
    return get().completedToday;
  },
}));
