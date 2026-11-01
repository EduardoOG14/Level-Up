import { CortexVoice } from './cortexVoice';
import {
  type SmartwatchBrand,
  type SmartwatchMetrics,
  type SmartwatchAdaptiveWorkout,
  type SmartwatchCongratulation,
  SMARTWATCH_BRANDS,
} from '../constants/smartwatch';
import { Haptics } from './haptics';
import { SoundEffects } from './soundEffects';

export class SmartwatchEngine {
  /**
   * Genera métricas biométricas iniciales realistas para una marca conectada
   */
  public static getInitialMetrics(brand: SmartwatchBrand): SmartwatchMetrics {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    switch (brand) {
      case 'samsung':
        return {
          steps: 8420,
          stepGoal: 10000,
          activeCalories: 485,
          calorieGoal: 600,
          currentHeartRate: 74,
          restingHeartRate: 61,
          maxHeartRateToday: 152,
          sleepHours: 7.6,
          sleepQuality: 89,
          readinessScore: 88,
          stressLevel: 'low',
          lastSyncTime: timeStr,
          batteryLevel: 86,
        };
      case 'apple':
        return {
          steps: 9150,
          stepGoal: 10000,
          activeCalories: 520,
          calorieGoal: 650,
          currentHeartRate: 72,
          restingHeartRate: 59,
          maxHeartRateToday: 158,
          sleepHours: 8.1,
          sleepQuality: 92,
          readinessScore: 91,
          stressLevel: 'low',
          lastSyncTime: timeStr,
          batteryLevel: 79,
        };
      case 'cubitt':
        return {
          steps: 7340,
          stepGoal: 10000,
          activeCalories: 430,
          calorieGoal: 550,
          currentHeartRate: 78,
          restingHeartRate: 64,
          maxHeartRateToday: 146,
          sleepHours: 7.2,
          sleepQuality: 84,
          readinessScore: 82,
          stressLevel: 'moderate',
          lastSyncTime: timeStr,
          batteryLevel: 94,
        };
      case 'xiaomi':
        return {
          steps: 8890,
          stepGoal: 10000,
          activeCalories: 490,
          calorieGoal: 600,
          currentHeartRate: 76,
          restingHeartRate: 62,
          maxHeartRateToday: 150,
          sleepHours: 7.4,
          sleepQuality: 86,
          readinessScore: 85,
          stressLevel: 'low',
          lastSyncTime: timeStr,
          batteryLevel: 91,
        };
    }
  }

  /**
   * Evalúa la telemetría del smartwatch y asigna dinámicamente el entrenamiento óptimo
   */
  public static evaluateAdaptiveWorkout(
    metrics: SmartwatchMetrics,
    brand: SmartwatchBrand,
    userLevel: number = 1
  ): SmartwatchAdaptiveWorkout {
    const brandName = SMARTWATCH_BRANDS[brand]?.name || 'Smartwatch';

    // CASO 1: FATIGA ELEVADA / SUEÑO DEFICITARIO / ESTRÉS ALTO
    if (metrics.sleepHours < 6.0 || metrics.restingHeartRate > 75 || metrics.readinessScore < 65) {
      return {
        id: 'adaptive_neural_recovery',
        title: 'Protocolo de Descompresión & Movilidad Biomecánica',
        subtitle: `Asignado por telemetría de ${brandName}: Fatiga detectada`,
        intensity: 'recovery',
        triggerReason: `Tu ${brandName} detectó solo ${metrics.sleepHours}h de sueño y ritmo basal elevado (${metrics.restingHeartRate} BPM).`,
        cortexDiagnosis: `Diagnóstico CORTEX: Sistema nervioso con fatiga acumulada. Para blindar tus articulaciones y evitar catabolismo celular, la directiva asigna movilidad suave, estiramiento y respiración diafragmática.`,
        exercises: [
          {
            id: '1346',
            name: 'Descompresión de Dorsales & Espalda en Rodillas',
            reps: '45 segundos de alargamiento espinal',
            sets: 2,
            targetCount: 45,
            imageKey: '1346',
            muscles: ['Dorsales', 'Espalda Media', 'Columna'],
          },
          {
            id: '1271',
            name: 'Descompresión de Pectorales & Hombros',
            reps: '45 segundos de apertura torácica',
            sets: 2,
            targetCount: 45,
            imageKey: '1271',
            muscles: ['Pectorales', 'Deltoides Anterior', 'Hombros'],
          },
          {
            id: '1511',
            name: 'Extensión Isquiotibial & Cadena Posterior',
            reps: '45 segundos de elongación suave',
            sets: 2,
            targetCount: 45,
            imageKey: '1511',
            muscles: ['Isquiotibiales', 'Zona Poplítea', 'Glúteos'],
          },
          {
            id: '1494',
            name: 'Postura de Mariposa & Apertura Pélvica',
            reps: '60 segundos respiración diafragmática',
            sets: 2,
            targetCount: 60,
            imageKey: '1494',
            muscles: ['Aductores', 'Fascia Pélvica', 'Caderas'],
          },
        ],
        estimatedMinutes: 12,
        xpReward: 150,
        vitalityGain: 4,
        strengthGain: 1,
        agilityGain: 1,
      };
    }

    // CASO 2: DÉFICIT DE PASOS / SEDENTARISMO MATUTINO
    if (metrics.steps < 4500 && metrics.readinessScore >= 65) {
      return {
        id: 'adaptive_cardio_activation',
        title: 'Operación Cardio & Reactivación Metabólica',
        subtitle: `Asignado por telemetría de ${brandName}: Déficit de desplazamiento`,
        intensity: 'endurance',
        triggerReason: `Tu ${brandName} registra únicamente ${metrics.steps} pasos completados.`,
        cortexDiagnosis: `Diagnóstico CORTEX: Desplazamiento en terreno por debajo del umbral mínimo de combate. Se prescribe activación metabólica con ejercicios de alta cadencia para acelerar la quema calórica y activar el tren inferior.`,
        exercises: [
          {
            id: 'climbers',
            name: 'Escaladores Tácticos / Mountain Climbers',
            reps: '20 repeticiones continuas',
            sets: 3,
            targetCount: 20,
            imageKey: 'climbers',
            muscles: ['Flexores de Cadera', 'Core', 'Cardiovascular'],
          },
          {
            id: 'lunges',
            name: 'Estocadas Dinámicas de Cazador',
            reps: '12 repeticiones por pierna',
            sets: 3,
            targetCount: 12,
            imageKey: 'lunges',
            muscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
          },
          {
            id: 'squats',
            name: 'Sentadillas Profundas de Reactivación',
            reps: '15 reps con 4s bajada',
            sets: 3,
            targetCount: 15,
            imageKey: 'squats',
            muscles: ['Cuádriceps', 'Glúteos', 'Tren Inferior'],
          },
          {
            id: 'burpees',
            name: 'Burpees Tácticos / Tactical Burpees',
            reps: '8 reps continuas',
            sets: 2,
            targetCount: 8,
            imageKey: 'burpees',
            muscles: ['Cuerpo Completo', 'Cardiovascular', 'Poder'],
          },
        ],
        estimatedMinutes: 16,
        xpReward: 180,
        vitalityGain: 2,
        strengthGain: 2,
        agilityGain: 4,
      };
    }

    // CASO 3: ALTA COMBUSTIÓN CALÓRICA (YA SUPERÓ 500 KCAL)
    if (metrics.activeCalories >= 520) {
      return {
        id: 'adaptive_core_power',
        title: 'Consolidación de Potencia & Blindaje del Core',
        subtitle: `Asignado por telemetría de ${brandName}: Alta combustión activa`,
        intensity: 'moderate',
        triggerReason: `Tu ${brandName} registra ${metrics.activeCalories} kcal activas ya consumidas.`,
        cortexDiagnosis: `Diagnóstico CORTEX: Gasto energético notable en tu jornada. Para capitalizar el metabolismo acelerado sin desgastar reservas de glucógeno, se asigna fortalecimiento estricto de torso y estabilidad isométrica.`,
        exercises: [
          {
            id: 'pushups',
            name: 'Flexiones Militares Tácticas',
            reps: '12 reps estrictas 4s bajada',
            sets: 3,
            targetCount: 12,
            imageKey: 'pushups',
            muscles: ['Pectorales', 'Tríceps', 'Deltoides'],
          },
          {
            id: 'diamond',
            name: 'Flexiones Diamante de Precisión',
            reps: '10 reps lentas',
            sets: 3,
            targetCount: 10,
            imageKey: 'diamond',
            muscles: ['Tríceps', 'Pectoral Interno', 'Core'],
          },
          {
            id: 'plank',
            name: 'Plancha Isométrica de Acero',
            reps: '45 segundos estáticos',
            sets: 3,
            targetCount: 45,
            imageKey: 'plank',
            muscles: ['Transverso Abdominal', 'Espalda Baja'],
          },
          {
            id: '1511',
            name: 'Extensión Isquiotibial & Cadena Posterior',
            reps: '45 segundos por pierna',
            sets: 2,
            targetCount: 45,
            imageKey: '1511',
            muscles: ['Isquiotibiales', 'Fascia Posterior'],
          },
        ],
        estimatedMinutes: 15,
        xpReward: 200,
        vitalityGain: 2,
        strengthGain: 4,
        agilityGain: 1,
      };
    }

    // CASO 4: ESTADO ÓPTIMO / CONDICIÓN DE COMBATE MÁXIMA (READINESS 80%+)
    return {
      id: 'adaptive_elite_overload',
      title: 'Asalto de Máxima Intensidad: Sobrecarga de Élite',
      subtitle: `Asignado por telemetría de ${brandName}: Preparación Física Óptima`,
      intensity: 'high_intensity',
      triggerReason: `Tu ${brandName} confirma ${metrics.sleepHours}h de sueño y ${metrics.readinessScore}% de Vitalidad.`,
      cortexDiagnosis: `Diagnóstico CORTEX: Ventana biológica en estado pico. Tu frecuencia cardíaca basal (${metrics.restingHeartRate} BPM) y calidad de descanso garantizan máxima reclutación de fibras rápidas. Prescripción: Circuito de potencia y sobrecarga.`,
      exercises: [
        {
          id: 'pushups',
          name: 'Flexiones Militares Tácticas',
          reps: '12 reps lentas con 2s pausa',
          sets: 4,
          targetCount: 12,
          imageKey: 'pushups',
          muscles: ['Pectorales', 'Tríceps', 'Hombros'],
        },
        {
          id: 'squats',
          name: 'Sentadillas Profundas de Cazador',
          reps: '15 reps rompiendo el paralelo',
          sets: 4,
          targetCount: 15,
          imageKey: 'squats',
          muscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales'],
        },
        {
          id: 'diamond',
          name: 'Flexiones Diamante de Poder',
          reps: '10 reps estrictas',
          sets: 3,
          targetCount: 10,
          imageKey: 'diamond',
          muscles: ['Tríceps', 'Core', 'Pectorales'],
        },
        {
          id: 'pike',
          name: 'Flexiones en Pica / Pike Pushups',
          reps: '10 reps de empuje vertical',
          sets: 3,
          targetCount: 10,
          imageKey: 'pike',
          muscles: ['Deltoides', 'Trapecios', 'Tríceps'],
        },
        {
          id: 'burpees',
          name: 'Burpees Tácticos de Cazador',
          reps: '10 reps explosivas',
          sets: 3,
          targetCount: 10,
          imageKey: 'burpees',
          muscles: ['Todo el Cuerpo', 'Poder Metabólico'],
        },
      ],
      estimatedMinutes: 20,
      xpReward: 250,
      vitalityGain: 3,
      strengthGain: 5,
      agilityGain: 4,
    };
  }

  /**
   * Evalúa los hitos cumplidos en base a los datos del smartwatch y genera felicitaciones de CORTEX
   */
  public static evaluateCongratulations(
    metrics: SmartwatchMetrics,
    brand: SmartwatchBrand,
    existingCongrats: SmartwatchCongratulation[] = []
  ): SmartwatchCongratulation[] {
    const brandName = SMARTWATCH_BRANDS[brand]?.name || 'Smartwatch';
    const now = Date.now();
    const dateLabel = new Date().toLocaleDateString('es-US', {
      month: 'short',
      day: 'numeric',
    });

    const newCongratulations: SmartwatchCongratulation[] = [];
    const hasMilestone = (key: string) =>
      existingCongrats.some((c) => c.metricKey === key && now - c.timestamp < 1000 * 60 * 60 * 18);

    // 1. HITO: 10,000 PASOS CONQUISTADOS
    if (metrics.steps >= 10000 && !hasMilestone('steps')) {
      newCongratulations.push({
        id: `congrat_steps_${now}`,
        timestamp: now,
        dateLabel,
        title: '🎯 Directiva de 10,000 Pasos Conquistada',
        message: `Tu ${brandName} confirma ${metrics.steps.toLocaleString()} pasos completados. Tu constancia sobre el terreno supera los estándares del Sistema.`,
        speechText: `¡Felicitaciones del Sistema! Tu ${brandName} confirma diez mil pasos superados. Tu disciplina sobre el terreno es digna de un Cazador de Élite.`,
        badgeEmoji: '👟',
        metricKey: 'steps',
        metricValue: `${metrics.steps.toLocaleString()} pasos`,
        tier: 'legendary',
      });
    }

    // 2. HITO: 500+ KCAL ACTIVAS QUEMADAS
    if (metrics.activeCalories >= 500 && !hasMilestone('calories')) {
      newCongratulations.push({
        id: `congrat_calories_${now}`,
        timestamp: now,
        dateLabel,
        title: '🔥 Combustión Calórica de Rango Superior',
        message: `Tu sensor biométrico reporta ${metrics.activeCalories} kcal activas disipadas. Has forzado a tu organismo a consumir grasa como combustible de combate.`,
        speechText: `Directiva calórica superada. Tu ${brandName} registra más de quinientas calorías activas quemadas. Rendimiento metabólico superior.`,
        badgeEmoji: '🔥',
        metricKey: 'calories',
        metricValue: `${metrics.activeCalories} kcal`,
        tier: 'epic',
      });
    }

    // 3. HITO: SUEÑO REPARADOR DE ÉLITE (7.5+ HORAS Y CALIDAD 85%+)
    if (metrics.sleepHours >= 7.5 && metrics.sleepQuality >= 85 && !hasMilestone('sleep')) {
      newCongratulations.push({
        id: `congrat_sleep_${now}`,
        timestamp: now,
        dateLabel,
        title: '💤 Regeneración Anabólica de Élite',
        message: `Tu ${brandName} analizó ${metrics.sleepHours}h de sueño con ${metrics.sleepQuality}% de calidad. Síntesis proteica y consolidación neural al 100%.`,
        speechText: `Diagnóstico de sueño excelente. Tu ${brandName} detectó más de siete horas y media de descanso reparador. Tu cuerpo está al máximo potencial anabólico.`,
        badgeEmoji: '💤',
        metricKey: 'sleep',
        metricValue: `${metrics.sleepHours}h (${metrics.sleepQuality}%)`,
        tier: 'triumph',
      });
    }

    // 4. HITO: ZONA CARDÍACA ANABÓLICA ÓPTIMA (BPM MÁXIMO ENTRE 135 Y 165)
    if (metrics.maxHeartRateToday >= 135 && metrics.maxHeartRateToday <= 165 && !hasMilestone('heart_rate')) {
      newCongratulations.push({
        id: `congrat_hr_${now}`,
        timestamp: now,
        dateLabel,
        title: '💓 Frecuencia Cardíaca en Zona Anabólica Ideal',
        message: `Pico cardiovascular registrado en ${metrics.maxHeartRateToday} BPM. Has mantenido una exigencia hemodinámica perfecta sin riesgo de sobreentrenamiento.`,
        speechText: `Frecuencia cardíaca en zona anabólica óptima. Tu sensor de pulso registró picos perfectos de bombeo miocárdico.`,
        badgeEmoji: '💓',
        metricKey: 'heart_rate',
        metricValue: `${metrics.maxHeartRateToday} BPM máx`,
        tier: 'epic',
      });
    }

    // 5. HITO: READINESS / VITALIDAD DE ÉLITE (90%+)
    if (metrics.readinessScore >= 90 && !hasMilestone('readiness')) {
      newCongratulations.push({
        id: `congrat_readiness_${now}`,
        timestamp: now,
        dateLabel,
        title: '⚡ Biometría en Estado Superhumano',
        message: `Tu índice de preparación física ha alcanzado un extraordinario ${metrics.readinessScore}%. Todos tus subsistemas fisiológicos están listos para el asalto.`,
        speechText: `¡Índice de preparación física al noventa por ciento! Tu biometría se encuentra en su cénit de potencia muscular y enfoque mental.`,
        badgeEmoji: '⚡',
        metricKey: 'readiness',
        metricValue: `${metrics.readinessScore}% Vitalidad`,
        tier: 'legendary',
      });
    }

    return newCongratulations;
  }

  /**
   * Reproduce la felicitación vocalizada por CORTEX con efectos sonoros y háptica
   */
  public static async speakCongratulation(congratulation: SmartwatchCongratulation) {
    try {
      SoundEffects.playLevelUp();
      Haptics.triumph();
      await CortexVoice.speak(congratulation.speechText);
    } catch (e) {
      console.warn('Error reproduciendo felicitación de CORTEX:', e);
    }
  }
}
