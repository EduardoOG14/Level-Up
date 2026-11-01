import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Haptics } from '../services/haptics';

export interface ExerciseSetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  timestamp: number;
  completed: boolean;
}

export interface ExerciseHistoryRecord {
  exerciseId: string;
  lastWeightKg: number;
  lastReps: number;
  bestWeightKg: number;
  bestReps: number;
  history: {
    date: string;
    sets: ExerciseSetLog[];
  }[];
}

interface LogbookStore {
  logsByExercise: Record<string, ExerciseHistoryRecord>;
  isLoaded: boolean;
  initialize: (uid: string) => Promise<void>;
  getLastSession: (exerciseId: string) => { weightKg: number; reps: number } | null;
  saveSetLog: (exerciseId: string, setNumber: number, weightKg: number, reps: number, uid: string) => Promise<void>;
  getExerciseStats: (exerciseId: string) => ExerciseHistoryRecord | undefined;
}

const STORAGE_KEY = (uid: string) => `@fitrise_exercise_logbook_${uid}`;

export const useLogbookStore = create<LogbookStore>((set, get) => ({
  logsByExercise: {},
  isLoaded: false,

  initialize: async (uid: string) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY(uid));
      if (raw) {
        set({ logsByExercise: JSON.parse(raw), isLoaded: true });
      } else {
        set({ logsByExercise: {}, isLoaded: true });
      }
    } catch (e) {
      console.warn('Error inicializando LogbookStore:', e);
      set({ isLoaded: true });
    }
  },

  getLastSession: (exerciseId: string) => {
    const record = get().logsByExercise[exerciseId];
    if (!record) return null;
    return {
      weightKg: record.lastWeightKg || 0,
      reps: record.lastReps || 0,
    };
  },

  saveSetLog: async (exerciseId: string, setNumber: number, weightKg: number, reps: number, uid: string) => {
    const { logsByExercise } = get();
    const existing = logsByExercise[exerciseId] || {
      exerciseId,
      lastWeightKg: 0,
      lastReps: 0,
      bestWeightKg: 0,
      bestReps: 0,
      history: [],
    };

    const todayStr = new Date().toISOString().slice(0, 10);
    const updatedHistory = [...existing.history];
    let todayEntry = updatedHistory.find((h) => h.date === todayStr);

    if (!todayEntry) {
      todayEntry = { date: todayStr, sets: [] };
      updatedHistory.unshift(todayEntry);
    }

    // Actualizar o agregar el set
    const setIndex = todayEntry.sets.findIndex((s) => s.setNumber === setNumber);
    const setLog: ExerciseSetLog = {
      setNumber,
      weightKg,
      reps,
      timestamp: Date.now(),
      completed: true,
    };

    if (setIndex >= 0) {
      todayEntry.sets[setIndex] = setLog;
    } else {
      todayEntry.sets.push(setLog);
    }

    const newRecord: ExerciseHistoryRecord = {
      exerciseId,
      lastWeightKg: weightKg,
      lastReps: reps,
      bestWeightKg: Math.max(existing.bestWeightKg, weightKg),
      bestReps: Math.max(existing.bestReps, reps),
      history: updatedHistory.slice(0, 30), // conservar 30 sesiones
    };

    const updatedMap = {
      ...logsByExercise,
      [exerciseId]: newRecord,
    };

    set({ logsByExercise: updatedMap });
    Haptics.light();

    try {
      await AsyncStorage.setItem(STORAGE_KEY(uid), JSON.stringify(updatedMap));
    } catch (e) {
      console.warn('Error guardando en LogbookStore:', e);
    }
  },

  getExerciseStats: (exerciseId: string) => {
    return get().logsByExercise[exerciseId];
  },
}));
