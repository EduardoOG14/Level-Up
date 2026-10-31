import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './userStore';

export interface WeightLog {
  id: string;
  date: string; // ISO string
  dateLabel: string;
  weight: number;
  change?: number; // relative to previous log
}

export interface CircuitLog {
  id: string;
  date: string; // ISO string
  title: string;
  type: 'plan' | 'dungeon';
  xpReward: number;
}

export interface WeekDayStatus {
  dayName: string; // 'Lun', 'Mar', etc.
  dateKey: string; // 'YYYY-MM-DD'
  completed: boolean;
  isToday: boolean;
}

interface ProgressStore {
  weightLogs: WeightLog[];
  circuitLogs: CircuitLog[];
  completedQuestDays: string[]; // ['YYYY-MM-DD', ...]
  lastCheckinTimestamp: number | null;
  isLoaded: boolean;

  // Acciones
  loadProgress: (uid: string) => Promise<void>;
  logWeight: (weight: number, uid: string) => Promise<{ change: number; isFirst: boolean }>;
  logCircuit: (title: string, type: 'plan' | 'dungeon', xpReward: number, uid: string) => Promise<void>;
  recordDailyQuestsCompleted: (uid: string) => Promise<void>;
  isWeeklyCheckinDue: () => boolean;
  getWeeklyCircuitsCount: () => number;
  getWeeklyQuestDaysCount: () => number;
  getWeeklyDaysBreakdown: () => WeekDayStatus[];
  resetProgress: (uid?: string) => Promise<void>;
}

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getStartOfWeekTimestamp(): number {
  const now = new Date();
  const day = now.getDay(); // 0 es Domingo, 1 es Lunes...
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajustar a Lunes
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  weightLogs: [],
  circuitLogs: [],
  completedQuestDays: [],
  lastCheckinTimestamp: null,
  isLoaded: false,

  loadProgress: async (uid: string) => {
    try {
      const storageKey = `@fitrise_progress_${uid}`;
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          weightLogs: data.weightLogs || [],
          circuitLogs: data.circuitLogs || [],
          completedQuestDays: data.completedQuestDays || [],
          lastCheckinTimestamp: data.lastCheckinTimestamp || null,
          isLoaded: true,
        });
      } else {
        // Inicializar con el peso actual del perfil si existe
        const user = useUserStore.getState().user;
        const initialLogs: WeightLog[] = user?.weight
          ? [
              {
                id: 'log_init',
                date: new Date().toISOString(),
                dateLabel: 'Inicial',
                weight: user.weight,
                change: 0,
              },
            ]
          : [];

        set({
          weightLogs: initialLogs,
          circuitLogs: [],
          completedQuestDays: [],
          lastCheckinTimestamp: Date.now(),
          isLoaded: true,
        });
      }
    } catch (err) {
      console.warn('Error loading progress data:', err);
      set({ isLoaded: true });
    }
  },

  logWeight: async (newWeight: number, uid: string) => {
    const { weightLogs } = get();
    const now = new Date();
    const dateLabel = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

    const prevWeight = weightLogs.length > 0 ? weightLogs[0].weight : newWeight;
    const change = Number((newWeight - prevWeight).toFixed(1));
    const isFirst = weightLogs.length === 0;

    const newLog: WeightLog = {
      id: `w_${Date.now()}`,
      date: now.toISOString(),
      dateLabel,
      weight: newWeight,
      change,
    };

    const updatedLogs = [newLog, ...weightLogs];
    const nowTimestamp = now.getTime();

    set({
      weightLogs: updatedLogs,
      lastCheckinTimestamp: nowTimestamp,
    });

    // Actualizar también en el perfil del usuario
    await useUserStore.getState().updateProfile({ weight: newWeight });
    // Bono por calibración semanal de peso (+50 XP) solo si es una calibración posterior
    if (!isFirst && weightLogs.length > 0) {
      await useUserStore.getState().addXP(50, 'discipline');
    }

    // Persistir en AsyncStorage
    try {
      const storageKey = `@fitrise_progress_${uid}`;
      const current = get();
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          weightLogs: updatedLogs,
          circuitLogs: current.circuitLogs,
          completedQuestDays: current.completedQuestDays,
          lastCheckinTimestamp: nowTimestamp,
        })
      );
    } catch (err) {
      console.warn('Error persisting weight log:', err);
    }

    return { change, isFirst };
  },

  logCircuit: async (title: string, type: 'plan' | 'dungeon', xpReward: number, uid: string) => {
    const { circuitLogs } = get();
    const newCircuit: CircuitLog = {
      id: `c_${Date.now()}`,
      date: new Date().toISOString(),
      title,
      type,
      xpReward,
    };

    const updated = [newCircuit, ...circuitLogs];
    set({ circuitLogs: updated });

    try {
      const storageKey = `@fitrise_progress_${uid}`;
      const current = get();
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          weightLogs: current.weightLogs,
          circuitLogs: updated,
          completedQuestDays: current.completedQuestDays,
          lastCheckinTimestamp: current.lastCheckinTimestamp,
        })
      );
    } catch (err) {
      console.warn('Error persisting circuit log:', err);
    }
  },

  recordDailyQuestsCompleted: async (uid: string) => {
    const { completedQuestDays } = get();
    const today = getTodayKey();
    if (completedQuestDays.includes(today)) return;

    const updated = [...completedQuestDays, today];
    set({ completedQuestDays: updated });

    try {
      const storageKey = `@fitrise_progress_${uid}`;
      const current = get();
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          weightLogs: current.weightLogs,
          circuitLogs: current.circuitLogs,
          completedQuestDays: updated,
          lastCheckinTimestamp: current.lastCheckinTimestamp,
        })
      );
    } catch (err) {
      console.warn('Error persisting daily quest day:', err);
    }
  },

  isWeeklyCheckinDue: () => {
    const { lastCheckinTimestamp } = get();
    if (!lastCheckinTimestamp) return false;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - lastCheckinTimestamp >= sevenDaysMs;
  },

  getWeeklyCircuitsCount: () => {
    const { circuitLogs } = get();
    const mondayTs = getStartOfWeekTimestamp();
    return circuitLogs.filter((c) => new Date(c.date).getTime() >= mondayTs).length;
  },

  getWeeklyQuestDaysCount: () => {
    const { completedQuestDays } = get();
    const breakdown = get().getWeeklyDaysBreakdown();
    return breakdown.filter((b) => b.completed).length;
  },

  getWeeklyDaysBreakdown: () => {
    const { completedQuestDays } = get();
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);

    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const todayKey = getTodayKey();

    return dayLabels.map((dayName, index) => {
      const d = new Date(now.getFullYear(), now.getMonth(), diffToMonday + index);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        dayName,
        dateKey,
        completed: completedQuestDays.includes(dateKey),
        isToday: dateKey === todayKey,
      };
    });
  },

  resetProgress: async (uid?: string) => {
    set({
      weightLogs: [],
      circuitLogs: [],
      completedQuestDays: [],
      lastCheckinTimestamp: null,
      isLoaded: false,
    });
    if (uid) {
      try {
        await AsyncStorage.removeItem(`@fitrise_progress_${uid}`);
      } catch (err) {
        console.warn('Error clearing progress storage:', err);
      }
    }
  },
}));
