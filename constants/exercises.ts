export type EquipmentType =
  | 'none'
  | 'dumbbells'
  | 'pullup_bar'
  | 'dip_station'
  | 'gym'
  | 'barbell'
  | 'resistance_band'
  | 'other';

export interface DatasetExercise {
  id: string;
  name: string;
  body_part: string;
  category: string;
  equipment: string;
  fitriseEquipment: EquipmentType;
  target: string;
  secondary_muscles: string[];
  steps: string[];
  gif_url: string;
  image: string;
  media_id: string;
  difficulty: string;
  rank: string;
  baseSets: number;
  baseReps: string;
  targetCount: number;
  xpReward: number;
  cdnGifUrl: string;
  rawGifUrl: string;
  thumbnailUrl: string;
}

export interface ExerciseGuide {
  id: string;
  name: string;
  imageKey: string;
  gifUrl: string;
  cdnGifUrl: string;
  rawGifUrl: string;
  thumbnailUrl: string;
  muscles: string[];
  sets: number;
  reps: string;
  targetCount: number;
  difficulty: string;
  requiredEquipment: EquipmentType;
  cadence: { down: number; hold: number; up: number };
  jointMetrics: { label: string; target: string }[];
  steps: string[];
  cortexAdvice: string;
}

// Carga completa de los 1,324 ejercicios con soporte offline y CDN
export const EXERCISES_DATASET: DatasetExercise[] = require('./exercises_dataset.json');

// Mapeos rápidos para indexación y búsqueda O(1)
const EXERCISES_BY_ID = new Map<string, DatasetExercise>();
const EXERCISES_BY_NAME = new Map<string, DatasetExercise>();

EXERCISES_DATASET.forEach((ex) => {
  EXERCISES_BY_ID.set(ex.id, ex);
  EXERCISES_BY_NAME.set(ex.name.toLowerCase().trim(), ex);
});

// Mapa de alias tácticos para vincular rutinas existentes con los 1,324 ejercicios reales
export const ALIAS_MAP: Record<string, string> = {
  // Flexiones y Pecho
  pushups: '0662', // push-up
  pushups_assisted: '3216', // chest tap push-up
  diamond: '0259', // close-grip push-up
  bench_press: '0025', // barbell bench press
  dumbbell_bench_press: '0290', // dumbbell incline bench press

  // Sentadillas y Pierna
  squats: '0514', // jump squat
  squats_assisted: '3168', // bodyweight squatting row
  goblet_squat: '0399', // dumbbell squat
  barbell_squat: '0025', // barbell squat
  lunges: '3470', // forward lunge

  // Espalda y Tirón
  pullups: '0652', // pull-up
  pullups_assisted: '0017', // assisted pull-up
  lat_pulldown: '0150', // cable lat pulldown
  dumbbell_row: '0292', // dumbbell bent over row
  deadlift: '0032', // barbell deadlift

  // Brazos y Hombros
  curls: '0294', // dumbbell biceps curl
  barbell_curl: '0038', // barbell curl
  dips: '0009', // assisted chest dip
  dips_assisted: '0019', // assisted triceps dip
  tricep_extension: '0415', // dumbbell standing triceps extension
  overhead_press: '0286', // dumbbell alternate side press

  // Core y Cardio
  plank: '0464', // front plank with twist
  plank_assisted: '3239', // kneeling plank tap shoulder
  climbers: '0685', // mountain climber
  burpees: '1160', // burpee
  situps: '0001', // 3/4 sit-up
  air_bike: '0003', // air bike
};

// Objeto de compatibilidad vacío para transicionar sin errores de importación
export const ROBOT_IMAGES: Record<string, any> = {};

// Proxy dinámico para compatibilidad hacia atrás con código que acceda a EXERCISE_GUIDES[key]
export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = new Proxy({} as any, {
  get: (_, prop: string) => resolveExerciseGuide(prop),
});

// Fallback por defecto en caso de no coincidencia
const DEFAULT_FALLBACK_EXERCISE = EXERCISES_BY_ID.get('0662') || EXERCISES_DATASET[0];

/**
 * Traduce y formatea nombres técnicos al español para la interfaz de Cazador
 */
function formatExerciseTitle(name: string): string {
  if (!name) return 'Ejercicio Táctico';
  const clean = name.replace(/\(male\)|\(female\)/gi, '').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Genera métricas de control articular basadas en el objetivo muscular
 */
function getTargetMetrics(target: string): { label: string; target: string }[] {
  const t = (target || '').toLowerCase();
  if (t.includes('pectoral') || t.includes('chest') || t.includes('triceps')) {
    return [
      { label: 'Ángulo Codos', target: '45° óptimo' },
      { label: 'Alineación Torso', target: '180° neutra' },
      { label: 'Profundidad Pecho', target: '2 cm suelo' },
    ];
  }
  if (t.includes('quad') || t.includes('glute') || t.includes('leg')) {
    return [
      { label: 'Ángulo Rodillas', target: '90° paralelo' },
      { label: 'Alineación Talones', target: 'Anclaje total' },
      { label: 'Eje Columna', target: 'Torso erguido' },
    ];
  }
  if (t.includes('lat') || t.includes('back') || t.includes('spine')) {
    return [
      { label: 'Retracción Escapular', target: 'Bloqueo dorsal' },
      { label: 'Recorrido', target: 'Rango completo' },
      { label: 'Control Lumbar', target: 'Neutro estable' },
    ];
  }
  if (t.includes('abs') || t.includes('waist')) {
    return [
      { label: 'Tensión Abdominal', target: 'Contracción activa' },
      { label: 'Respiración', target: 'Exhalar al subir' },
      { label: 'Presión Cervical', target: '0% tensión cuello' },
    ];
  }
  return [
    { label: 'Control de Cadencia', target: '3s excéntrico' },
    { label: 'Rango de Movimiento', target: '100% completo' },
    { label: 'Tensión Continua', target: 'Sin balanceo inercial' },
  ];
}

/**
 * Resuelve cualquier identificador, nombre o búsqueda devolviendo la guía completa con su GIF
 */
export function resolveExerciseGuide(queryOrKey: string): ExerciseGuide {
  if (!queryOrKey) {
    return buildGuideFromDataset(DEFAULT_FALLBACK_EXERCISE);
  }

  const normalized = queryOrKey.toLowerCase().trim();

  // 1. Coincidencia por ID directo (ej: "0662")
  if (EXERCISES_BY_ID.has(normalized)) {
    return buildGuideFromDataset(EXERCISES_BY_ID.get(normalized)!);
  }

  // 2. Coincidencia por Alias Táctico (ej: "pushups", "squats", "bench_press")
  if (ALIAS_MAP[normalized] && EXERCISES_BY_ID.has(ALIAS_MAP[normalized])) {
    return buildGuideFromDataset(EXERCISES_BY_ID.get(ALIAS_MAP[normalized])!);
  }

  // 3. Coincidencia por Nombre Exacto
  if (EXERCISES_BY_NAME.has(normalized)) {
    return buildGuideFromDataset(EXERCISES_BY_NAME.get(normalized)!);
  }

  // 4. Búsqueda por Subcadena
  const matched = EXERCISES_DATASET.find((ex) => {
    const nameLow = ex.name.toLowerCase();
    return nameLow.includes(normalized) || normalized.includes(nameLow);
  });

  if (matched) {
    return buildGuideFromDataset(matched);
  }

  // 5. Fallback seguro
  return buildGuideFromDataset(DEFAULT_FALLBACK_EXERCISE);
}

function buildGuideFromDataset(item: DatasetExercise): ExerciseGuide {
  const muscles = [item.target, ...(item.secondary_muscles || [])].map(
    (m) => m.charAt(0).toUpperCase() + m.slice(1)
  );

  return {
    id: item.id,
    name: formatExerciseTitle(item.name),
    imageKey: item.id,
    gifUrl: item.cdnGifUrl,
    cdnGifUrl: item.cdnGifUrl,
    rawGifUrl: item.rawGifUrl,
    thumbnailUrl: item.thumbnailUrl,
    muscles,
    sets: item.baseSets || 3,
    reps: item.baseReps || '10 - 12 reps lentas',
    targetCount: item.targetCount || 10,
    difficulty: item.difficulty || 'Intermedio',
    requiredEquipment: item.fitriseEquipment,
    cadence: { down: 3, hold: 1, up: 2 },
    jointMetrics: getTargetMetrics(item.target),
    steps: item.steps && item.steps.length > 0 ? item.steps : [
      'Adopta la postura inicial asegurando la alineación corporal.',
      'Inicia la fase excéntrica de manera controlada durante 3 segundos.',
      'Mantén una breve pausa en el punto de máxima contracción.',
      'Regresa a la posición de inicio con potencia constante.',
    ],
    cortexAdvice: `CORTEX directriz: concéntrate en activar ${item.target || 'el músculo objetivo'}. El control de cadencia supera a la velocidad.`,
  };
}

/**
 * Búsqueda y filtrado dinámico en los 1,324 ejercicios
 */
export function searchExercises(
  query: string,
  filters?: { bodyPart?: string; equipment?: EquipmentType }
): DatasetExercise[] {
  const q = (query || '').toLowerCase().trim();
  return EXERCISES_DATASET.filter((ex) => {
    if (filters?.bodyPart && filters.bodyPart !== 'all' && ex.body_part !== filters.bodyPart) {
      return false;
    }
    if (filters?.equipment && filters.equipment !== 'other' && ex.fitriseEquipment !== filters.equipment) {
      return false;
    }
    if (!q) return true;
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.target.toLowerCase().includes(q) ||
      ex.body_part.toLowerCase().includes(q) ||
      (ex.steps && ex.steps.some((s) => s.toLowerCase().includes(q)))
    );
  });
}

/**
 * Verifica si un ejercicio es compatible con el equipamiento disponible del usuario
 */
export function isExerciseAvailable(
  exerciseKeyOrId: string,
  userEquipment: string[]
): boolean {
  const guide = resolveExerciseGuide(exerciseKeyOrId);
  const eq = guide.requiredEquipment;

  if (eq === 'none') return true;
  if (userEquipment.includes('gym')) return true;
  if (eq === 'dumbbells' && (userEquipment.includes('dumbbells') || userEquipment.includes('gym'))) return true;
  if (eq === 'barbell' && (userEquipment.includes('barbell') || userEquipment.includes('gym'))) return true;
  if (eq === 'resistance_band' && (userEquipment.includes('resistance_band') || userEquipment.includes('gym'))) return true;
  if (eq === 'pullup_bar' && (userEquipment.includes('pullup_bar') || userEquipment.includes('gym'))) return true;

  return false;
}

/**
 * Encuentra la alternativa más cercana 100% peso corporal (sin equipo)
 */
export function getBodyweightAlternativeKey(exerciseKeyOrId: string): string {
  const guide = resolveExerciseGuide(exerciseKeyOrId);
  const target = (guide.muscles[0] || '').toLowerCase();

  if (target.includes('pectoral') || target.includes('chest') || target.includes('triceps')) {
    return '0662'; // push-up
  }
  if (target.includes('quad') || target.includes('glute') || target.includes('leg')) {
    return '0514'; // jump squat
  }
  if (target.includes('lat') || target.includes('back')) {
    return '0652'; // pull-up
  }
  if (target.includes('abs') || target.includes('waist')) {
    return '0464'; // front plank with twist
  }
  return '0662';
}

/**
 * Adapta el circuito para el usuario según:
 * 1. Restricción de equipamiento
 * 2. Nivel de experiencia (Principiante / Intermedio / Avanzado)
 * 3. Nivel de la aplicación (user.level)
 */
export function adaptCircuitForUser<T extends {
  id?: string;
  name?: string;
  imageKey?: string;
  sets?: number;
  targetCount?: number;
  xpReward?: number;
  repsLabel?: string;
  muscles?: string[];
  restTimeSeconds?: number;
}>(
  circuit: T[],
  userProfile?: {
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    level?: number;
    equipment?: string[];
  }
): T[] {
  const fitnessLevel = userProfile?.fitnessLevel || 'beginner';
  const appLevel = Math.max(userProfile?.level || 1, 1);
  const equipment = userProfile?.equipment || ['none'];
  const hasGym = equipment.includes('gym');
  const hasDumbbells = equipment.includes('dumbbells') || equipment.includes('barbell') || hasGym;
  const isPureBodyweight = equipment.includes('none') && !hasGym && !hasDumbbells;

  return circuit.map((item) => {
    let exerciseKey = item.id || item.imageKey || '0662';

    // 1. RESTRICCIÓN DE EQUIPAMIENTO
    if (isPureBodyweight) {
      if (!isExerciseAvailable(exerciseKey, ['none'])) {
        exerciseKey = getBodyweightAlternativeKey(exerciseKey);
      }
    } else if (hasGym) {
      if (exerciseKey === 'pushups' || exerciseKey === '0662') exerciseKey = '0025'; // bench press
      else if (exerciseKey === 'pullups' || exerciseKey === '0652') exerciseKey = '0150'; // lat pulldown
      else if (exerciseKey === 'squats' && appLevel >= 5) exerciseKey = '0399'; // dumbbell squat
      else if (exerciseKey === 'curls') exerciseKey = '0038'; // barbell curl
    } else if (hasDumbbells) {
      if (exerciseKey === 'pushups' && appLevel >= 6) exerciseKey = '0286'; // overhead press
      else if (exerciseKey === 'squats') exerciseKey = '0399'; // dumbbell squat
      else if (exerciseKey === 'curls') exerciseKey = '0294'; // dumbbell curl
    }

    // 2. NIVEL DE EXPERIENCIA
    if (fitnessLevel === 'beginner') {
      if (exerciseKey === '0662' || exerciseKey === '0025') exerciseKey = '3216'; // chest tap push-up
      else if (exerciseKey === '0514' || exerciseKey === '0399') exerciseKey = '3168'; // squatting row
      else if (exerciseKey === '0652') exerciseKey = '0017'; // assisted pull-up
      else if (exerciseKey === '0464') exerciseKey = '3239'; // kneeling plank
    }

    const guide = resolveExerciseGuide(exerciseKey);

    // 3. INTENSIFICACIÓN POR NIVEL DE CAZADOR
    let scaledSets = item.sets || guide.sets || 3;
    if (appLevel >= 15) {
      scaledSets = Math.min(scaledSets + 1, 5);
    } else if (appLevel >= 8 && fitnessLevel !== 'beginner') {
      scaledSets = Math.min(scaledSets, 4);
    }

    const baseTarget = guide.targetCount || item.targetCount || 10;
    const isTimed = guide.name.toLowerCase().includes('plank') || guide.name.toLowerCase().includes('stretch');
    let scaledTarget = baseTarget;

    if (isTimed) {
      scaledTarget = Math.min(baseTarget + (appLevel - 1) * 3, 60);
    } else {
      const bonusReps = Math.min(Math.floor((appLevel - 1) / 3), 8);
      scaledTarget = baseTarget + bonusReps;
      if (fitnessLevel === 'beginner') {
        scaledTarget = Math.min(scaledTarget, 12);
      }
    }

    // Descanso táctico
    let scaledRest = 20;
    if (fitnessLevel === 'beginner') {
      scaledRest = 30;
    } else if (appLevel >= 12) {
      scaledRest = 15;
    }

    const baseXP = item.xpReward || 35;
    const scaledXP = baseXP + Math.floor(appLevel * 1.5);

    const repsLabel = isTimed
      ? `${scaledTarget}s de tensión`
      : `${scaledTarget} reps lentas`;

    return {
      ...item,
      id: guide.id,
      name: guide.name,
      targetCount: scaledTarget,
      repsLabel,
      imageKey: guide.id,
      muscles: guide.muscles,
      sets: scaledSets,
      restTimeSeconds: scaledRest,
      xpReward: scaledXP,
    };
  });
}

export function validateAndAdaptCircuit(
  circuit: any[],
  userEquipment: string[] = ['none']
): { adaptedCircuit: any[]; changedCount: number } {
  let changed = 0;
  const isPureBodyweight = userEquipment.includes('none') && !userEquipment.includes('gym') && !userEquipment.includes('dumbbells');

  const adaptedCircuit = circuit.map((item) => {
    let key = item.id || item.imageKey;
    if (isPureBodyweight && !isExerciseAvailable(key, ['none'])) {
      key = getBodyweightAlternativeKey(key);
      changed++;
    }
    const guide = resolveExerciseGuide(key);
    return {
      ...item,
      id: guide.id,
      name: guide.name,
      imageKey: guide.id,
      muscles: guide.muscles,
    };
  });

  return { adaptedCircuit, changedCount: changed };
}
