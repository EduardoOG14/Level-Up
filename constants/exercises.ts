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
  isKneeSafe?: boolean;
  isLowImpact?: boolean;
  orthopedicNote?: string;
  adaptedForJointSafety?: boolean;
}

export interface UserAdaptationProfile {
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  level?: number;
  equipment?: string[];
  weight?: number;
  height?: number;
  kneeFriendly?: boolean;
}

// Carga completa de los 1,324 ejercicios con soporte offline y CDN
export const EXERCISES_DATASET: DatasetExercise[] = require('./exercises_dataset.json');

// Mapeos rápidos para indexación y búsqueda O(1)
export const EXERCISES_BY_ID = new Map<string, DatasetExercise>();
export const EXERCISES_BY_NAME = new Map<string, DatasetExercise>();

EXERCISES_DATASET.forEach((ex) => {
  EXERCISES_BY_ID.set(ex.id, ex);
  EXERCISES_BY_NAME.set(ex.name.toLowerCase().trim(), ex);
});

/**
 * Mapa de alias tácticos validados biomecánicamente.
 * Cada identificador apunta exactamente al ejercicio anatómico correcto y a su animación visual.
 */
export const ALIAS_MAP: Record<string, string> = {
  // Flexiones y Pectoral
  pushups: '0662', // push-up estándar
  pushups_assisted: '0493', // incline push-up (regresión correcta, bajo impacto en muñeca y hombro)
  diamond: '0283', // diamond push-up (tríceps y pectoral esternal)
  bench_press: '0025', // barbell bench press (press de banca plano)
  dumbbell_bench_press: '0289', // dumbbell bench press (press con mancuernas en banca plana)

  // Sentadillas y Pierna (Sin impacto nocivo en rodillas)
  squats: '3119', // potty squat (sentadilla libre profunda controlada, sin saltos)
  squats_assisted: '3132', // potty squat with support (sentadilla asistida con apoyo, cero impacto en rodilla)
  jump_squat: '0514', // jump squat (solo para rango avanzado sin sobrepeso)
  goblet_squat: '1760', // dumbbell goblet squat (sentadilla goblet vertical)
  barbell_squat: '0043', // barbell full squat (sentadilla trasera con barra)
  box_squat: '0026', // barbell bench squat / box squat (óptima para rodillas seguras)
  lunges: '3470', // forward lunge (zancada hacia adelante)
  rear_lunge: '0381', // dumbbell rear lunge (zancada inversa - reduce cizallamiento en rótula)
  glute_bridge: '3013', // low glute bridge on floor (cadena posterior sin compresión patelar)
  glute_bridge_march: '3561', // glute bridge march (activación unilateral de glúteo sin impacto)

  // Espalda y Tirón
  pullups: '0652', // pull-up pronada
  pullups_assisted: '0017', // assisted pull-up (dominada asistida)
  lat_pulldown: '0150', // cable bar lateral pulldown (jalón al pecho en polea)
  dumbbell_row: '0292', // dumbbell one arm bent-over row (remo con mancuerna a una mano)
  deadlift: '0032', // barbell deadlift (peso muerto convencional con barra)

  // Brazos y Hombros
  curls: '0294', // dumbbell biceps curl (curl de bíceps con mancuerna)
  barbell_curl: '0031', // barbell curl (curl estricto con barra)
  dips: '0251', // chest dip (fondos en paralelas)
  dips_assisted: '0129', // bench dip (knees bent - fondos asistidos en banco)
  tricep_extension: '0430', // dumbbell standing triceps extension (extensión de tríceps vertical)
  overhead_press: '0426', // dumbbell standing overhead press (press militar de hombros con mancuernas)
  pike: '3662', // pike-to-cobra push-up (press vertical en pica)

  // Core y Cardio Funcional
  plank: '0464', // front plank with twist (plancha frontal dinámica)
  plank_assisted: '3239', // kneeling plank tap shoulder (plancha de rodillas)
  climbers: '0630', // mountain climber (escaladores de montaña reales)
  burpees: '1160', // burpee estándar
  situps: '0001', // 3/4 sit-up
  air_bike: '0003', // air bike (bicicleta abdominal cruzada)
};

/**
 * Ejercicios de Alto Impacto para rodillas (fuerzas de impacto reactivas al suelo o compresión patelar extrema)
 */
export const HIGH_IMPACT_KNEE_IDS = new Set<string>([
  '0514', // jump squat
  '0513', // jump squat v. 2
  '3543', // bodyweight drop jump squat
  '1160', // burpee
  '3582', // lunge with jump
  '1489', // sissy squat (compresión rotuliana extrema)
  '1759', // single leg pistol squat
  '1472', // forward jump
  '1473', // backward jump
  '0053', // barbell jump squat
  '0371', // dumbbell plyo squat
  '2798', // barbell squat jump step rear lunge
]);

/**
 * Sustituciones ortopédicas de bajo impacto clínicamente seguras
 */
export const KNEE_SAFE_REPLACEMENTS: Record<string, string> = {
  // Saltos y Burpees -> Reemplazos de cero impacto
  '0514': '3132', // jump squat -> sentadilla asistida con apoyo
  '0513': '3132', // jump squat v.2 -> sentadilla asistida con apoyo
  '3543': '3132', // drop jump squat -> sentadilla asistida con apoyo
  '1160': '0493', // burpee -> flexión inclinada / step bajo impacto
  '3582': '0381', // lunge jump -> zancada inversa con mancuerna
  '1489': '3132', // sissy squat -> sentadilla con apoyo
  '1759': '3119', // pistol squat -> sentadilla libre a dos piernas
  '1472': '3561', // forward jump -> puente de glúteos march
  '1473': '3561', // backward jump -> puente de glúteos march
  '0053': '0026', // barbell jump squat -> box squat con barra
  '0371': '0291', // dumbbell plyo squat -> dumbbell bench squat
  '2798': '0381', // barbell squat jump step -> zancada trasera
  // Alias directos
  burpees: '0493', // flexión inclinada
  jump_squat: '3132', // sentadilla asistida
  lunges: '0381', // zancada inversa (menos estrés patelar)
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
 * Genera métricas de control articular basadas en el objetivo muscular y principios ortopédicos
 */
function getTargetMetrics(target: string): { label: string; target: string }[] {
  const t = (target || '').toLowerCase();
  if (t.includes('pectoral') || t.includes('chest') || t.includes('triceps')) {
    return [
      { label: 'Ángulo Codos', target: '45° neutro (salud hombro)' },
      { label: 'Retracción Escapular', target: '100% activa y deprimida' },
      { label: 'Alineación Torso', target: 'Columna en eje neutro' },
    ];
  }
  if (t.includes('quad') || t.includes('glute') || t.includes('leg') || t.includes('calves')) {
    return [
      { label: 'Ángulo Rodillas', target: '90° paralelo seguro' },
      { label: 'Valgo Rotuliano', target: '0° (rodilla alineada al 2º dedo)' },
      { label: 'Empuje Plantar', target: 'Trípode talón y metatarsos' },
    ];
  }
  if (t.includes('lat') || t.includes('back') || t.includes('spine') || t.includes('traps')) {
    return [
      { label: 'Depresión Escapular', target: 'Bloqueo dorsal previo' },
      { label: 'Curvatura Lumbar', target: 'Neutra (sin hiperextensión)' },
      { label: 'Recorrido', target: 'Rango concéntrico completo' },
    ];
  }
  if (t.includes('abs') || t.includes('waist') || t.includes('core')) {
    return [
      { label: 'Retroversión Pélvica', target: 'Glúteos y transverso activo' },
      { label: 'Presión Lumbar', target: '0% curvatura despegada' },
      { label: 'Respiración Diafragmática', target: 'Exhalar en compresión' },
    ];
  }
  return [
    { label: 'Cadencia Excéntrica', target: '3s descenso controlado' },
    { label: 'Rango de Movimiento', target: '100% seguro y sin rebote' },
    { label: 'Tensión Mecánica', target: 'Continua en fase activa' },
  ];
}

/**
 * Instrucciones clínicas CORTEX validadas por entrenador, nutriólogo y médico deportivo
 */
function getClinicalCortexAdvice(
  name: string,
  target: string,
  bodyPart: string,
  isKneeSafe: boolean = true
): string {
  const n = (name || '').toLowerCase();
  const t = (target || '').toLowerCase();
  const b = (bodyPart || '').toLowerCase();

  if (n.includes('squat') || n.includes('sentadilla') || b.includes('leg')) {
    if (!isKneeSafe) {
      return 'CORTEX Alerta Articular: Ejercicio balístico de alto impacto. Amortigua la caída cayendo suavemente sobre la puntera y flexionando de inmediato las rodillas en 90° sin dejar que colapsen hacia dentro.';
    }
    return 'CORTEX Biomecánica: Rodillas siempre alineadas con el segundo dedo del pie (evita valgo). Desciende empujando cadera atrás y sube empujando desde los talones. Inhala al bajar, exhala con fuerza al subir.';
  }

  if (n.includes('lunge') || n.includes('zancada')) {
    return 'CORTEX Biomecánica: Mantén el torso vertical y la tibia delantera casi perpendicular al suelo (90°). No permitas que la rodilla sobrepase bruscamente la punta del pie para proteger el ligamento patelofemoral.';
  }

  if (n.includes('push-up') || n.includes('flexi') || n.includes('bench') || t.includes('pectoral')) {
    return 'CORTEX Biomecánica: Codos en ángulo de 45° con respecto al torso (forma de flecha, no de T) para evitar pinzamiento subacromial. Mantén escápulas retraídas y glúteos contraídos. Inhala al bajar, exhala al empujar.';
  }

  if (n.includes('pull') || n.includes('row') || n.includes('remo') || b.includes('back')) {
    return 'CORTEX Biomecánica: Inicia la tracción bajando los hombros (depresión escapular) antes de doblar los codos. Mantén la columna lumbar neutra y exhala en el punto de máxima contracción dorsal.';
  }

  if (n.includes('plank') || n.includes('plancha') || t.includes('abs')) {
    return 'CORTEX Biomecánica: Activa retroversión pélvica ligera (apretar glúteos y meter ombligo hacia la columna). Evita hundir la zona lumbar. Respiración corta, constante y rítmica sin apneas.';
  }

  if (n.includes('burpee')) {
    return 'CORTEX Biomecánica: Apoya las manos firmes antes de llevar las piernas atrás. Al saltar adelante, aterriza con pie plano y talón para amortiguar el impacto en meniscos.';
  }

  return `CORTEX Directiva: Controla la cadencia excéntrica (3 segundos) para maximizar la tensión muscular. Inhala en la fase negativa y exhala al aplicar fuerza concéntrica.`;
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

  const isHighImpact = HIGH_IMPACT_KNEE_IDS.has(item.id);
  const isKneeSafe = !isHighImpact;
  const isLowImpact =
    item.equipment === 'cable' ||
    item.fitriseEquipment === 'none' && !isHighImpact ||
    item.name.toLowerCase().includes('bridge') ||
    item.name.toLowerCase().includes('incline');

  const orthopedicNote = isKneeSafe
    ? 'Apto para articulaciones y sobrepeso: Cero cizallamiento en ligamento patelar.'
    : 'Alto impacto articular: Requiere buena masa muscular y técnica para amortiguar.';

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
      'Adopta la postura inicial asegurando la alineación corporal y curvatura lumbar neutra.',
      'Inicia la fase excéntrica inhalando de manera controlada durante 3 segundos.',
      'Mantén una breve pausa isométrica de 1 segundo en el punto de contracción.',
      'Regresa a la posición inicial exhalando con potencia y sin balanceo inercial.',
    ],
    cortexAdvice: getClinicalCortexAdvice(item.name, item.target, item.body_part, isKneeSafe),
    isKneeSafe,
    isLowImpact,
    orthopedicNote,
  };
}

/**
 * Búsqueda y filtrado dinámico en los 1,324 ejercicios
 */
export function searchExercises(
  query: string,
  filters?: { bodyPart?: string; equipment?: EquipmentType; onlyKneeSafe?: boolean }
): DatasetExercise[] {
  const q = (query || '').toLowerCase().trim();
  return EXERCISES_DATASET.filter((ex) => {
    if (filters?.onlyKneeSafe && HIGH_IMPACT_KNEE_IDS.has(ex.id)) {
      return false;
    }
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
 * Garantiza que para tren inferior NUNCA devuelva saltos lesivos.
 */
export function getBodyweightAlternativeKey(
  exerciseKeyOrId: string,
  kneeFriendly: boolean = false
): string {
  const guide = resolveExerciseGuide(exerciseKeyOrId);
  const target = (guide.muscles[0] || '').toLowerCase();

  if (target.includes('pectoral') || target.includes('chest') || target.includes('triceps')) {
    return '0662'; // push-up
  }
  if (target.includes('quad') || target.includes('glute') || target.includes('leg')) {
    return kneeFriendly ? '3132' : '3119'; // potty squat with support o potty squat (JAMÁS jump squat 0514)
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
 * ADAPTADOR CLÍNICO INTEGRAL PARA EL CAZADOR:
 * Valida y adapta cada ejercicio del circuito según:
 * 1. Riesgo ortopédico y masa corporal (IMC >= 27.5 o peso >= 90kg o rodilla sensible) -> CERO IMPACTO EN RODILLAS
 * 2. Disponibilidad de equipamiento (gimnasio, mancuernas, peso corporal)
 * 3. Nivel de experiencia del cazador (Principiante / Intermedio / Avanzado)
 * 4. Nivel del Sistema CORTEX (user.level)
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
  isKneeSafe?: boolean;
  adaptedForJointSafety?: boolean;
}>(
  circuit: T[],
  userProfile?: UserAdaptationProfile
): T[] {
  const fitnessLevel = userProfile?.fitnessLevel || 'beginner';
  const appLevel = Math.max(userProfile?.level || 1, 1);
  const equipment = userProfile?.equipment || ['none'];
  const hasGym = equipment.includes('gym');
  const hasDumbbells = equipment.includes('dumbbells') || equipment.includes('barbell') || hasGym;
  const isPureBodyweight = equipment.includes('none') && !hasGym && !hasDumbbells;

  // Evaluación biométrica del cazador (Médico deportivo & Entrenador)
  const weight = userProfile?.weight || 70;
  const height = userProfile?.height || 175;
  const heightM = height / 100;
  const bmi = heightM > 0 ? weight / (heightM * heightM) : 22.8;

  const isHighWeight = weight >= 90;
  const isHighBMI = bmi >= 27.5;
  const isKneeSensitive =
    userProfile?.kneeFriendly === true ||
    isHighWeight ||
    isHighBMI ||
    fitnessLevel === 'beginner';

  return circuit.map((item) => {
    let exerciseKey = item.id || item.imageKey || '0662';
    let wasAdaptedForJointSafety = false;

    // 1. FILTRADO Y PROTECCIÓN ARTICULAR DE RODILLAS
    if (isKneeSensitive) {
      const currentId = ALIAS_MAP[exerciseKey] || exerciseKey;
      if (HIGH_IMPACT_KNEE_IDS.has(currentId) || exerciseKey === 'burpees' || exerciseKey === 'jump_squat') {
        const replacement = KNEE_SAFE_REPLACEMENTS[currentId] || KNEE_SAFE_REPLACEMENTS[exerciseKey] || '3132';
        exerciseKey = replacement;
        wasAdaptedForJointSafety = true;
      }
    }

    // 2. RESTRICCIÓN DE EQUIPAMIENTO
    if (isPureBodyweight) {
      if (!isExerciseAvailable(exerciseKey, ['none'])) {
        exerciseKey = getBodyweightAlternativeKey(exerciseKey, isKneeSensitive);
      }
    } else if (hasGym) {
      if (exerciseKey === 'pushups' || exerciseKey === '0662') exerciseKey = '0025'; // bench press
      else if (exerciseKey === 'pullups' || exerciseKey === '0652') exerciseKey = '0150'; // lat pulldown
      else if (exerciseKey === 'squats' && appLevel >= 5) exerciseKey = isKneeSensitive ? '0026' : '0043'; // box squat o full squat
      else if (exerciseKey === 'curls') exerciseKey = '0031'; // barbell curl
    } else if (hasDumbbells) {
      if (exerciseKey === 'pushups' && appLevel >= 6) exerciseKey = '0289'; // dumbbell bench press
      else if (exerciseKey === 'squats') exerciseKey = isKneeSensitive ? '0291' : '1760'; // dumbbell bench squat o goblet squat
      else if (exerciseKey === 'curls') exerciseKey = '0294'; // dumbbell curl
    }

    // 3. NIVEL DE EXPERIENCIA (Principiante / Intermedio / Avanzado)
    if (fitnessLevel === 'beginner') {
      if (exerciseKey === '0662' || exerciseKey === '0025') exerciseKey = '0493'; // incline push-up
      else if (exerciseKey === '0514' || exerciseKey === '3119') exerciseKey = '3132'; // potty squat with support
      else if (exerciseKey === '0652') exerciseKey = '0017'; // assisted pull-up
      else if (exerciseKey === '0464') exerciseKey = '3239'; // kneeling plank
    }

    const guide = resolveExerciseGuide(exerciseKey);

    // 4. DOSIFICACIÓN DE SERIES Y REPETICIONES
    let scaledSets = item.sets || guide.sets || 3;
    if (fitnessLevel === 'beginner') {
      scaledSets = Math.min(scaledSets, 3);
    } else if (appLevel >= 15) {
      scaledSets = Math.min(scaledSets + 1, 5);
    } else if (appLevel >= 8) {
      scaledSets = Math.min(scaledSets, 4);
    }

    const baseTarget = guide.targetCount || item.targetCount || 10;
    const isTimed = guide.name.toLowerCase().includes('plank') || guide.name.toLowerCase().includes('stretch');
    let scaledTarget = baseTarget;

    if (isTimed) {
      scaledTarget = Math.min(baseTarget + (appLevel - 1) * 3, 60);
    } else {
      const bonusReps = Math.min(Math.floor((appLevel - 1) / 3), 6);
      scaledTarget = baseTarget + bonusReps;
      if (fitnessLevel === 'beginner') {
        scaledTarget = Math.min(scaledTarget, 10);
      }
    }

    // 5. INTERVALOS DE RECUPERACIÓN CARDIOVASCULAR Y METABÓLICA
    let scaledRest = 20;
    if (fitnessLevel === 'beginner' || isKneeSensitive) {
      scaledRest = 35; // Mayor depuración de lactato y control de fatiga para evitar fallas técnicas
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
      isKneeSafe: guide.isKneeSafe,
      adaptedForJointSafety: wasAdaptedForJointSafety || (guide.isKneeSafe && isKneeSensitive),
    };
  });
}

/**
 * Valida un circuito garantizando que no contenga ejercicios inaccesibles o incompatibles
 */
export function validateAndAdaptCircuit(
  circuit: any[],
  userEquipment: string[] = ['none'],
  kneeFriendly: boolean = false
): { adaptedCircuit: any[]; changedCount: number } {
  let changed = 0;
  const isPureBodyweight =
    userEquipment.includes('none') &&
    !userEquipment.includes('gym') &&
    !userEquipment.includes('dumbbells');

  const adaptedCircuit = circuit.map((item) => {
    let key = item.id || item.imageKey;
    if (kneeFriendly && HIGH_IMPACT_KNEE_IDS.has(ALIAS_MAP[key] || key)) {
      key = KNEE_SAFE_REPLACEMENTS[key] || '3132';
      changed++;
    }
    if (isPureBodyweight && !isExerciseAvailable(key, ['none'])) {
      key = getBodyweightAlternativeKey(key, kneeFriendly);
      changed++;
    }
    const guide = resolveExerciseGuide(key);
    return {
      ...item,
      id: guide.id,
      name: guide.name,
      imageKey: guide.id,
      muscles: guide.muscles,
      isKneeSafe: guide.isKneeSafe,
    };
  });

  return { adaptedCircuit, changedCount: changed };
}
