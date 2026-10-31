import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HUNTER_TITLES, type HunterTitle, getTitleById } from '../constants/titles';

interface TitleStore {
  currentTitle: HunterTitle;
  isLoaded: boolean;
  assignedWeekKey: string;
  loadAndEvaluateTitle: (
    uid: string,
    stats: {
      weeklyCircuits: number;
      weeklyQuestDays: number;
      bossDefeated: boolean;
      waterFullToday?: boolean;
    }
  ) => Promise<HunterTitle>;
}

const getWeekKey = (): string => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${weekNumber}`;
};

export const useTitleStore = create<TitleStore>((set, get) => ({
  currentTitle: HUNTER_TITLES[HUNTER_TITLES.length - 1], // Iniciado por defecto
  isLoaded: false,
  assignedWeekKey: '',

  loadAndEvaluateTitle: async (uid, stats) => {
    const weekKey = getWeekKey();
    const titleKey = `@fitrise_assigned_title_${uid}`;
    const weekStorageKey = `@fitrise_title_week_${uid}`;

    try {
      const storedWeek = await AsyncStorage.getItem(weekStorageKey);
      const storedTitleId = await AsyncStorage.getItem(titleKey);

      // Evaluar qué título le corresponde según sus logros semanales
      let eligibleTitle = HUNTER_TITLES[HUNTER_TITLES.length - 1]; // Iniciado por defecto

      if (stats.bossDefeated && stats.weeklyCircuits >= 3) {
        eligibleTitle = getTitleById('monarch_shadows');
      } else if (stats.bossDefeated) {
        eligibleTitle = getTitleById('boss_slayer');
      } else if (stats.weeklyCircuits >= 4) {
        eligibleTitle = getTitleById('iron_titan');
      } else if (stats.weeklyQuestDays >= 5) {
        eligibleTitle = getTitleById('perfect_discipline');
      } else if (stats.weeklyCircuits >= 2) {
        eligibleTitle = getTitleById('shadow_soldier');
      } else if (stats.waterFullToday) {
        eligibleTitle = getTitleById('pure_vitality');
      }

      // Si es una nueva semana o el nuevo título tiene mayor o igual prioridad, se actualiza
      if (storedWeek !== weekKey || !storedTitleId) {
        await AsyncStorage.setItem(weekStorageKey, weekKey);
        await AsyncStorage.setItem(titleKey, eligibleTitle.id);
        set({ currentTitle: eligibleTitle, isLoaded: true, assignedWeekKey: weekKey });
        return eligibleTitle;
      } else {
        // En la misma semana, si logró un título de mayor prioridad, elevarlo de inmediato
        const currentSaved = getTitleById(storedTitleId);
        if (eligibleTitle.priority > currentSaved.priority) {
          await AsyncStorage.setItem(titleKey, eligibleTitle.id);
          set({ currentTitle: eligibleTitle, isLoaded: true, assignedWeekKey: weekKey });
          return eligibleTitle;
        } else {
          set({ currentTitle: currentSaved, isLoaded: true, assignedWeekKey: weekKey });
          return currentSaved;
        }
      }
    } catch {
      const fallback = HUNTER_TITLES[HUNTER_TITLES.length - 1];
      set({ currentTitle: fallback, isLoaded: true, assignedWeekKey: weekKey });
      return fallback;
    }
  },
}));
