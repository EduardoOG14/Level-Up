import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRAINING_PLANS, TrainingPlan } from '../constants/plans';
import { UserProfile } from '../stores/userStore';
import { getLocalDateKey } from './streakEngine';

export type RecalibrationFocus =
  | 'auto'
  | 'push'
  | 'pull'
  | 'legs'
  | 'core'
  | 'fullbody'
  | 'hiit'
  | 'mobility'
  | 'express'
  | 'hypertrophy'
  | 'calisthenics'
  | 'joint_safe';

export interface CortexDirectiveResult {
  dailyPlan: TrainingPlan;
  weeklyPlan: TrainingPlan;
  monthlyPlan: TrainingPlan;
  todayDayNumber: number;
  reason: string;
  cortexDiagnosis: string;
  systemTag: string;
  isCustomRecalibrated?: boolean;
}

const STORAGE_KEYS = {
  DAILY_OVERRIDE: '@fitrise_cortex_daily_override',
  LAST_OVERRIDE_DATE: '@fitrise_cortex_override_date',
};

/**
 * Servicio Oráculo CORTEX:
 * Sintetiza, prescribe y produce de forma autónoma la rutina diaria, semanal y mensual
 * para el Cazador, evitando que tenga que buscar manualmente en un catálogo genérico.
 */
class CortexDirectiveService {
  /**
   * Obtiene la Directiva Diaria, Semanal y Mensual producida por CORTEX
   */
  async getCortexDirectives(user: UserProfile | null): Promise<CortexDirectiveResult> {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const todayKey = getLocalDateKey();

    // 1. Verificar si el Cazador solicitó una recalibración manual para el día de hoy
    let overridePlanId: string | null = null;
    try {
      const [savedOverrideDate, savedOverrideId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LAST_OVERRIDE_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_OVERRIDE),
      ]);
      if (savedOverrideDate === todayKey && savedOverrideId) {
        overridePlanId = savedOverrideId;
      }
    } catch {}

    const isBeginner = !user || user.fitnessLevel === 'beginner' || user.rank === 'E' || (user.level || 1) <= 3;
    const isAdvanced = user?.fitnessLevel === 'advanced' || ['A', 'S', 'Nacional'].includes(user?.rank || '');
    const isKneeFriendly = !!user?.kneeFriendly;

    // 2. Determinar la Directiva Diaria óptima
    let dailyPlan: TrainingPlan | undefined;
    let reason = '';
    let isRecalibrated = false;

    if (overridePlanId) {
      dailyPlan = TRAINING_PLANS.find((p) => p.id === overridePlanId);
      if (dailyPlan) {
        reason = `Directiva recalibrada manualmente por solicitud del Cazador. Enfoque: ${dailyPlan.title}.`;
        isRecalibrated = true;
      }
    }

    if (!dailyPlan) {
      if (isKneeFriendly) {
        // Modo Articulaciones Seguras / Cero Impacto
        if (dayOfWeek === 0 || dayOfWeek === 3) {
          dailyPlan = TRAINING_PLANS.find((p) => p.id === 'daily_mobility_decompression') || TRAINING_PLANS[0];
          reason = 'Protocolo de Descompresión y Regeneración Articular sin impacto.';
        } else if (dayOfWeek === 1 || dayOfWeek === 4) {
          dailyPlan = TRAINING_PLANS.find((p) => p.id === 'daily_beginner_foundation') || TRAINING_PLANS[0];
          reason = 'Iniciación Articular y Fuerza Asistida para protección ligamentosa.';
        } else {
          dailyPlan = TRAINING_PLANS.find((p) => p.id === 'daily_upper_spartan') || TRAINING_PLANS[0];
          reason = 'Enfoque de tren superior con descarga axial en rodillas.';
        }
      } else {
        // Asignación de Misión por Matriz Diaria CORTEX
        switch (dayOfWeek) {
          case 1: // Lunes: Empuje / Pectoral & Tríceps
            dailyPlan = isBeginner
              ? TRAINING_PLANS.find((p) => p.id === 'daily_beginner_foundation')
              : isAdvanced
              ? TRAINING_PLANS.find((p) => p.id === 'daily_push_hypertrophy')
              : TRAINING_PLANS.find((p) => p.id === 'daily_upper_spartan');
            reason = 'Lunes de Sobrecarga de Empuje: Calibración en pectorales, deltoides y tríceps.';
            break;

          case 2: // Martes: Tirón / Espalda & Bíceps
            dailyPlan = isBeginner
              ? TRAINING_PLANS.find((p) => p.id === 'daily_beginner_foundation')
              : TRAINING_PLANS.find((p) => p.id === 'daily_pull_shadow_monarch') ||
                TRAINING_PLANS.find((p) => p.id === 'daily_upper_spartan');
            reason = 'Martes de Tracción: Despliegue de dorsales, espalda alta y flexores de brazo.';
            break;

          case 3: // Miércoles: Núcleo / Abdomen & Movilidad
            dailyPlan = TRAINING_PLANS.find((p) => p.id === 'daily_core_iron_fortress') ||
              TRAINING_PLANS.find((p) => p.id === 'daily_mobility_decompression');
            reason = 'Miércoles de Fortalecimiento Central: Blindaje de transverso abdominal y estabilidad.';
            break;

          case 4: // Jueves: Piernas / Cimientos del Coloso
            dailyPlan = isBeginner
              ? TRAINING_PLANS.find((p) => p.id === 'daily_beginner_foundation')
              : isAdvanced
              ? TRAINING_PLANS.find((p) => p.id === 'daily_legs_explosive')
              : TRAINING_PLANS.find((p) => p.id === 'daily_lower_colossus');
            reason = 'Jueves de Cimientos: Desarrollo de potencia en cuádriceps, glúteos e isquios.';
            break;

          case 5: // Viernes: Full Body Combate Total
            dailyPlan = isAdvanced
              ? TRAINING_PLANS.find((p) => p.id === 'daily_arms_overload') || TRAINING_PLANS.find((p) => p.id === 'daily_fullbody_titan')
              : TRAINING_PLANS.find((p) => p.id === 'daily_fullbody_titan');
            reason = 'Viernes de Asalto Global: Integración neuromuscular de cuerpo completo.';
            break;

          case 6: // Sábado: HIIT / Quemador de Grasa o Incursión
            dailyPlan = isBeginner
              ? TRAINING_PLANS.find((p) => p.id === 'daily_express_hunter_15m')
              : TRAINING_PLANS.find((p) => p.id === 'daily_hiit_shadow') ||
                TRAINING_PLANS.find((p) => p.id === 'daily_fat_burn_metabolic');
            reason = 'Sábado de Aceleración Metabólica: Máxima cadencia y quema de energía sombría.';
            break;

          case 0: // Domingo: Descompresión Sinovial y Calma Neural
          default:
            dailyPlan = TRAINING_PLANS.find((p) => p.id === 'daily_mobility_decompression') || TRAINING_PLANS[0];
            reason = 'Domingo de Regeneración: Elongación fascial, lubricación sinovial y recarga biológica.';
            break;
        }
      }
    }

    if (!dailyPlan) {
      dailyPlan = TRAINING_PLANS.find((p) => p.type === 'daily') || TRAINING_PLANS[0];
    }

    // 3. Determinar el Protocolo Semanal Óptimo (Microciclo)
    let weeklyPlan: TrainingPlan | undefined;
    if (isBeginner || isKneeFriendly) {
      weeklyPlan = TRAINING_PLANS.find((p) => p.id === 'weekly_beginner_rebuild');
    } else if (user?.fitnessLevel === 'intermediate' || user?.rank === 'D') {
      weeklyPlan = TRAINING_PLANS.find((p) => p.id === 'weekly_spartan_split');
    } else if (user?.rank === 'C') {
      weeklyPlan = TRAINING_PLANS.find((p) => p.id === 'weekly_hunter_calisthenics');
    } else if (user?.rank === 'B') {
      weeklyPlan = TRAINING_PLANS.find((p) => p.id === 'weekly_gym_iron_hunter') ||
        TRAINING_PLANS.find((p) => p.id === 'weekly_fullbody_power_3d');
    } else {
      // Rango A / S / Nacional
      weeklyPlan = TRAINING_PLANS.find((p) => p.id === 'weekly_ppl_shadow_monarch') ||
        TRAINING_PLANS.find((p) => p.id === 'weekly_iron_discipline_military') ||
        TRAINING_PLANS.find((p) => p.id === 'weekly_hunter_calisthenics');
    }

    if (!weeklyPlan) {
      weeklyPlan = TRAINING_PLANS.find((p) => p.type === 'weekly') || TRAINING_PLANS[0];
    }

    // 4. Determinar el Mesociclo Mensual Óptimo (Ciclo de 30 Días de Ascensión)
    let monthlyPlan: TrainingPlan | undefined;
    if (isBeginner || user?.rank === 'E') {
      monthlyPlan = TRAINING_PLANS.find((p) => p.id === 'monthly_genesis_rebuild');
    } else if (user?.rank === 'D') {
      monthlyPlan = TRAINING_PLANS.find((p) => p.id === 'monthly_awakening_30d');
    } else if (user?.rank === 'C') {
      monthlyPlan = TRAINING_PLANS.find((p) => p.id === 'monthly_shred_metabolism');
    } else if (user?.rank === 'B') {
      monthlyPlan = TRAINING_PLANS.find((p) => p.id === 'monthly_titan_hypertrophy') ||
        TRAINING_PLANS.find((p) => p.id === 'monthly_calisthenics_mastery');
    } else {
      monthlyPlan = TRAINING_PLANS.find((p) => p.id === 'monthly_shadow_monarch_ascension') ||
        TRAINING_PLANS.find((p) => p.id === 'monthly_awakening_30d');
    }

    if (!monthlyPlan) {
      monthlyPlan = TRAINING_PLANS.find((p) => p.type === 'monthly') || TRAINING_PLANS[0];
    }

    // Diagnóstico generado en voz del sistema CORTEX
    const hunterName = user?.name || 'Cazador';
    const hunterRank = user?.rank || 'E';
    const cortexDiagnosis = `Hunter ${hunterName} [Rango ${hunterRank}]: El Sistema CORTEX ha computado tus biomarcadores y telemetría articular. La directiva táctica de hoy es "${dailyPlan.title}". No omitas estaciones para asegurar bonificación de XP y evitar penalizaciones de inactividad.`;

    return {
      dailyPlan,
      weeklyPlan,
      monthlyPlan,
      todayDayNumber: 1,
      reason,
      cortexDiagnosis,
      systemTag: isRecalibrated ? '[ DIRECTIVA CORTEX: RECALIBRADA ]' : '[ DIRECTIVA CORTEX V3.4: OBLIGATORIA ]',
      isCustomRecalibrated: isRecalibrated,
    };
  }

  /**
   * Recalibra la directiva diaria bajo solicitud explícita del usuario
   * (ej. el usuario prefiere hacer tren superior, calistenia, o tiene fatiga)
   */
  async recalibrateDailyDirective(
    user: UserProfile | null,
    focus: RecalibrationFocus
  ): Promise<CortexDirectiveResult> {
    let targetPlanId = 'daily_fullbody_titan';

    switch (focus) {
      case 'push':
        targetPlanId = 'daily_push_hypertrophy';
        break;
      case 'pull':
        targetPlanId = 'daily_pull_shadow_monarch';
        break;
      case 'legs':
        targetPlanId = user?.kneeFriendly ? 'daily_lower_colossus' : 'daily_legs_explosive';
        break;
      case 'core':
        targetPlanId = 'daily_core_iron_fortress';
        break;
      case 'hiit':
        targetPlanId = 'daily_fat_burn_metabolic';
        break;
      case 'mobility':
      case 'joint_safe':
        targetPlanId = 'daily_mobility_decompression';
        break;
      case 'express':
        targetPlanId = 'daily_express_hunter_15m';
        break;
      case 'hypertrophy':
        targetPlanId = 'daily_push_hypertrophy';
        break;
      case 'calisthenics':
        targetPlanId = 'daily_calisthenics_elite';
        break;
      case 'fullbody':
      case 'auto':
      default:
        targetPlanId = 'daily_fullbody_titan';
        break;
    }

    const todayKey = getLocalDateKey();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_OVERRIDE, targetPlanId);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_OVERRIDE_DATE, todayKey);
    } catch (e) {
      console.warn('Error guardando override de directiva CORTEX:', e);
    }

    return this.getCortexDirectives(user);
  }

  /**
   * Restablece la directiva al cálculo autónomo automático de CORTEX
   */
  async resetToAutonomous(user: UserProfile | null): Promise<CortexDirectiveResult> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.DAILY_OVERRIDE);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_OVERRIDE_DATE);
    } catch {}

    return this.getCortexDirectives(user);
  }
}

export const CortexDirective = new CortexDirectiveService();
