import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MAX_DAILY_MANA = 5;

const STORAGE_KEYS = {
  PERSONAL_KEY: '@fitrise_cortex_personal_api_key',
  DAILY_MANA: '@fitrise_cortex_daily_mana',
  LAST_DATE: '@fitrise_cortex_last_mana_date',
};

// Clave central por defecto del desarrollador
export const DEFAULT_DEVELOPER_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

interface CortexEnergyState {
  personalApiKey: string | null;
  dailyManaRemaining: number;
  maxDailyMana: number;
  lastManaResetDate: string;
  isUnlimited: boolean;
  isLoaded: boolean;

  initialize: () => Promise<void>;
  consumeMana: () => Promise<{ success: boolean; isUnlimited: boolean; remaining: number }>;
  refundMana: () => Promise<void>;
  setPersonalApiKey: (key: string) => Promise<boolean>;
  removePersonalApiKey: () => Promise<void>;
  getActiveApiKey: () => string;
}

export const useCortexEnergyStore = create<CortexEnergyState>((set, get) => ({
  personalApiKey: null,
  dailyManaRemaining: MAX_DAILY_MANA,
  maxDailyMana: MAX_DAILY_MANA,
  lastManaResetDate: '',
  isUnlimited: false,
  isLoaded: false,

  initialize: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [savedKey, savedMana, savedDate] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PERSONAL_KEY),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_MANA),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_DATE),
      ]);

      const hasPersonalKey = !!(savedKey && savedKey.trim().length > 10);
      let currentMana = MAX_DAILY_MANA;

      if (savedDate === today && savedMana !== null) {
        currentMana = Math.max(0, parseInt(savedMana, 10));
      } else {
        // Nuevo día: recargar los 5 puntos de maná neural automáticamente
        currentMana = MAX_DAILY_MANA;
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.DAILY_MANA, String(MAX_DAILY_MANA)),
          AsyncStorage.setItem(STORAGE_KEYS.LAST_DATE, today),
        ]);
      }

      set({
        personalApiKey: hasPersonalKey ? savedKey!.trim() : null,
        isUnlimited: hasPersonalKey,
        dailyManaRemaining: currentMana,
        lastManaResetDate: today,
        isLoaded: true,
      });
    } catch (err) {
      console.warn('Error inicializando energía CORTEX:', err);
      set({ isLoaded: true });
    }
  },

  consumeMana: async () => {
    const state = get();
    // Si tiene su propia API Key, las consultas son 100% ilimitadas
    if (state.isUnlimited && state.personalApiKey) {
      return { success: true, isUnlimited: true, remaining: 999 };
    }

    const today = new Date().toISOString().split('T')[0];
    let currentMana = state.dailyManaRemaining;

    // Verificar si cambió el día
    if (state.lastManaResetDate !== today) {
      currentMana = MAX_DAILY_MANA;
    }

    if (currentMana <= 0) {
      return { success: false, isUnlimited: false, remaining: 0 };
    }

    const newMana = currentMana - 1;
    set({ dailyManaRemaining: newMana, lastManaResetDate: today });

    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.DAILY_MANA, String(newMana)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_DATE, today),
      ]);
    } catch (err) {
      console.warn('Error persistiendo maná CORTEX:', err);
    }

    return { success: true, isUnlimited: false, remaining: newMana };
  },

  refundMana: async () => {
    const state = get();
    if (state.isUnlimited) return;
    const restored = Math.min(state.dailyManaRemaining + 1, MAX_DAILY_MANA);
    set({ dailyManaRemaining: restored });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_MANA, String(restored));
    } catch (err) {
      console.warn('Error reembolsando maná CORTEX:', err);
    }
  },

  setPersonalApiKey: async (key: string) => {
    const cleaned = key.trim();
    if (!cleaned || cleaned.length < 15) {
      return false;
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PERSONAL_KEY, cleaned);
      set({
        personalApiKey: cleaned,
        isUnlimited: true,
      });
      return true;
    } catch (err) {
      console.error('Error guardando API key personal:', err);
      return false;
    }
  },

  removePersonalApiKey: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PERSONAL_KEY);
      set({
        personalApiKey: null,
        isUnlimited: false,
      });
    } catch (err) {
      console.error('Error eliminando API key personal:', err);
    }
  },

  getActiveApiKey: () => {
    const { personalApiKey, isUnlimited } = get();
    if (isUnlimited && personalApiKey && personalApiKey.trim().length > 10) {
      return personalApiKey.trim();
    }
    return DEFAULT_DEVELOPER_KEY;
  },
}));
