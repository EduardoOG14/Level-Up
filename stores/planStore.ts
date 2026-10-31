import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRAINING_PLANS, type TrainingPlan } from '../constants/plans';
import {
  scheduleWorkoutAlarm,
  scheduleHydrationReminders,
  scheduleQuestsReminder,
  cancelNotificationsByCategory,
} from '../services/notifications';
import { useUserStore } from './userStore';

export interface AlarmSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  days: number[]; // 0 = Domingo, 1 = Lunes, etc.
  hydrationReminder: boolean;
  questsReminder: boolean;
}

const STORAGE_KEYS = {
  ACTIVE_PLAN: '@fitrise_active_plan_id',
  COMPLETED_DAYS: '@fitrise_completed_plan_days',
  ALARM_SETTINGS: '@fitrise_plan_alarm_settings',
};

interface PlanStore {
  activePlanId: string;
  completedDayNumbers: number[];
  alarmSettings: AlarmSettings;
  isLoaded: boolean;
  initialize: () => Promise<void>;
  setActivePlan: (planId: string) => Promise<void>;
  completePlanDay: (dayNumber: number) => Promise<void>;
  updateAlarmSettings: (settings: Partial<AlarmSettings>) => Promise<void>;
  getActivePlan: () => TrainingPlan | undefined;
  resetPlan: () => Promise<void>;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  activePlanId: 'daily_beginner_foundation',
  completedDayNumbers: [],
  isLoaded: false,
  alarmSettings: {
    enabled: true,
    hour: 8,
    minute: 0,
    days: [1, 2, 3, 4, 5], // Lunes a Viernes
    hydrationReminder: true,
    questsReminder: true,
  },

  initialize: async () => {
    try {
      const [savedPlanId, savedDays, savedAlarm] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN),
        AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_DAYS),
        AsyncStorage.getItem(STORAGE_KEYS.ALARM_SETTINGS),
      ]);

      set({
        activePlanId: savedPlanId || 'daily_beginner_foundation',
        completedDayNumbers: savedDays ? JSON.parse(savedDays) : [],
        alarmSettings: savedAlarm ? JSON.parse(savedAlarm) : get().alarmSettings,
        isLoaded: true,
      });
    } catch (e) {
      console.warn('Error inicializando PlanStore:', e);
      set({ isLoaded: true });
    }
  },

  getActivePlan: () => {
    const { activePlanId } = get();
    return TRAINING_PLANS.find((p) => p.id === activePlanId) || TRAINING_PLANS[0];
  },

  setActivePlan: async (planId: string) => {
    set({ activePlanId: planId, completedDayNumbers: [] });
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, planId),
        AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_DAYS, JSON.stringify([])),
      ]);
    } catch (e) {
      console.warn('Error guardando plan activo:', e);
    }

    const plan = TRAINING_PLANS.find((p) => p.id === planId);
    const { alarmSettings } = get();

    if (alarmSettings.enabled && plan) {
      await scheduleWorkoutAlarm(alarmSettings.hour, alarmSettings.minute, plan.title);
    }
  },

  completePlanDay: async (dayNumber: number) => {
    const { completedDayNumbers, getActivePlan } = get();
    if (completedDayNumbers.includes(dayNumber)) return;

    const plan = getActivePlan();
    const dayData = plan?.daysSchedule.find((d) => d.dayNumber === dayNumber);
    const xp = dayData?.xpReward || 100;

    const updated = [...completedDayNumbers, dayNumber];
    set({ completedDayNumbers: updated });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_DAYS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error guardando progreso del plan:', e);
    }

    // Sumar XP al perfil del usuario
    await useUserStore.getState().addXP(xp, 'strength');

    // Si completó todos los días del plan, otorgar bono final
    if (plan && updated.length === plan.daysSchedule.length) {
      await useUserStore.getState().addXP(Math.round(plan.totalXPReward * 0.25), 'discipline');
    }
  },

  updateAlarmSettings: async (newSettings: Partial<AlarmSettings>) => {
    const current = get().alarmSettings;
    const updated = { ...current, ...newSettings };
    set({ alarmSettings: updated });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ALARM_SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error guardando configuración de alarmas:', e);
    }

    const plan = get().getActivePlan();

    // Actualizar Alarma de Entrenamiento
    if (updated.enabled && plan) {
      await scheduleWorkoutAlarm(updated.hour, updated.minute, plan.title);
    } else {
      await cancelNotificationsByCategory('workout');
    }

    // Actualizar Recordatorios de Agua
    await scheduleHydrationReminders(updated.hydrationReminder);

    // Actualizar Recordatorios de Misiones
    await scheduleQuestsReminder(updated.questsReminder, 20, 0);
  },

  resetPlan: async () => {
    set({
      activePlanId: 'daily_beginner_foundation',
      completedDayNumbers: [],
    });
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, 'daily_beginner_foundation'),
        AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_DAYS, JSON.stringify([])),
      ]);
    } catch (e) {}
  },
}));
