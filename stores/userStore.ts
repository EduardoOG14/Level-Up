import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLevelByXP, getRankByXP } from '../constants/ranks';

export interface UserStats {
  strength: number;
  agility: number;
  vitality: number;
  discipline: number;
  mind: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  avatar?: string;
  // Gamification
  totalXP: number;
  level: number;
  rank: string;
  stats: UserStats;
  streak: number;
  lastActiveDate: string;
  // Fitness profile
  goals: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  age?: number;
  weight?: number;
  height?: number;
  // Progress
  workoutsCompleted: number;
  questsCompleted: number;
  // Dates
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = '@fitrise_local_user';

interface UserStore {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  loadLocalUser: () => Promise<UserProfile | null>;
  addXP: (amount: number, statKey?: keyof UserStats) => Promise<void>;
  updateStreak: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetUser: () => Promise<void>;
}

export const DEFAULT_STATS: UserStats = {
  strength: 1,
  agility: 1,
  vitality: 1,
  discipline: 1,
  mind: 1,
};

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user)).catch(() => {});
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  resetUser: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadLocalUser: async () => {
    try {
      set({ isLoading: true });
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const userData: UserProfile = JSON.parse(raw);
        set({ user: userData, isAuthenticated: true, isLoading: false });
        return userData;
      }
    } catch (e) {
      console.warn('Error cargando usuario local:', e);
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
    return null;
  },

  addXP: async (amount: number, statKey?: keyof UserStats) => {
    const { user } = get();
    if (!user) return;

    const newXP = Math.max(0, user.totalXP + amount);
    const newLevel = getLevelByXP(newXP);
    const newRank = getRankByXP(newXP);

    const updatedStats = { ...user.stats };
    if (statKey) {
      if (amount > 0) {
        updatedStats[statKey] = Math.min((updatedStats[statKey] || 1) + 1, 999);
      } else if (amount < 0) {
        updatedStats[statKey] = Math.max(1, (updatedStats[statKey] || 1) - 1);
      }
    }

    const updates: Partial<UserProfile> = {
      totalXP: newXP,
      level: newLevel,
      rank: newRank.key,
      stats: updatedStats,
      updatedAt: new Date().toISOString(),
    };

    const newUser = { ...user, ...updates };
    set({ user: newUser });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch (error) {
      console.error('Error guardando XP local:', error);
    }
  },

  updateStreak: async () => {
    const { user } = get();
    if (!user) return;

    const today = new Date().toDateString();
    const lastActive = user.lastActiveDate;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let newStreak = user.streak;
    if (lastActive === today) return; // Ya actualizado hoy
    if (lastActive === yesterday) {
      newStreak = user.streak + 1; // Mantiene racha
    } else {
      newStreak = 1; // Reinicia racha
    }

    const updates = {
      streak: newStreak,
      lastActiveDate: today,
      updatedAt: new Date().toISOString(),
    };

    const newUser = { ...user, ...updates };
    set({ user: newUser });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch (error) {
      console.error('Error guardando racha local:', error);
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { user } = get();
    if (!user) return;
    const newUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    set({ user: newUser });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch (error) {
      console.error('Error actualizando perfil local:', error);
    }
  },
}));

export async function createUserProfile(uid?: string, data?: Partial<UserProfile>): Promise<UserProfile> {
  const finalUid = uid || `hunter_${Date.now()}`;
  const profile: UserProfile = {
    uid: finalUid,
    name: data?.name || 'Cazador',
    email: '',
    totalXP: 0,
    level: 1,
    rank: 'E',
    stats: DEFAULT_STATS,
    streak: 0,
    lastActiveDate: '',
    goals: data?.goals || [],
    fitnessLevel: data?.fitnessLevel || 'beginner',
    equipment: data?.equipment || ['none'],
    age: data?.age,
    weight: data?.weight,
    height: data?.height,
    workoutsCompleted: 0,
    questsCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn('Error guardando perfil localmente:', error);
  }

  useUserStore.getState().setUser(profile);
  return profile;
}
