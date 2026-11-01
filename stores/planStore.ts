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
import { useProgressStore } from './progressStore';
import { StreakEngine, getLocalDateKey } from '../services/streakEngine';

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
  COMPLETED_PLANS: '@fitrise_completed_plans_history',
  LAST_ROUTINE_DATE: '@fitrise_last_routine_date',
  ALARM_SETTINGS: '@fitrise_plan_alarm_settings',
};

interface PlanStore {
  activePlanId: string;
  completedDayNumbers: number[];
  completedPlanIds: string[];
  lastRoutineDate: string;
  alarmSettings: AlarmSettings;
  isLoaded: boolean;
  initialize: () => Promise<void>;
  setActivePlan: (planId: string) => Promise<void>;
  completePlanDay: (dayNumber: number) => Promise<{
    isDayCompleted: boolean;
    isPlanFullyCompleted: boolean;
    xpEarned: number;
  }>;
  isCurrentPlanCompleted: () => boolean;
  isTodayRoutineCompleted: () => boolean;
  getRecommendedNextPlan: () => TrainingPlan | undefined;
  resetCurrentPlanProgress: () => Promise<void>;
  updateAlarmSettings: (settings: Partial<AlarmSettings>) => Promise<void>;
  getActivePlan: () => TrainingPlan | undefined;
  resetPlan: () => Promise<void>;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  activePlanId: 'daily_beginner_foundation',
  completedDayNumbers: [],
  completedPlanIds: [],
  lastRoutineDate: '',
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
      const [savedPlanId, savedDays, savedPlans, savedDate, savedAlarm] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN),
        AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_DAYS),
        AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_PLANS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_ROUTINE_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.ALARM_SETTINGS),
      ]);

      set({
        activePlanId: savedPlanId || 'daily_beginner_foundation',
        completedDayNumbers: savedDays ? JSON.parse(savedDays) : [],
        completedPlanIds: savedPlans ? JSON.parse(savedPlans) : [],
        lastRoutineDate: savedDate || '',
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

  isCurrentPlanCompleted: () => {
    const { completedDayNumbers, getActivePlan } = get();
    const plan = getActivePlan();
    if (!plan || !plan.daysSchedule || plan.daysSchedule.length === 0) return false;
    return completedDayNumbers.length >= plan.daysSchedule.length;
  },

  isTodayRoutineCompleted: () => {
    const { lastRoutineDate } = get();
    const todayKey = getLocalDateKey();
    if (lastRoutineDate === todayKey) return true;
    const circuitLogs = useProgressStore.getState().circuitLogs;
    return circuitLogs.some((c) => c.date && c.date.startsWith(todayKey));
  },

  getRecommendedNextPlan: () => {
    const { activePlanId } = get();
    const currentPlan = TRAINING_PLANS.find((p) => p.id === activePlanId);
    if (!currentPlan) return TRAINING_PLANS[1] || TRAINING_PLANS[0];

    // Progresión por jerarquía
    if (currentPlan.type === 'daily') {
      const weeklyPlan = TRAINING_PLANS.find((p) => p.type === 'weekly' && p.id !== activePlanId);
      if (weeklyPlan) return weeklyPlan;
    } else if (currentPlan.type === 'weekly') {
      const nextLevelPlan = TRAINING_PLANS.find(
        (p) => (p.type === 'monthly' || p.difficulty === 'Intermedio' || p.difficulty === 'Avanzado') && p.id !== activePlanId
      );
      if (nextLevelPlan) return nextLevelPlan;
    }

    const currentIndex = TRAINING_PLANS.findIndex((p) => p.id === activePlanId);
    return TRAINING_PLANS[(currentIndex + 1) % TRAINING_PLANS.length];
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
      await scheduleWorkoutAlarm(alarmSettings.hour, alarmSettings.minute, plan.title, alarmSettings.days);
    }
  },

  completePlanDay: async (dayNumber: number) => {
    const { completedDayNumbers, getActivePlan, completedPlanIds } = get();
    const plan = getActivePlan();
    if (!plan) return { isDayCompleted: false, isPlanFullyCompleted: false, xpEarned: 0 };

    const isAlreadyDone = completedDayNumbers.includes(dayNumber);
    const dayData = plan.daysSchedule.find((d) => d.dayNumber === dayNumber);
    const xp = dayData?.xpReward || 100;
    const todayKey = getLocalDateKey();

    const updated = isAlreadyDone ? completedDayNumbers : [...completedDayNumbers, dayNumber];
    const isPlanFullyCompleted = updated.length >= plan.daysSchedule.length;

    let updatedCompletedPlans = completedPlanIds;
    if (isPlanFullyCompleted && !completedPlanIds.includes(plan.id)) {
      updatedCompletedPlans = [...completedPlanIds, plan.id];
    }

    set({
      completedDayNumbers: updated,
      completedPlanIds: updatedCompletedPlans,
      lastRoutineDate: todayKey,
    });

    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_DAYS, JSON.stringify(updated)),
        AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_PLANS, JSON.stringify(updatedCompletedPlans)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_ROUTINE_DATE, todayKey),
      ]);
    } catch (e) {
      console.warn('Error guardando progreso del plan:', e);
    }

    if (!isAlreadyDone) {
      // Sumar XP al perfil del usuario
      await useUserStore.getState().addXP(xp, 'strength');
    }

    // Registrar en StreakEngine la rutina completada hoy y evaluar la racha
    const currentUser = useUserStore.getState().user;
    if (currentUser) {
      await StreakEngine.recordRoutineCompleted(
        currentUser.uid,
        `${plan.title} - Día ${dayNumber}: ${dayData?.title || 'Circuito'}`,
        xp
      );
    }

    // Si completó todos los días del plan y no se había premiado la finalización
    if (isPlanFullyCompleted && !completedPlanIds.includes(plan.id)) {
      const bonusXP = Math.round(plan.totalXPReward * 0.25);
      await useUserStore.getState().addXP(bonusXP, 'discipline');
    }

    return {
      isDayCompleted: true,
      isPlanFullyCompleted,
      xpEarned: xp,
    };
  },

  resetCurrentPlanProgress: async () => {
    set({ completedDayNumbers: [] });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_DAYS, JSON.stringify([]));
    } catch (e) {
      console.warn('Error reiniciando progreso del plan actual:', e);
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
      await scheduleWorkoutAlarm(updated.hour, updated.minute, plan.title, updated.days);
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
      completedPlanIds: [],
      lastRoutineDate: '',
    });
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, 'daily_beginner_foundation'),
        AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_DAYS, JSON.stringify([])),
        AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_PLANS, JSON.stringify([])),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_ROUTINE_DATE, ''),
      ]);
    } catch (e) {}
  },
}));
