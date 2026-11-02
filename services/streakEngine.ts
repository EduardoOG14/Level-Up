import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../stores/userStore';
import { useProgressStore } from '../stores/progressStore';
import { usePenaltyStore } from '../stores/penaltyStore';
import { Haptics } from './haptics';
import { SoundEffects } from './soundEffects';
import { StreakShieldService } from './streakShieldService';

export interface DailyStreakStatus {
  dateKey: string;
  areQuestsCompleted: boolean;
  questsCompletedCount: number;
  isRoutineCompleted: boolean;
  completedRoutineTitle?: string;
  isFullDayCompleted: boolean;
  isStreakAdvancedToday: boolean;
  currentStreak: number;
  shieldsAvailable?: number;
  wasShieldActivatedToday?: boolean;
  isRestDay?: boolean;
  restDayLabel?: string;
}

export interface StreakAdvanceResult {
  advanced: boolean;
  newStreak: number;
  alreadyAdvancedToday: boolean;
  missing?: 'quests' | 'routine';
  isFullDayCompleted: boolean;
}

/**
 * Obtiene la clave de fecha en formato local YYYY-MM-DD
 */
export const getLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la clave de fecha de ayer en formato local YYYY-MM-DD
 */
export const getYesterdayDateKey = (): string => {
  const d = new Date(Date.now() - 86400000);
  return getLocalDateKey(d);
};

/**
 * Obtiene la clave de fecha del último día de entrenamiento obligatorio programado anterior a fromDate.
 * Ignora días de descanso y fines de semana no seleccionados para que nunca corten la racha del Cazador.
 */
export const getLastRequiredWorkoutDateKey = (
  workoutDays: number[] = [1, 2, 3, 4, 5],
  fromDate: Date = new Date()
): string => {
  const d = new Date(fromDate);
  for (let i = 1; i <= 14; i++) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (workoutDays.includes(day)) {
      return getLocalDateKey(d);
    }
  }
  return getYesterdayDateKey();
};

class StreakEngineService {
  /**
   * Consulta el estado del día actual para saber si se cumplieron misiones y rutina
   */
  async getDailyStatus(uid: string): Promise<DailyStreakStatus> {
    const todayKey = getLocalDateKey();
    const currentUser = useUserStore.getState().user;
    const currentStreak = currentUser?.streak || 0;

    try {
      // 1. Estado de Misiones Diarias
      const questsKey = `@fitrise_daily_quests_${uid}_${todayKey}`;
      const questsRaw = await AsyncStorage.getItem(questsKey);
      let areQuestsCompleted = false;
      let questsCompletedCount = 0;

      if (questsRaw) {
        const questsList = JSON.parse(questsRaw);
        if (Array.isArray(questsList)) {
          questsCompletedCount = questsList.filter((q: any) => q.completed).length;
          areQuestsCompleted = questsList.length >= 5 && questsList.every((q: any) => q.completed);
        }
      }

      // Si no hay misiones en storage, verificar progressStore
      if (!areQuestsCompleted) {
        const completedQuestDays = useProgressStore.getState().completedQuestDays;
        if (completedQuestDays.includes(todayKey)) {
          areQuestsCompleted = true;
          questsCompletedCount = 5;
        }
      }

      // 2. Estado de la Rutina Diaria
      const routineKey = `@fitrise_routine_completed_${uid}_${todayKey}`;
      const routineRaw = await AsyncStorage.getItem(routineKey);
      let isRoutineCompleted = false;
      let completedRoutineTitle: string | undefined = undefined;

      if (routineRaw) {
        const parsed = JSON.parse(routineRaw);
        isRoutineCompleted = !!parsed.completed;
        completedRoutineTitle = parsed.title;
      }

      // Verificar en los circuitLogs de progressStore si se completó algún circuito hoy
      if (!isRoutineCompleted) {
        const circuitLogs = useProgressStore.getState().circuitLogs;
        const todayCircuit = circuitLogs.find((c) => c.date && c.date.startsWith(todayKey));
        if (todayCircuit) {
          isRoutineCompleted = true;
          completedRoutineTitle = todayCircuit.title;
        }
      }

      // 3. Estado de Racha Avanzada Hoy
      const advancedKey = `@fitrise_streak_advanced_${uid}_${todayKey}`;
      const advancedRaw = await AsyncStorage.getItem(advancedKey);
      const isStreakAdvancedToday = advancedRaw === 'true' || currentUser?.lastActiveDate === todayKey;

      const isFullDayCompleted = areQuestsCompleted && isRoutineCompleted;
      const shieldsAvailable = await StreakShieldService.getShieldCount(uid);
      const workoutDays = currentUser?.workoutDays || [1, 2, 3, 4, 5];
      const todayDayOfWeek = new Date().getDay();
      const isRestDay = !workoutDays.includes(todayDayOfWeek);

      return {
        dateKey: todayKey,
        areQuestsCompleted,
        questsCompletedCount,
        isRoutineCompleted,
        completedRoutineTitle,
        isFullDayCompleted,
        isStreakAdvancedToday,
        currentStreak,
        shieldsAvailable,
        isRestDay,
        restDayLabel: isRestDay ? 'Descanso Táctico (Racha Protegida 🛡️)' : undefined,
      };
    } catch (err) {
      console.warn('Error leyendo estado diario de racha:', err);
      return {
        dateKey: todayKey,
        areQuestsCompleted: false,
        questsCompletedCount: 0,
        isRoutineCompleted: false,
        isFullDayCompleted: false,
        isStreakAdvancedToday: false,
        currentStreak,
        shieldsAvailable: 1,
        isRestDay: false,
      };
    }
  }

  /**
   * Registra la finalización de una rutina (circuito de plan o mazmorra) hoy y evalúa la racha
   */
  async recordRoutineCompleted(
    uid: string,
    title: string,
    xpReward: number
  ): Promise<StreakAdvanceResult> {
    const todayKey = getLocalDateKey();
    const routineKey = `@fitrise_routine_completed_${uid}_${todayKey}`;

    // 1. Guardar la rutina completada hoy
    await AsyncStorage.setItem(
      routineKey,
      JSON.stringify({
        completed: true,
        title,
        timestamp: Date.now(),
      })
    );

    // 2. Registrar en progressStore y actualizar contador de entrenamientos
    await useProgressStore.getState().logCircuit(title, 'plan', xpReward, uid);
    const currentUser = useUserStore.getState().user;
    if (currentUser) {
      await useUserStore.getState().updateProfile({
        workoutsCompleted: (currentUser.workoutsCompleted || 0) + 1,
      });
    }

    // 3. Evaluar si con esta rutina se cumplen AMBOS requisitos para mantener/avanzar la racha
    return this.evaluateAndAdvanceStreak(uid);
  }

  /**
   * Registra que todas las misiones diarias fueron completadas y evalúa la racha
   */
  async recordQuestsCompleted(uid: string): Promise<StreakAdvanceResult> {
    const todayKey = getLocalDateKey();
    await useProgressStore.getState().recordDailyQuestsCompleted(uid);
    return this.evaluateAndAdvanceStreak(uid);
  }

  /**
   * Evalúa estrictamente si se cumplen TODAS las misiones y la rutina.
   * Si y solo si se cumplen ambas, mantiene y avanza la racha del usuario.
   */
  async evaluateAndAdvanceStreak(uid: string): Promise<StreakAdvanceResult> {
    const todayKey = getLocalDateKey();
    const yesterdayKey = getYesterdayDateKey();
    const status = await this.getDailyStatus(uid);

    // Si falta alguno de los dos requisitos, NO se avanza la racha
    if (!status.areQuestsCompleted) {
      return {
        advanced: false,
        newStreak: status.currentStreak,
        alreadyAdvancedToday: false,
        missing: 'quests',
        isFullDayCompleted: false,
      };
    }

    if (!status.isRoutineCompleted) {
      return {
        advanced: false,
        newStreak: status.currentStreak,
        alreadyAdvancedToday: false,
        missing: 'routine',
        isFullDayCompleted: false,
      };
    }

    // Ya están los dos requisitos cumplidos (100% de misiones + rutina).
    // Verificar si ya fue incrementada hoy para no duplicar en el mismo día
    const advancedKey = `@fitrise_streak_advanced_${uid}_${todayKey}`;
    const alreadyAdvanced = (await AsyncStorage.getItem(advancedKey)) === 'true';

    const currentUser = useUserStore.getState().user;
    if (!currentUser) {
      return {
        advanced: false,
        newStreak: 0,
        alreadyAdvancedToday: false,
        isFullDayCompleted: true,
      };
    }

    if (alreadyAdvanced || currentUser.lastActiveDate === todayKey) {
      return {
        advanced: false,
        newStreak: currentUser.streak,
        alreadyAdvancedToday: true,
        isFullDayCompleted: true,
      };
    }

    // Calcular la nueva racha:
    // Si su último día completado fue ayer o el último día obligatorio (ej. viernes si hoy es lunes) -> streak + 1
    // Si fue hace más tiempo (o es el primer día) -> streak = 1
    const lastActive = currentUser.lastActiveDate;
    const workoutDays = currentUser.workoutDays || [1, 2, 3, 4, 5];
    const lastRequiredKey = getLastRequiredWorkoutDateKey(workoutDays, new Date());
    let newStreak = 1;

    if (
      lastActive === yesterdayKey ||
      lastActive === lastRequiredKey ||
      (lastActive && lastActive >= lastRequiredKey) ||
      lastActive === new Date(Date.now() - 86400000).toDateString()
    ) {
      newStreak = (currentUser.streak || 0) + 1;
    } else if (currentUser.streak === 0) {
      newStreak = 1;
    } else {
      // Si venía de racha y estuvo en zona de castigo salvada hoy
      newStreak = Math.max(currentUser.streak, 1);
    }

    // Actualizar perfil
    await useUserStore.getState().updateProfile({
      streak: newStreak,
      lastActiveDate: todayKey,
    });

    // Guardar flag de avance de racha hoy
    await AsyncStorage.setItem(advancedKey, 'true');

    // Bonificación de Escudo Protector cada 7 días de racha continua
    if (newStreak % 7 === 0) {
      await StreakShieldService.awardShield(uid, 1);
    }

    // Si estaba activa la zona de castigo, resolverla con honores
    const penaltyStore = usePenaltyStore.getState();
    if (penaltyStore.isPenaltyActive) {
      await penaltyStore.resolvePenalty(uid);
    }

    // Efectos audiovisuales de triunfo
    SoundEffects.playLevelUp();
    Haptics.triumph();

    return {
      advanced: true,
      newStreak,
      alreadyAdvancedToday: false,
      isFullDayCompleted: true,
    };
  }

  /**
   * Valida la racha al iniciar la aplicación.
   * Si el usuario no cumplió ayer con la directiva completa (misiones + rutina) y tenía racha,
   * se verifica si tiene un Escudo Protector disponible.
   * Si tiene escudo, el escudo absorbe la falta y protege la racha.
   * Si no tiene escudo, se activa la Zona de Castigo o se reinicia la racha.
   */
  async validateStreakOnAppLaunch(uid: string): Promise<void> {
    const todayKey = getLocalDateKey();
    const yesterdayKey = getYesterdayDateKey();
    const currentUser = useUserStore.getState().user;

    if (!currentUser || currentUser.streak <= 0) return;

    const workoutDays = currentUser.workoutDays || [1, 2, 3, 4, 5];
    const todayDayOfWeek = new Date().getDay();
    const isTodayRestDay = !workoutDays.includes(todayDayOfWeek);
    const lastRequiredKey = getLastRequiredWorkoutDateKey(workoutDays, new Date());

    const lastActive = currentUser.lastActiveDate;
    // Si estuvo activo hoy, ayer, o en el último día de entrenamiento obligatorio programado:
    const isActiveRecently =
      lastActive === todayKey ||
      lastActive === yesterdayKey ||
      lastActive === lastRequiredKey ||
      (lastActive && lastActive >= lastRequiredKey) ||
      lastActive === new Date().toDateString() ||
      lastActive === new Date(Date.now() - 86400000).toDateString();

    if (isActiveRecently) return;

    // Si hoy es día de descanso programado (fin de semana o día no seleccionado),
    // la racha NO se corta
    if (isTodayRestDay && lastActive && lastActive >= lastRequiredKey) {
      return;
    }

    if (!isActiveRecently) {
      // Intentar consumir un Escudo Protector de Racha del Sistema
      const shieldConsumed = await StreakShieldService.consumeShield(uid, todayKey);
      if (shieldConsumed) {
        // El escudo salvó la racha: ajustamos el último día activo a ayer para continuar la racha hoy
        await useUserStore.getState().updateProfile({
          lastActiveDate: yesterdayKey,
        });
        return;
      }

      // Sin escudo: verificar o activar Zona de Castigo para darle 24h de rescate
      const penaltyStore = usePenaltyStore.getState();
      const isPenaltyActive = await penaltyStore.checkAndTriggerPenalty(
        uid,
        lastActive,
        currentUser.streak
      );

      // Si la penalización ya expiró o fue rechazada, reiniciar racha a 0
      if (!isPenaltyActive && penaltyStore.isLoaded) {
        await useUserStore.getState().updateProfile({
          streak: 0,
        });
      }
    }
  }
}

export const StreakEngine = new StreakEngineService();
