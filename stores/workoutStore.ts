import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WorkoutSet {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  weight?: number;
  duration?: number; // seconds
}

export interface CompletedWorkout {
  id?: string;
  uid: string;
  title: string;
  exercises: WorkoutSet[];
  duration: number; // minutes
  totalXP: number;
  date: string;
  notes?: string;
}

const STORAGE_KEY = '@fitrise_workout_history';

interface WorkoutStore {
  currentWorkout: Partial<CompletedWorkout> | null;
  workoutHistory: CompletedWorkout[];
  isWorkoutActive: boolean;
  workoutStartTime: number | null;
  setCurrentWorkout: (workout: Partial<CompletedWorkout> | null) => void;
  startWorkout: (title: string) => void;
  endWorkout: () => void;
  saveWorkout: (workout: CompletedWorkout) => Promise<void>;
  loadWorkoutHistory: (uid?: string) => Promise<void>;
  resetWorkoutStore: () => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  currentWorkout: null,
  workoutHistory: [],
  isWorkoutActive: false,
  workoutStartTime: null,

  setCurrentWorkout: (workout) => set({ currentWorkout: workout }),

  startWorkout: (title) => set({
    isWorkoutActive: true,
    workoutStartTime: Date.now(),
    currentWorkout: { title, exercises: [] },
  }),

  endWorkout: () => set({
    isWorkoutActive: false,
    workoutStartTime: null,
    currentWorkout: null,
  }),

  saveWorkout: async (workout) => {
    try {
      const saved: CompletedWorkout = {
        ...workout,
        id: workout.id || `workout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };
      const updatedHistory = [saved, ...get().workoutHistory];
      set({ workoutHistory: updatedHistory });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error guardando entrenamiento localmente:', error);
      throw error;
    }
  },

  loadWorkoutHistory: async (_uid?: string) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const history: CompletedWorkout[] = JSON.parse(raw);
        set({ workoutHistory: history });
      }
    } catch (error) {
      console.error('Error cargando historial de entrenamientos locales:', error);
    }
  },

  resetWorkoutStore: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({
      currentWorkout: null,
      workoutHistory: [],
      isWorkoutActive: false,
      workoutStartTime: null,
    });
  },
}));
