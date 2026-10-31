import { create } from 'zustand';
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

interface PlanStore {
  activePlanId: string;
  completedDayNumbers: number[];
  alarmSettings: AlarmSettings;
  setActivePlan: (planId: string) => Promise<void>;
  completePlanDay: (dayNumber: number) => Promise<void>;
  updateAlarmSettings: (settings: Partial<AlarmSettings>) => Promise<void>;
  getActivePlan: () => TrainingPlan | undefined;
  resetPlan: () => void;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  activePlanId: 'daily_fullbody_titan',
  completedDayNumbers: [],
  alarmSettings: {
    enabled: true,
    hour: 8,
    minute: 0,
    days: [1, 2, 3, 4, 5], // Lunes a Viernes
    hydrationReminder: true,
    questsReminder: true,
  },

  getActivePlan: () => {
    const { activePlanId } = get();
    return TRAINING_PLANS.find((p) => p.id === activePlanId) || TRAINING_PLANS[0];
  },

  setActivePlan: async (planId: string) => {
    set({ activePlanId: planId, completedDayNumbers: [] });
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

  resetPlan: () => {
    set({
      activePlanId: 'daily_fullbody_titan',
      completedDayNumbers: [],
    });
  },
}));
