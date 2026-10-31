import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './userStore';
import { Haptics } from '../services/haptics';
import { SoundEffects } from '../services/soundEffects';

interface PenaltyStore {
  isPenaltyActive: boolean;
  penaltyDateKey: string;
  isLoaded: boolean;
  checkAndTriggerPenalty: (uid: string, lastActiveDate: string, streak: number) => Promise<boolean>;
  resolvePenalty: (uid: string) => Promise<void>;
  activateManualPenaltyForToday: (uid: string) => Promise<void>;
}

const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const usePenaltyStore = create<PenaltyStore>((set, get) => ({
  isPenaltyActive: false,
  penaltyDateKey: '',
  isLoaded: false,

  checkAndTriggerPenalty: async (uid, lastActiveDate, streak) => {
    const todayKey = getTodayDateKey();
    const penaltyStorageKey = `@fitrise_penalty_${uid}_${todayKey}`;

    try {
      // 1. Si ya está guardada la penalización para hoy
      const stored = await AsyncStorage.getItem(penaltyStorageKey);
      if (stored === 'active') {
        set({ isPenaltyActive: true, penaltyDateKey: todayKey, isLoaded: true });
        return true;
      } else if (stored === 'resolved') {
        set({ isPenaltyActive: false, penaltyDateKey: todayKey, isLoaded: true });
        return false;
      }

      // 2. Verificar si el usuario no estuvo activo ayer y tiene una racha que proteger
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      // Si no estuvo activo hoy ni ayer, pero tenía racha previa > 0
      const missedDay = lastActiveDate && lastActiveDate !== today && lastActiveDate !== yesterday;

      if (missedDay && streak > 0) {
        await AsyncStorage.setItem(penaltyStorageKey, 'active');
        set({ isPenaltyActive: true, penaltyDateKey: todayKey, isLoaded: true });
        SoundEffects.playAlert();
        Haptics.heavy();
        return true;
      }

      set({ isPenaltyActive: false, penaltyDateKey: todayKey, isLoaded: true });
      return false;
    } catch {
      set({ isPenaltyActive: false, isLoaded: true });
      return false;
    }
  },

  resolvePenalty: async (uid) => {
    const todayKey = getTodayDateKey();
    const penaltyStorageKey = `@fitrise_penalty_${uid}_${todayKey}`;

    try {
      await AsyncStorage.setItem(penaltyStorageKey, 'resolved');
      set({ isPenaltyActive: false });

      // Proteger y extender la racha del cazador
      const currentUser = useUserStore.getState().user;
      if (currentUser) {
        const today = new Date().toDateString();
        await useUserStore.getState().updateProfile({
          streak: Math.max(currentUser.streak, 1),
          lastActiveDate: today,
        });
      }

      SoundEffects.playLevelUp();
      Haptics.triumph();
    } catch (err) {
      console.warn('Error resolviendo zona de castigo:', err);
    }
  },

  activateManualPenaltyForToday: async (uid) => {
    const todayKey = getTodayDateKey();
    const penaltyStorageKey = `@fitrise_penalty_${uid}_${todayKey}`;
    await AsyncStorage.setItem(penaltyStorageKey, 'active');
    set({ isPenaltyActive: true, penaltyDateKey: todayKey });
    SoundEffects.playAlert();
    Haptics.heavy();
  },
}));
