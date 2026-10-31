import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type SmartwatchBrand,
  type SmartwatchMetrics,
  type SmartwatchAdaptiveWorkout,
  type SmartwatchCongratulation,
  SMARTWATCH_BRANDS,
} from '../constants/smartwatch';
import { SmartwatchEngine } from '../services/smartwatchEngine';
import { SoundEffects } from '../services/soundEffects';
import { Haptics } from '../services/haptics';

const STORAGE_KEY = '@fitrise_smartwatch_v2';

export interface SmartwatchState {
  brand: SmartwatchBrand | null;
  deviceName: string | null;
  isConnected: boolean;
  isSyncing: boolean;
  autoSync: boolean;
  metrics: SmartwatchMetrics;
  adaptiveWorkout: SmartwatchAdaptiveWorkout;
  congratulations: SmartwatchCongratulation[];
  activeCongratulationModal: SmartwatchCongratulation | null;

  // Actions
  initialize: () => Promise<void>;
  connectSmartwatch: (brand: SmartwatchBrand, deviceName: string) => Promise<void>;
  disconnectSmartwatch: () => Promise<void>;
  syncSmartwatch: (customMetrics?: Partial<SmartwatchMetrics>) => Promise<void>;
  simulatePreset: (preset: 'peak_performance' | 'fatigue_low_sleep' | 'sedentary_steps' | 'extreme_calorie_burn') => Promise<void>;
  dismissCongratulationModal: () => void;
  playCongratulationVoice: (id: string) => Promise<void>;
  toggleAutoSync: () => Promise<void>;
}

const DEFAULT_BRAND: SmartwatchBrand = 'samsung';
const INITIAL_METRICS = SmartwatchEngine.getInitialMetrics(DEFAULT_BRAND);
const INITIAL_WORKOUT = SmartwatchEngine.evaluateAdaptiveWorkout(INITIAL_METRICS, DEFAULT_BRAND);

export const useSmartwatchStore = create<SmartwatchState>((set, get) => ({
  brand: null,
  deviceName: null,
  isConnected: false,
  isSyncing: false,
  autoSync: true,
  metrics: INITIAL_METRICS,
  adaptiveWorkout: INITIAL_WORKOUT,
  congratulations: [],
  activeCongratulationModal: null,

  initialize: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        if (data.brand && SMARTWATCH_BRANDS[data.brand as SmartwatchBrand]) {
          const metrics = data.metrics || SmartwatchEngine.getInitialMetrics(data.brand);
          const adaptiveWorkout = SmartwatchEngine.evaluateAdaptiveWorkout(metrics, data.brand);

          set({
            brand: data.brand,
            deviceName: data.deviceName || SMARTWATCH_BRANDS[data.brand as SmartwatchBrand].popularModels[0],
            isConnected: !!data.isConnected,
            autoSync: data.autoSync ?? true,
            metrics,
            adaptiveWorkout,
            congratulations: data.congratulations || [],
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Error inicializando SmartwatchStore:', e);
    }
  },

  connectSmartwatch: async (brand: SmartwatchBrand, deviceName: string) => {
    Haptics.success();
    SoundEffects.playChime();

    const metrics = SmartwatchEngine.getInitialMetrics(brand);
    const adaptiveWorkout = SmartwatchEngine.evaluateAdaptiveWorkout(metrics, brand);
    const newCongrats = SmartwatchEngine.evaluateCongratulations(metrics, brand, []);

    const updatedCongrats = newCongrats;

    const newState = {
      brand,
      deviceName,
      isConnected: true,
      metrics,
      adaptiveWorkout,
      congratulations: updatedCongrats,
      activeCongratulationModal: newCongrats.length > 0 ? newCongrats[0] : null,
    };

    set(newState);

    if (newCongrats.length > 0) {
      SmartwatchEngine.speakCongratulation(newCongrats[0]);
    }

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          brand,
          deviceName,
          isConnected: true,
          autoSync: get().autoSync,
          metrics,
          congratulations: updatedCongrats,
        })
      );
    } catch (e) {
      console.warn('Error guardando smartwatch en storage:', e);
    }
  },

  disconnectSmartwatch: async () => {
    Haptics.light();
    set({
      brand: null,
      deviceName: null,
      isConnected: false,
      congratulations: [],
      activeCongratulationModal: null,
    });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Error desconectando smartwatch:', e);
    }
  },

  syncSmartwatch: async (customMetrics?: Partial<SmartwatchMetrics>) => {
    const { brand, deviceName, isConnected, metrics: currentMetrics, congratulations: prevCongrats } = get();
    if (!isConnected || !brand) return;

    set({ isSyncing: true });
    Haptics.medium();

    // Simula una breve latencia de protocolo BLE / HealthKit de 800ms
    await new Promise((resolve) => setTimeout(resolve, 800));

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Incremento dinámico de pasos/calorías si no se pasan métricas personalizadas
    const newMetrics: SmartwatchMetrics = {
      ...currentMetrics,
      ...customMetrics,
      lastSyncTime: timeStr,
      steps: customMetrics?.steps !== undefined ? customMetrics.steps : currentMetrics.steps + Math.floor(Math.random() * 80 + 20),
      activeCalories: customMetrics?.activeCalories !== undefined ? customMetrics.activeCalories : currentMetrics.activeCalories + Math.floor(Math.random() * 5 + 1),
    };

    const newAdaptiveWorkout = SmartwatchEngine.evaluateAdaptiveWorkout(newMetrics, brand);
    const newMilestoneCongrats = SmartwatchEngine.evaluateCongratulations(newMetrics, brand, prevCongrats);

    const mergedCongrats = [...newMilestoneCongrats, ...prevCongrats];

    set({
      isSyncing: false,
      metrics: newMetrics,
      adaptiveWorkout: newAdaptiveWorkout,
      congratulations: mergedCongrats,
      activeCongratulationModal: newMilestoneCongrats.length > 0 ? newMilestoneCongrats[0] : null,
    });

    SoundEffects.playNotice();
    Haptics.success();

    if (newMilestoneCongrats.length > 0) {
      SmartwatchEngine.speakCongratulation(newMilestoneCongrats[0]);
    }

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          brand,
          deviceName,
          isConnected: true,
          autoSync: get().autoSync,
          metrics: newMetrics,
          congratulations: mergedCongrats,
        })
      );
    } catch (e) {
      console.warn('Error guardando sincronización de smartwatch:', e);
    }
  },

  simulatePreset: async (preset) => {
    const { brand } = get();
    const activeBrand = brand || 'samsung';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let presetMetrics: Partial<SmartwatchMetrics> = {};

    switch (preset) {
      case 'peak_performance':
        presetMetrics = {
          steps: 10420,
          activeCalories: 560,
          currentHeartRate: 72,
          restingHeartRate: 58,
          maxHeartRateToday: 155,
          sleepHours: 8.2,
          sleepQuality: 94,
          readinessScore: 95,
          stressLevel: 'low',
          lastSyncTime: timeStr,
        };
        break;
      case 'fatigue_low_sleep':
        presetMetrics = {
          steps: 4200,
          activeCalories: 280,
          currentHeartRate: 84,
          restingHeartRate: 78,
          maxHeartRateToday: 142,
          sleepHours: 5.1,
          sleepQuality: 62,
          readinessScore: 58,
          stressLevel: 'high',
          lastSyncTime: timeStr,
        };
        break;
      case 'sedentary_steps':
        presetMetrics = {
          steps: 2310,
          activeCalories: 195,
          currentHeartRate: 71,
          restingHeartRate: 63,
          maxHeartRateToday: 130,
          sleepHours: 7.5,
          sleepQuality: 82,
          readinessScore: 78,
          stressLevel: 'low',
          lastSyncTime: timeStr,
        };
        break;
      case 'extreme_calorie_burn':
        presetMetrics = {
          steps: 12890,
          activeCalories: 680,
          currentHeartRate: 88,
          restingHeartRate: 60,
          maxHeartRateToday: 168,
          sleepHours: 7.8,
          sleepQuality: 88,
          readinessScore: 89,
          stressLevel: 'moderate',
          lastSyncTime: timeStr,
        };
        break;
    }

    await get().syncSmartwatch(presetMetrics);
  },

  dismissCongratulationModal: () => {
    set({ activeCongratulationModal: null });
  },

  playCongratulationVoice: async (id: string) => {
    const { congratulations } = get();
    const item = congratulations.find((c) => c.id === id);
    if (item) {
      await SmartwatchEngine.speakCongratulation(item);
    }
  },

  toggleAutoSync: async () => {
    const current = get().autoSync;
    const next = !current;
    set({ autoSync: next });
    Haptics.light();
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        data.autoSync = next;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Error guardando autoSync:', e);
    }
  },
}));
