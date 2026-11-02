import { adaptCircuitForUser, validateAndAdaptCircuit } from './exercises';

export type PlanType = 'daily' | 'weekly' | 'monthly';

export interface CircuitExercise {
  id: string; // guideKey in EXERCISE_GUIDES
  name: string;
  targetCount: number;
  repsLabel: string;
  imageKey: string;
  muscles: string[];
  sets: number;
  restTimeSeconds: number; // 20s as requested
  xpReward: number;
}

export interface PlanDay {
  dayNumber: number;
  title: string;
  focus: string;
  duration: number; // minutes
  exercisesCount: number;
  xpReward: number;
  isRestDay?: boolean;
  circuit?: CircuitExercise[];
}

export interface TrainingPlan {
  id: string;
  type: PlanType;
  title: string;
  subtitle: string;
  description: string;
  durationLabel: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  targetAttribute: 'Fuerza' | 'Agilidad' | 'Vitalidad' | 'Mente';
  attributeColor: string;
  totalXPReward: number;
  emoji: string;
  daysSchedule: PlanDay[];
}

export const TRAINING_PLANS: TrainingPlan[] = [
  // =========================================================================
  // 1. PLANES DIARIOS (Misiones Tácticas de 1 Día CORTEX)
  // =========================================================================
  {
    id: 'daily_beginner_foundation',
    type: 'daily',
    title: 'Iniciación Articular E-Rank',
    subtitle: 'Cero impacto, control motor y lubricación sinovial',
    description: 'Protocolo de preservación articular y adaptación neuromuscular. Sin saltos ni cizallamiento en rodillas. Diseñado para principiantes o personas con sobrepeso por medicina deportiva.',
    durationLabel: '1 Día • 20 min',
    difficulty: 'Principiante',
    targetAttribute: 'Vitalidad',
    attributeColor: '#10B981',
    totalXPReward: 150,
    emoji: '🌱',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Cimientos Seguros',
        focus: 'Cuádriceps asistidos, Glúteos y Core sin impacto',
        duration: 20,
        exercisesCount: 5,
        xpReward: 150,
        circuit: [
          { id: 'squats_assisted', name: 'Sentadillas Asistidas con Apoyo', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'squats_assisted', muscles: ['Cuádriceps', 'Glúteos'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'pushups_assisted', name: 'Flexiones Inclinadas de Pecho', targetCount: 10, repsLabel: '10 reps controladas', imageKey: 'pushups_assisted', muscles: ['Pectorales', 'Tríceps'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'glute_bridge', name: 'Puente de Glúteos en Suelo', targetCount: 12, repsLabel: '12 reps con contracción', imageKey: 'glute_bridge', muscles: ['Glúteos', 'Isquiotibiales'], sets: 3, restTimeSeconds: 30, xpReward: 30 },
          { id: 'glute_bridge_march', name: 'Marcha Pélvica en Suelo', targetCount: 12, repsLabel: '12 reps alternadas', imageKey: 'glute_bridge_march', muscles: ['Glúteos', 'Estabilidad pélvica'], sets: 3, restTimeSeconds: 30, xpReward: 30 },
          { id: 'plank_assisted', name: 'Plancha Isométrica sobre Rodillas', targetCount: 10, repsLabel: '20s de tensión abdominal', imageKey: 'plank_assisted', muscles: ['Core', 'Transverso'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
        ],
      },
    ],
  },
  {
    id: 'daily_fullbody_titan',
    type: 'daily',
    title: 'Full Body Despertado',
    subtitle: 'Sobrecarga global de cuerpo completo',
    description: 'Protocolo de alta demanda muscular diseñado por CORTEX. Activa fibras rápidas y potencia fuerza en 35 minutos integrando empuje, tirón, piernas y core.',
    durationLabel: '1 Día • 35 min',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#EF4444',
    totalXPReward: 190,
    emoji: '⚔️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Combate Total',
        focus: 'Pecho, Espalda, Piernas y Core',
        duration: 35,
        exercisesCount: 6,
        xpReward: 190,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pectorales', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'dumbbell_row', name: 'Remo con Mancuerna Unilateral', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Dorsales', 'Espalda media'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps estrictas', imageKey: 'overhead_press', muscles: ['Deltoides', 'Trapecios'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 12, repsLabel: '12 reps alternadas', imageKey: 'lunges', muscles: ['Glúteos', 'Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '35s de tensión', imageKey: 'plank', muscles: ['Core', 'Transverso'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
    ],
  },
  {
    id: 'daily_upper_spartan',
    type: 'daily',
    title: 'Spartan Tren Superior',
    subtitle: 'Sobrecarga de empuje y tirón para torso',
    description: 'Enfoque táctico en deltoides, pectorales, dorsales y brazos con cadencia controlada y máxima tensión mecánica.',
    durationLabel: '1 Día • 30 min',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#F59E0B',
    totalXPReward: 175,
    emoji: '🦾',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Torso Espartano',
        focus: 'Pecho, Espalda y Brazos',
        duration: 30,
        exercisesCount: 5,
        xpReward: 175,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pectorales', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'dumbbell_row', name: 'Remo con Mancuerna Unilateral', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Dorsales', 'Romboides'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'overhead_press', muscles: ['Deltoides', 'Trapecios'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps', targetCount: 12, repsLabel: '12 reps continuas', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'barbell_curl', muscles: ['Bíceps', 'Antebrazos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      },
    ],
  },
  {
    id: 'daily_lower_colossus',
    type: 'daily',
    title: 'Coloso Tren Inferior',
    subtitle: 'Potencia de piernas y cadena posterior',
    description: 'Protocolo de hipertrofia y fuerza para cuádriceps, glúteos e isquiotibiales con estímulo unilateral y estabilidad.',
    durationLabel: '1 Día • 30 min',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#10B981',
    totalXPReward: 170,
    emoji: '🦵',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Cimientos de Acero',
        focus: 'Cuádriceps, Isquios y Glúteos',
        duration: 30,
        exercisesCount: 5,
        xpReward: 170,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 8, repsLabel: '8 reps pesadas', imageKey: 'deadlift', muscles: ['Isquios', 'Glúteos', 'Espalda baja'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'squats', name: 'Sentadillas Profundas', targetCount: 15, repsLabel: '15 reps lentas', imageKey: 'squats', muscles: ['Cuádriceps', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 12, repsLabel: '12 reps dinámicas', imageKey: 'lunges', muscles: ['Glúteos', 'Estabilidad'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core', 'Transverso'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
    ],
  },
  {
    id: 'daily_hiit_shadow',
    type: 'daily',
    title: 'Sombra Metabólica HIIT',
    subtitle: 'Cardio anaeróbico, agilidad y quema calórica',
    description: 'Intervalos tácticos sin tregua para elevar la tasa metabólica basal y potenciar el rendimiento cardiovascular.',
    durationLabel: '1 Día • 25 min',
    difficulty: 'Avanzado',
    targetAttribute: 'Agilidad',
    attributeColor: '#00F0FF',
    totalXPReward: 160,
    emoji: '⚡',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Ráfaga de Choque',
        focus: 'Resistencia Metabólica y Velocidad',
        duration: 25,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'burpees', name: 'Burpees Tácticos', targetCount: 12, repsLabel: '12 reps explosivas', imageKey: 'burpees', muscles: ['Cuerpo completo', 'Cardio'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 20, repsLabel: '20 reps dinámicas', imageKey: 'climbers', muscles: ['Core', 'Flexores cadera'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'squats', name: 'Sentadillas Profundas', targetCount: 15, repsLabel: '15 reps continuas', imageKey: 'squats', muscles: ['Piernas', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 12, repsLabel: '12 reps de empuje', imageKey: 'pushups', muscles: ['Pectorales', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core', 'Transverso'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
    ],
  },
  {
    id: 'daily_push_hypertrophy',
    type: 'daily',
    title: 'Pectoral de Acero & Tríceps',
    subtitle: 'Sobrecarga de empuje con tensión mecánica continua',
    description: 'Protocolo de alta hipertrofia enfocado en pectoral mayor, porción clavicular, tríceps y deltoides anterior. Ideal para los Lunes.',
    durationLabel: '1 Día • 32 min',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#EF4444',
    totalXPReward: 180,
    emoji: '🛡️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Asalto de Empuje',
        focus: 'Pecho, Deltoides Anterior y Tríceps',
        duration: 32,
        exercisesCount: 5,
        xpReward: 180,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'bench_press', muscles: ['Pectorales', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'pushups', name: 'Flexiones Militares Profundas', targetCount: 15, repsLabel: '15 reps con pausa', imageKey: 'pushups', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps controladas', imageKey: 'overhead_press', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'diamond', name: 'Flexiones Diamante de Poder', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'diamond', muscles: ['Tríceps', 'Pectoral interno'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps Copa', targetCount: 14, repsLabel: '14 reps continuas', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      },
    ],
  },
  {
    id: 'daily_pull_shadow_monarch',
    type: 'daily',
    title: 'Dorsal Sombrío & Bíceps',
    subtitle: 'Tracción de Rango A para espalda colosal',
    description: 'Protocolo de tracción vertical y horizontal que ensancha dorsales, fortalece romboides y bombea los bíceps con estímulo concéntrico y excéntrico.',
    durationLabel: '1 Día • 30 min',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#8B5CF6',
    totalXPReward: 185,
    emoji: '🦅',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Tracción Monarca',
        focus: 'Dorsales, Espalda Media y Bíceps',
        duration: 30,
        exercisesCount: 5,
        xpReward: 185,
        circuit: [
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Dorsal Ancho'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'dumbbell_row', name: 'Remo Pesado con Mancuerna', targetCount: 10, repsLabel: '10 reps por lado', imageKey: 'dumbbell_row', muscles: ['Dorsales', 'Romboides'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'pullups', name: 'Dominadas de Cazador / Jalón Asistido', targetCount: 8, repsLabel: '8 reps completas', imageKey: 'pullups', muscles: ['Espalda', 'Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: '1346', name: 'Descompresión de Dorsales en Suelo', targetCount: 40, repsLabel: '40s estiramiento fascial', imageKey: '1346', muscles: ['Columna', 'Dorsales'], sets: 2, restTimeSeconds: 25, xpReward: 30 },
        ],
      },
    ],
  },
  {
    id: 'daily_legs_explosive',
    type: 'daily',
    title: 'Piernas Explosivas & Agilidad',
    subtitle: 'Fuerza funcional de tren inferior y velocidad',
    description: 'Protocolo de salto, aceleración y resistencia muscular de piernas. Estimula reflejos neuromusculares y fibras tipo IIx.',
    durationLabel: '1 Día • 32 min',
    difficulty: 'Avanzado',
    targetAttribute: 'Agilidad',
    attributeColor: '#06B6D4',
    totalXPReward: 190,
    emoji: '🌪️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Explosión de Piernas',
        focus: 'Cuádriceps, Glúteos y Gemelos',
        duration: 32,
        exercisesCount: 5,
        xpReward: 190,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet Pesada', targetCount: 14, repsLabel: '14 reps dinámicas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'lunges', name: 'Zancadas Tácticas Dinámicas', targetCount: 14, repsLabel: '14 reps alternadas', imageKey: 'lunges', muscles: ['Glúteos', 'Isquios'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 10, repsLabel: '10 reps controladas', imageKey: 'deadlift', muscles: ['Cadena Posterior'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'climbers', name: 'Escaladores a Máxima Cadencia', targetCount: 30, repsLabel: '30 reps explosivas', imageKey: 'climbers', muscles: ['Core', 'Flexores'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Isométrica de Acero', targetCount: 10, repsLabel: '40s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      },
    ],
  },
  {
    id: 'daily_core_iron_fortress',
    type: 'daily',
    title: 'Fortaleza del Núcleo: Abdomen 360°',
    subtitle: 'Blindaje de transverso, rectos y oblicuos',
    description: 'Protocolo ortopédico de estabilización lumbo-pélvica. Genera una pared abdominal impenetrable para transferir potencia a cualquier movimiento.',
    durationLabel: '1 Día • 22 min',
    difficulty: 'Intermedio',
    targetAttribute: 'Mente',
    attributeColor: '#6366F1',
    totalXPReward: 165,
    emoji: '🛡️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Blindaje Central',
        focus: 'Transverso, Recto Abdominal y Oblicuos',
        duration: 22,
        exercisesCount: 5,
        xpReward: 165,
        circuit: [
          { id: 'plank', name: 'Plancha Frontal con Respiración Diafragmática', targetCount: 10, repsLabel: '45s de tensión continua', imageKey: 'plank', muscles: ['Transverso Abdominal'], sets: 3, restTimeSeconds: 25, xpReward: 35 },
          { id: 'air_bike', name: 'Bicicleta Aérea Cruzada', targetCount: 20, repsLabel: '20 reps lentas y controladas', imageKey: 'air_bike', muscles: ['Oblicuos', 'Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'climbers', name: 'Escaladores Tácticos de Precisión', targetCount: 25, repsLabel: '25 reps estrictas', imageKey: 'climbers', muscles: ['Flexores', 'Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'situps', name: 'Sit-Ups Tácticos con Retracción', targetCount: 15, repsLabel: '15 reps sin impulso', imageKey: 'situps', muscles: ['Recto Abdominal'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'glute_bridge', name: 'Puente Isométrico de Anclaje Pélvico', targetCount: 12, repsLabel: '30s de contracción en el tope', imageKey: 'glute_bridge', muscles: ['Glúteos', 'Lumbares'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
    ],
  },
  {
    id: 'daily_calisthenics_elite',
    type: 'daily',
    title: 'Calistenia Suprema de Rango A',
    subtitle: 'Dominio absoluto de la gravedad y peso corporal',
    description: 'Protocolo de gimnasia de fuerza pura sin pesas. Activa cadenas motoras complejas mediante palancas mecánicas de alta demanda neuromuscular.',
    durationLabel: '1 Día • 32 min',
    difficulty: 'Avanzado',
    targetAttribute: 'Fuerza',
    attributeColor: '#F59E0B',
    totalXPReward: 200,
    emoji: '🤸',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Fuerza Gravitatoria',
        focus: 'Pike, Dips, Diamante y Flexiones Explosivas',
        duration: 32,
        exercisesCount: 5,
        xpReward: 200,
        circuit: [
          { id: 'pike', name: 'Flexiones en Pica de Asalto', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'pike', muscles: ['Deltoides', 'Trapecios'], sets: 3, restTimeSeconds: 25, xpReward: 45 },
          { id: 'dips', name: 'Fondos en Paralelas / Banco Táctico', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'dips', muscles: ['Tríceps', 'Pectoral bajo'], sets: 3, restTimeSeconds: 25, xpReward: 40 },
          { id: 'diamond', name: 'Flexiones Diamante Cerradas', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'diamond', muscles: ['Tríceps', 'Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'pushups', name: 'Flexiones Militares con Parada Abajo', targetCount: 16, repsLabel: '16 reps lentas', imageKey: 'pushups', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'plank', name: 'Plancha Hueca Gimnástica', targetCount: 10, repsLabel: '45s de tensión pura', imageKey: 'plank', muscles: ['Core completo'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      },
    ],
  },
  {
    id: 'daily_mobility_decompression',
    type: 'daily',
    title: 'Regeneración Sinovial & Descompresión',
    subtitle: 'Cero impacto, apertura torácica y calma neural',
    description: 'Protocolo médico de recuperación activa. Restaura la longitud muscular, drena ácido láctico y recalibra el sistema nervioso parasimpático.',
    durationLabel: '1 Día • 20 min',
    difficulty: 'Principiante',
    targetAttribute: 'Vitalidad',
    attributeColor: '#10B981',
    totalXPReward: 140,
    emoji: '🧘',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Calma Neural y Sinovial',
        focus: 'Movilidad Torácica, Espinal y Caderas',
        duration: 20,
        exercisesCount: 6,
        xpReward: 140,
        circuit: [
          { id: '1167', name: 'Descompresión Torácica & Pectoral', targetCount: 45, repsLabel: '45s de apertura de pecho', imageKey: '1167', muscles: ['Pectorales', 'Hombros'], sets: 2, restTimeSeconds: 20, xpReward: 25 },
          { id: '1346', name: 'Estiramiento de Dorsales en Rodillas', targetCount: 45, repsLabel: '45s de descompresión lumbar', imageKey: '1346', muscles: ['Dorsales', 'Espalda baja'], sets: 2, restTimeSeconds: 20, xpReward: 25 },
          { id: '1363', name: 'Descompresión Espinal y Columna', targetCount: 45, repsLabel: '45s de elongación vertebral', imageKey: '1363', muscles: ['Columna', 'Erectores'], sets: 2, restTimeSeconds: 20, xpReward: 25 },
          { id: '1494', name: 'Postura Mariposa & Apertura Pélvica', targetCount: 45, repsLabel: '45s de liberación de cadera', imageKey: '1494', muscles: ['Aductores', 'Caderas'], sets: 2, restTimeSeconds: 20, xpReward: 25 },
          { id: '1511', name: 'Elongación de Isquiotibiales Suave', targetCount: 45, repsLabel: '45s por pierna', imageKey: '1511', muscles: ['Isquios'], sets: 2, restTimeSeconds: 20, xpReward: 20 },
          { id: '1403', name: 'Alivio Cervical & Trapecios', targetCount: 30, repsLabel: '30s de distensión de cuello', imageKey: '1403', muscles: ['Trapecios', 'Cuello'], sets: 2, restTimeSeconds: 20, xpReward: 20 },
        ],
      },
    ],
  },
  {
    id: 'daily_arms_overload',
    type: 'daily',
    title: 'Brazos de Titán: Bíceps & Tríceps',
    subtitle: 'Bombeo sarcoplasmático y densidad de brazos',
    description: 'Protocolo de alta hipertrofia enfocado en braquial, cabeza larga del tríceps y bíceps braquial. Esculpe brazos densos y vascularizados.',
    durationLabel: '1 Día • 28 min',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#EC4899',
    totalXPReward: 175,
    emoji: '💪',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Sobrecarga de Brazos',
        focus: 'Bíceps, Tríceps y Antebrazos',
        duration: 28,
        exercisesCount: 5,
        xpReward: 175,
        circuit: [
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra Estricto', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'diamond', name: 'Flexiones Diamante de Tríceps', targetCount: 12, repsLabel: '12 reps controladas', imageKey: 'diamond', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps', targetCount: 14, repsLabel: '14 reps continuas', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'dips', name: 'Fondos de Tríceps en Banco', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'dips', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Isométrica de Cierre', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      },
    ],
  },
  {
    id: 'daily_shoulders_deltoid_wall',
    type: 'daily',
    title: 'Muralla de Hombros 3D & Deltoides',
    subtitle: 'Enfoque tridimensional: anterior, lateral y posterior',
    description: 'Protocolo militar para crear hombros anchos y protegidos contra lesiones. Desarrolla estabilidad escapular y fuerza vertical.',
    durationLabel: '1 Día • 28 min',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#F97316',
    totalXPReward: 175,
    emoji: '🛡️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Deltoides de Acero',
        focus: 'Hombro Anterior, Lateral y Trapecio',
        duration: 28,
        exercisesCount: 5,
        xpReward: 175,
        circuit: [
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'overhead_press', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'pike', name: 'Flexiones en Pica Inclinada', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'pike', muscles: ['Deltoides anterior', 'Trapecio'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 14, repsLabel: '14 reps continuas', imageKey: 'pushups', muscles: ['Deltoides', 'Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 20, repsLabel: '20 reps dinámicas', imageKey: 'climbers', muscles: ['Hombros isométricos', 'Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: '1403', name: 'Alivio Cervical & Trapecios', targetCount: 30, repsLabel: '30s de estiramiento', imageKey: '1403', muscles: ['Trapecios'], sets: 2, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
    ],
  },
  {
    id: 'daily_express_hunter_15m',
    type: 'daily',
    title: 'Incursión Relámpago (15 Minutos)',
    subtitle: 'Máxima densidad de trabajo para cazadores con poco tiempo',
    description: '4 estaciones de trabajo continuo y alta eficiencia. Diseñado para mantener la racha de combate y quemar energía sin excusas.',
    durationLabel: '1 Día • 15 min',
    difficulty: 'Principiante',
    targetAttribute: 'Agilidad',
    attributeColor: '#EAB308',
    totalXPReward: 150,
    emoji: '⚡',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Incursión Rápida',
        focus: 'Full Body de Alta Densidad',
        duration: 15,
        exercisesCount: 4,
        xpReward: 150,
        circuit: [
          { id: 'squats', name: 'Sentadillas Profundas a Cadencia', targetCount: 15, repsLabel: '15 reps continuas', imageKey: 'squats', muscles: ['Piernas', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'pushups', name: 'Flexiones Militares Tácticas', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'pushups', muscles: ['Pectorales', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'climbers', name: 'Escaladores de Alta Velocidad', targetCount: 20, repsLabel: '20 reps explosivas', imageKey: 'climbers', muscles: ['Core', 'Cardio'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión pura', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      },
    ],
  },
  {
    id: 'daily_glutes_hamstrings',
    type: 'daily',
    title: 'Cadena Posterior & Estabilidad Pélvica',
    subtitle: 'Glúteos de acero, isquiotibiales y salud lumbar',
    description: 'Protocolo ortopédico para fortalecer la cadera y proteger la espalda baja del sedentarismo o cargas pesadas.',
    durationLabel: '1 Día • 25 min',
    difficulty: 'Intermedio',
    targetAttribute: 'Vitalidad',
    attributeColor: '#10B981',
    totalXPReward: 170,
    emoji: '🍑',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Cadena Posterior',
        focus: 'Glúteos, Isquios y Zona Lumbar',
        duration: 25,
        exercisesCount: 5,
        xpReward: 170,
        circuit: [
          { id: 'glute_bridge', name: 'Puente de Glúteos con Pausa', targetCount: 15, repsLabel: '15 reps con 2s contracción', imageKey: 'glute_bridge', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 25, xpReward: 35 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 10, repsLabel: '10 reps controladas', imageKey: 'deadlift', muscles: ['Isquios', 'Glúteos'], sets: 3, restTimeSeconds: 25, xpReward: 35 },
          { id: 'glute_bridge_march', name: 'Marcha Pélvica en Suelo', targetCount: 14, repsLabel: '14 reps alternadas', imageKey: 'glute_bridge_march', muscles: ['Estabilidad Pélvica'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lunges', name: 'Zancadas Tácticas Inversas', targetCount: 12, repsLabel: '12 reps por pierna', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: '1511', name: 'Elongación Isquiotibial Suave', targetCount: 40, repsLabel: '40s estiramiento', imageKey: '1511', muscles: ['Isquiotibiales'], sets: 2, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
    ],
  },
  {
    id: 'daily_fat_burn_metabolic',
    type: 'daily',
    title: 'Incinerador Metabólico CORTEX',
    subtitle: 'Protocolo de alta demanda calórica y EPOC',
    description: 'Combina movimientos compuestos y aceleraciones aeróbicas para maximizar la oxidación de ácidos grasos durante y después del entreno.',
    durationLabel: '1 Día • 26 min',
    difficulty: 'Intermedio',
    targetAttribute: 'Agilidad',
    attributeColor: '#EF4444',
    totalXPReward: 180,
    emoji: '🔥',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Incinerador de Grasa',
        focus: 'Metabolismo, Cardio y Core',
        duration: 26,
        exercisesCount: 5,
        xpReward: 180,
        circuit: [
          { id: 'burpees', name: 'Burpees Tácticos de Choque', targetCount: 12, repsLabel: '12 reps continuas', imageKey: 'burpees', muscles: ['Cuerpo Completo', 'Cardio'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'squats', name: 'Sentadillas Profundas a Ritmo Alto', targetCount: 18, repsLabel: '18 reps dinámicas', imageKey: 'squats', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 14, repsLabel: '14 reps estrictas', imageKey: 'pushups', muscles: ['Pecho', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'climbers', name: 'Escaladores a Máxima Velocidad', targetCount: 30, repsLabel: '30 reps rápidas', imageKey: 'climbers', muscles: ['Core', 'Cardio'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '35s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      },
    ],
  },

  // =========================================================================
  // 2. PLANES SEMANALES (Programas de 7 Días CORTEX)
  // =========================================================================
  {
    id: 'weekly_beginner_rebuild',
    type: 'weekly',
    title: 'Despertar E-Rank (Reacondicionamiento Articular)',
    subtitle: '7 días de fuerza progresiva y cero impacto',
    description: 'Protocolo clínico de iniciación para cazadores principiantes o con sobrepeso. Restaura la estabilidad lumbo-pélvica, protege los ligamentos patelares y acelera el metabolismo basal de forma segura.',
    durationLabel: '7 Días • 20-25 min/día',
    difficulty: 'Principiante',
    targetAttribute: 'Vitalidad',
    attributeColor: '#10B981',
    totalXPReward: 850,
    emoji: '🛡️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Día 1: Activación y Cadena Posterior',
        focus: 'Glúteos, Piernas y Core seguro',
        duration: 20,
        exercisesCount: 4,
        xpReward: 120,
        circuit: [
          { id: 'squats_assisted', name: 'Sentadillas Asistidas con Apoyo', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'squats_assisted', muscles: ['Cuádriceps', 'Glúteos'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'glute_bridge', name: 'Puente de Glúteos en Suelo', targetCount: 12, repsLabel: '12 reps con contracción', imageKey: 'glute_bridge', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 30, xpReward: 30 },
          { id: 'glute_bridge_march', name: 'Marcha Pélvica en Suelo', targetCount: 12, repsLabel: '12 reps alternadas', imageKey: 'glute_bridge_march', muscles: ['Cadena Posterior'], sets: 3, restTimeSeconds: 30, xpReward: 30 },
          { id: 'plank_assisted', name: 'Plancha con Apoyo de Rodillas', targetCount: 10, repsLabel: '20s de tensión', imageKey: 'plank_assisted', muscles: ['Core'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Día 2: Torso y Estabilidad Escapular',
        focus: 'Pecho, Espalda y Brazos asistidos',
        duration: 20,
        exercisesCount: 4,
        xpReward: 120,
        circuit: [
          { id: 'pushups_assisted', name: 'Flexiones Inclinadas de Pecho', targetCount: 10, repsLabel: '10 reps controladas', imageKey: 'pushups_assisted', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Espalda'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps', targetCount: 12, repsLabel: '12 reps suaves', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 30, xpReward: 30 },
          { id: 'plank_assisted', name: 'Plancha con Apoyo de Rodillas', targetCount: 10, repsLabel: '20s de tensión', imageKey: 'plank_assisted', muscles: ['Core'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
        ],
      },
      {
        dayNumber: 3,
        title: 'Día 3: Regeneración Activa y Líquido Sinovial',
        focus: 'Caminar 5,000 pasos + Hidratación abundante',
        duration: 25,
        exercisesCount: 2,
        xpReward: 100,
        isRestDay: true,
      },
      {
        dayNumber: 4,
        title: 'Día 4: Piernas Seguras y Estabilidad',
        focus: 'Sentadilla asistida y glúteos',
        duration: 20,
        exercisesCount: 4,
        xpReward: 120,
        circuit: [
          { id: 'squats_assisted', name: 'Sentadilla Asistida con Soporte', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'squats_assisted', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'glute_bridge', name: 'Puente de Glúteos con Pausa', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'glute_bridge', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 30, xpReward: 30 },
          { id: 'glute_bridge_march', name: 'Marcha de Puente Pélvico', targetCount: 12, repsLabel: '12 reps continuas', imageKey: 'glute_bridge_march', muscles: ['Core lumbar'], sets: 3, restTimeSeconds: 30, xpReward: 30 },
          { id: 'plank_assisted', name: 'Plancha con Apoyo de Rodillas', targetCount: 10, repsLabel: '20s de tensión', imageKey: 'plank_assisted', muscles: ['Core'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
        ],
      },
      {
        dayNumber: 5,
        title: 'Día 5: Circuito Funcional Adaptado',
        focus: 'Full body de bajo impacto',
        duration: 22,
        exercisesCount: 4,
        xpReward: 130,
        circuit: [
          { id: 'pushups_assisted', name: 'Flexiones Inclinadas', targetCount: 10, repsLabel: '10 reps controladas', imageKey: 'pushups_assisted', muscles: ['Pecho'], sets: 3, restTimeSeconds: 35, xpReward: 35 },
          { id: 'dumbbell_row', name: 'Remo Unilateral', targetCount: 10, repsLabel: '10 reps por lado', imageKey: 'dumbbell_row', muscles: ['Espalda'], sets: 3, restTimeSeconds: 35, xpReward: 35 },
          { id: 'squats_assisted', name: 'Sentadilla Asistida', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'squats_assisted', muscles: ['Piernas'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'plank_assisted', name: 'Plancha sobre Rodillas', targetCount: 10, repsLabel: '25s de tensión', imageKey: 'plank_assisted', muscles: ['Core'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
        ],
      },
      {
        dayNumber: 6,
        title: 'Día 6: Movilidad Lumbo-Pélvica',
        focus: 'Estiramientos y descompresión',
        duration: 20,
        exercisesCount: 3,
        xpReward: 110,
        isRestDay: true,
      },
      {
        dayNumber: 7,
        title: 'Día 7: Evaluación y Consolidación E-Rank',
        focus: 'Test de adaptación y cierre de ciclo',
        duration: 22,
        exercisesCount: 4,
        xpReward: 150,
        circuit: [
          { id: 'squats_assisted', name: 'Sentadillas Asistidas', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'squats_assisted', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 35, xpReward: 40 },
          { id: 'pushups_assisted', name: 'Flexiones Inclinadas', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'pushups_assisted', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 35, xpReward: 40 },
          { id: 'glute_bridge', name: 'Puente de Glúteos', targetCount: 14, repsLabel: '14 reps con contracción', imageKey: 'glute_bridge', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 30, xpReward: 35 },
          { id: 'plank_assisted', name: 'Plancha con Apoyo de Rodillas', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank_assisted', muscles: ['Core'], sets: 3, restTimeSeconds: 35, xpReward: 35 },
        ],
      },
    ],
  },
  {
    id: 'weekly_spartan_split',
    type: 'weekly',
    title: 'Spartan Split (Torso / Pierna D-Rank)',
    subtitle: '7 días: 4 de combate intenso + 3 de regeneración',
    description: 'Protocolo de hipertrofia y fuerza equilibrada. Alterna días de tren superior y tren inferior con días intercalados de recuperación para optimizar la síntesis proteica.',
    durationLabel: '7 Días • 30-35 min/día',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#F59E0B',
    totalXPReward: 980,
    emoji: '⚔️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Día 1: Torso A (Enfoque Empuje)',
        focus: 'Pecho, Deltoides Anterior y Tríceps',
        duration: 30,
        exercisesCount: 5,
        xpReward: 140,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'pushups', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps estrictas', imageKey: 'overhead_press', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'diamond', name: 'Flexiones Diamante', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'diamond', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 20 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Día 2: Pierna A (Cuádriceps & Cadena Posterior)',
        focus: 'Sentadillas, Peso Muerto y Zancadas',
        duration: 32,
        exercisesCount: 5,
        xpReward: 140,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 8, repsLabel: '8 reps pesadas', imageKey: 'deadlift', muscles: ['Isquios', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'squats', name: 'Sentadillas Profundas', targetCount: 15, repsLabel: '15 reps lentas', imageKey: 'squats', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 12, repsLabel: '12 reps por pierna', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 20 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 20 },
        ],
      },
      {
        dayNumber: 3,
        title: 'Día 3: Regeneración Táctica Activa',
        focus: 'Caminar 6,000 pasos + Estiramientos',
        duration: 25,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
      {
        dayNumber: 4,
        title: 'Día 4: Torso B (Enfoque Tracción)',
        focus: 'Dorsales, Espalda Media y Bíceps',
        duration: 30,
        exercisesCount: 5,
        xpReward: 140,
        circuit: [
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Dorsales'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 20, repsLabel: '20 reps dinámicas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 20 },
        ],
      },
      {
        dayNumber: 5,
        title: 'Día 5: Pierna B (Fuerza Unilateral & Glúteos)',
        focus: 'Zancadas, Cuádriceps y Abdomen',
        duration: 32,
        exercisesCount: 5,
        xpReward: 140,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 14, repsLabel: '14 reps alternadas', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 10, repsLabel: '10 reps pesadas', imageKey: 'deadlift', muscles: ['Isquios'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'burpees', name: 'Burpees Tácticos', targetCount: 10, repsLabel: '10 reps explosivas', imageKey: 'burpees', muscles: ['Cardio'], sets: 3, restTimeSeconds: 20, xpReward: 20 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '35s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 20 },
        ],
      },
      {
        dayNumber: 6,
        title: 'Día 6: Protocolo de Movilidad y Asalto Semanal',
        focus: 'Preparación articular para el Boss semanal',
        duration: 20,
        exercisesCount: 2,
        xpReward: 90,
        isRestDay: true,
      },
      {
        dayNumber: 7,
        title: 'Día 7: Recarga Total de Cazador',
        focus: 'Descanso completo del sistema nervioso central',
        duration: 15,
        exercisesCount: 2,
        xpReward: 90,
        isRestDay: true,
      },
    ],
  },
  {
    id: 'weekly_hunter_calisthenics',
    type: 'weekly',
    title: 'Protocolo del Cazador Solitario (Calistenia Pura C-Rank)',
    subtitle: '7 días de control corporal estricto sin equipamiento',
    description: 'Inspirado en la rutina solitaria de Jin-Woo. Desarrolla fuerza funcional, control del peso corporal en el espacio y definición muscular magra sin necesidad de gimnasio.',
    durationLabel: '7 Días • 25-30 min/día',
    difficulty: 'Intermedio',
    targetAttribute: 'Agilidad',
    attributeColor: '#00F0FF',
    totalXPReward: 950,
    emoji: '🗡️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Día 1: Empuje Calisténico',
        focus: 'Pectorales, Tríceps y Hombros',
        duration: 28,
        exercisesCount: 5,
        xpReward: 140,
        circuit: [
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 15, repsLabel: '15 reps lentas', imageKey: 'pushups', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'diamond', name: 'Flexiones Diamante', targetCount: 10, repsLabel: '10 reps estrictas', imageKey: 'diamond', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'pike', name: 'Flexiones en Pica', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'pike', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'dips', name: 'Fondos en Banco', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'dips', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'plank', name: 'Plancha Abdominal', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 20 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Día 2: Piernas de Acero & Salto',
        focus: 'Cuádriceps, Glúteos y Explosividad',
        duration: 28,
        exercisesCount: 5,
        xpReward: 140,
        circuit: [
          { id: 'squats', name: 'Sentadillas Profundas', targetCount: 18, repsLabel: '18 reps lentas', imageKey: 'squats', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 14, repsLabel: '14 reps alternadas', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 25, repsLabel: '25 reps rápidas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'burpees', name: 'Burpees de Evasión', targetCount: 10, repsLabel: '10 reps explosivas', imageKey: 'burpees', muscles: ['Cardio'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'plank', name: 'Plancha Abdominal', targetCount: 10, repsLabel: '35s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 3,
        title: 'Día 3: Recarga de Sombras (Descanso Activo)',
        focus: 'Caminar 6,000 pasos y movilidad articular',
        duration: 20,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
      {
        dayNumber: 4,
        title: 'Día 4: Fortaleza Escapular y Core',
        focus: 'Hombros, Core y Estabilidad Corporal',
        duration: 28,
        exercisesCount: 5,
        xpReward: 140,
        circuit: [
          { id: 'pike', name: 'Flexiones en Pica', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'pike', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 15, repsLabel: '15 reps lentas', imageKey: 'pushups', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 30, repsLabel: '30 reps dinámicas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'dips', name: 'Fondos en Banco', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'dips', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'plank', name: 'Plancha Abdominal', targetCount: 10, repsLabel: '40s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 5,
        title: 'Día 5: Circuito Full Body de Alta Cadencia',
        focus: 'Combinación de Empuje, Pierna y Cardio',
        duration: 30,
        exercisesCount: 5,
        xpReward: 150,
        circuit: [
          { id: 'burpees', name: 'Burpees Tácticos', targetCount: 12, repsLabel: '12 reps explosivas', imageKey: 'burpees', muscles: ['Full Body'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'squats', name: 'Sentadillas Profundas', targetCount: 20, repsLabel: '20 reps continuas', imageKey: 'squats', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 15, repsLabel: '15 reps controladas', imageKey: 'pushups', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'diamond', name: 'Flexiones Diamante', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'diamond', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal', targetCount: 10, repsLabel: '40s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 6,
        title: 'Día 6: Enfriamiento Táctico y Asalto Semanal',
        focus: 'Preparación para el combate de fin de semana',
        duration: 20,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
      {
        dayNumber: 7,
        title: 'Día 7: Regeneración Neural',
        focus: 'Descanso total y estiramientos',
        duration: 15,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
    ],
  },
  {
    id: 'weekly_gym_iron_hunter',
    type: 'weekly',
    title: 'Hierro del Cazador (Gym Iron B-Rank)',
    subtitle: '7 días: Barra, mancuernas y sobrecarga progresiva',
    description: 'Protocolo para cazadores con acceso a pesas o gimnasio. Maximiza la tensión mecánica sobre fibras de contracción rápida mediante los grandes ejercicios compuestos.',
    durationLabel: '7 Días • 35-40 min/día',
    difficulty: 'Avanzado',
    targetAttribute: 'Fuerza',
    attributeColor: '#EF4444',
    totalXPReward: 1050,
    emoji: '🏋️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Día 1: Empuje Pesado (Pecho, Hombro, Tríceps)',
        focus: 'Press de Banca, Militar y Fondos',
        duration: 35,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'overhead_press', name: 'Press Militar con Barra/Mancuernas', targetCount: 10, repsLabel: '10 reps estrictas', imageKey: 'overhead_press', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'pushups', name: 'Flexiones Militares de Remate', targetCount: 15, repsLabel: '15 reps continuas', imageKey: 'pushups', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps', targetCount: 12, repsLabel: '12 reps continuas', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '35s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Día 2: Pierna Colosal (Cuádriceps & Sentadilla)',
        focus: 'Goblet Squat, Peso Muerto y Zancadas',
        duration: 38,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet Pesada', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 8, repsLabel: '8 reps pesadas', imageKey: 'deadlift', muscles: ['Isquios', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'squats', name: 'Sentadillas Profundas de Bombeo', targetCount: 18, repsLabel: '18 reps lentas', imageKey: 'squats', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'lunges', name: 'Zancadas con Mancuernas', targetCount: 12, repsLabel: '12 reps por pierna', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '40s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 3,
        title: 'Día 3: Recarga de Energía (Descanso Activo)',
        focus: 'Caminar 6,000 pasos y descompresión',
        duration: 20,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
      {
        dayNumber: 4,
        title: 'Día 4: Tracción y Espalda de Acero (Tirón)',
        focus: 'Jalón, Remo Pesado y Bíceps',
        duration: 35,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Dorsales'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'dumbbell_row', name: 'Remo Pesado con Mancuerna', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 25, repsLabel: '25 reps dinámicas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '40s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 5,
        title: 'Día 5: Asalto de Fuerza Híbrida',
        focus: 'Compuestos globales y bombeo',
        duration: 38,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'goblet_squat', name: 'Sentadilla Goblet', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lat_pulldown', name: 'Jalón al Pecho', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Dorsales'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'overhead_press', name: 'Press Militar', targetCount: 10, repsLabel: '10 reps estrictas', imageKey: 'overhead_press', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal', targetCount: 10, repsLabel: '45s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 6,
        title: 'Día 6: Preparación para Asalto a la Torre',
        focus: 'Movilidad articular y enfoque mental',
        duration: 20,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
      {
        dayNumber: 7,
        title: 'Día 7: Calma Sinovial',
        focus: 'Descanso total y recuperación neural',
        duration: 15,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
    ],
  },
  {
    id: 'weekly_ppl_shadow_monarch',
    type: 'weekly',
    title: 'Push-Pull-Legs Monarca de Sombras (A-Rank)',
    subtitle: '7 días: 6 días de sobrecarga muscular + 1 de regeneración',
    description: 'La división de entrenamiento de élite favorita de los culturistas y atletas de fuerza. Separa la musculatura agonista y antagonista permitiendo máxima recuperación y frecuencia 2x.',
    durationLabel: '7 Días • 35-40 min/día',
    difficulty: 'Avanzado',
    targetAttribute: 'Fuerza',
    attributeColor: '#8B5CF6',
    totalXPReward: 1200,
    emoji: '👑',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Día 1: Push A (Pecho, Deltoides Anterior, Tríceps)',
        focus: 'Press banca, aperturas y extensiones',
        duration: 35,
        exercisesCount: 5,
        xpReward: 170,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 12, repsLabel: '12 reps pesadas', imageKey: 'bench_press', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 15, repsLabel: '15 reps con parada', imageKey: 'pushups', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps estrictas', imageKey: 'overhead_press', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'diamond', name: 'Flexiones Diamante', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'diamond', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '35s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Día 2: Pull A (Dorsales, Trapecios, Bíceps)',
        focus: 'Jalón al pecho, remo pesado y curl barra',
        duration: 35,
        exercisesCount: 5,
        xpReward: 170,
        circuit: [
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'lat_pulldown', muscles: ['Dorsales'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Espalda media'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'pullups', name: 'Dominadas de Cazador', targetCount: 8, repsLabel: '8 reps completas', imageKey: 'pullups', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: '1346', name: 'Descompresión de Dorsales', targetCount: 40, repsLabel: '40s elongación', imageKey: '1346', muscles: ['Columna'], sets: 2, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 3,
        title: 'Día 3: Legs A (Cuádriceps, Isquios, Glúteos)',
        focus: 'Sentadilla Goblet, peso muerto y zancadas',
        duration: 38,
        exercisesCount: 5,
        xpReward: 170,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet Pesada', targetCount: 14, repsLabel: '14 reps lentas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 10, repsLabel: '10 reps pesadas', imageKey: 'deadlift', muscles: ['Cadena Posterior'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 14, repsLabel: '14 reps por pierna', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'glute_bridge', name: 'Puente de Glúteos', targetCount: 15, repsLabel: '15 reps con pausa', imageKey: 'glute_bridge', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal', targetCount: 10, repsLabel: '40s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 4,
        title: 'Día 4: Push B (Hombros 3D & Pectoral Superior)',
        focus: 'Press militar, fondos y flexiones en pica',
        duration: 35,
        exercisesCount: 5,
        xpReward: 170,
        circuit: [
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'overhead_press', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'pike', name: 'Flexiones en Pica', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'pike', muscles: ['Deltoides anterior'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'dips', name: 'Fondos en Paralelas / Banco', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'dips', muscles: ['Tríceps', 'Pectoral'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps', targetCount: 14, repsLabel: '14 reps continuas', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '40s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 5,
        title: 'Día 5: Pull B (Densidad Espalda & Bíceps Concentrado)',
        focus: 'Remo pesado, jalones y flexores de brazo',
        duration: 35,
        exercisesCount: 5,
        xpReward: 170,
        circuit: [
          { id: 'dumbbell_row', name: 'Remo con Mancuerna Unilateral', targetCount: 12, repsLabel: '12 reps por lado', imageKey: 'dumbbell_row', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps controladas', imageKey: 'lat_pulldown', muscles: ['Dorsales'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Dinámicos', targetCount: 25, repsLabel: '25 reps rápidas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Isométrica', targetCount: 10, repsLabel: '45s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 6,
        title: 'Día 6: Legs B (Potencia Unilateral & Gemelos)',
        focus: 'Zancadas pesadas, sentadilla búlgara y glúteos',
        duration: 35,
        exercisesCount: 5,
        xpReward: 170,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'lunges', name: 'Zancadas Tácticas Pesadas', targetCount: 14, repsLabel: '14 reps por pierna', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 10, repsLabel: '10 reps controladas', imageKey: 'deadlift', muscles: ['Isquios'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'glute_bridge_march', name: 'Marcha de Puente Pélvico', targetCount: 14, repsLabel: '14 reps alternadas', imageKey: 'glute_bridge_march', muscles: ['Cadena Posterior'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '45s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 7,
        title: 'Día 7: Calma Sinovial y Cierre del Ciclo',
        focus: 'Regeneración articular y descanso',
        duration: 20,
        exercisesCount: 2,
        xpReward: 100,
        isRestDay: true,
      },
    ],
  },
  {
    id: 'weekly_fullbody_power_3d',
    type: 'weekly',
    title: 'Fuerza Full Body 3 Días de Élite (L-M-V)',
    subtitle: '7 días: 3 sesiones globales de alta intensidad + 4 de recarga',
    description: 'Protocolo de máxima eficiencia para atletas y profesionales ocupados. 3 días no consecutivos de estímulo neuromuscular total con días de descanso completos.',
    durationLabel: '7 Días • 35-40 min/día',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#10B981',
    totalXPReward: 900,
    emoji: '⚡',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Día 1: Sobrecarga A (Sentadilla, Press, Remo)',
        focus: 'Grandes Compuestos de Tren Superior e Inferior',
        duration: 38,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet Pesada', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', targetCount: 10, repsLabel: '10 reps por lado', imageKey: 'dumbbell_row', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 14, repsLabel: '14 reps estrictas', imageKey: 'pushups', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '35s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Día 2: Recarga Biológica & Caminata',
        focus: '6,000 pasos e hidratación',
        duration: 20,
        exercisesCount: 2,
        xpReward: 70,
        isRestDay: true,
      },
      {
        dayNumber: 3,
        title: 'Día 3: Sobrecarga B (Peso Muerto, Militar, Jalón)',
        focus: 'Cadena Posterior, Hombros y Tracción',
        duration: 38,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 8, repsLabel: '8 reps pesadas', imageKey: 'deadlift', muscles: ['Isquios', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps estrictas', imageKey: 'overhead_press', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Dorsales'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 12, repsLabel: '12 reps por pierna', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '40s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 4,
        title: 'Día 4: Calma Parasimpática',
        focus: 'Descompresión y respiración diafragmática',
        duration: 20,
        exercisesCount: 2,
        xpReward: 70,
        isRestDay: true,
      },
      {
        dayNumber: 5,
        title: 'Día 5: Sobrecarga C (Fuerza Unilateral, Brazos & Core)',
        focus: 'Sentadillas, Fondos, Bíceps y Core',
        duration: 38,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'squats', name: 'Sentadillas Profundas', targetCount: 16, repsLabel: '16 reps lentas', imageKey: 'squats', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'dips', name: 'Fondos de Tríceps', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'dips', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 25, repsLabel: '25 reps continuas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '45s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 6,
        title: 'Día 6: Preparación para Asalto a la Torre',
        focus: 'Movilidad articular',
        duration: 15,
        exercisesCount: 2,
        xpReward: 70,
        isRestDay: true,
      },
      {
        dayNumber: 7,
        title: 'Día 7: Regeneración Total',
        focus: 'Descanso completo',
        duration: 15,
        exercisesCount: 2,
        xpReward: 70,
        isRestDay: true,
      },
    ],
  },
  {
    id: 'weekly_fat_shredder_hiit',
    type: 'weekly',
    title: 'Destructor Metabólico & Quema Grasa (5 Días)',
    subtitle: '7 días: 5 circuitos metabólicos de alta cadencia + 2 de recarga',
    description: 'Protocolo de choque para definir musculatura y quemar grasa visceral. Acelera el ritmo metabólico basal y la resistencia anaeróbica láctica.',
    durationLabel: '7 Días • 25-30 min/día',
    difficulty: 'Avanzado',
    targetAttribute: 'Agilidad',
    attributeColor: '#F97316',
    totalXPReward: 1000,
    emoji: '🔥',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Día 1: Ráfaga Torácica HIIT',
        focus: 'Empuje y Cardio Anaeróbico',
        duration: 26,
        exercisesCount: 5,
        xpReward: 150,
        circuit: [
          { id: 'burpees', name: 'Burpees Tácticos', targetCount: 12, repsLabel: '12 reps explosivas', imageKey: 'burpees', muscles: ['Full Body'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 15, repsLabel: '15 reps continuas', imageKey: 'pushups', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 25, repsLabel: '25 reps rápidas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'diamond', name: 'Flexiones Diamante', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'diamond', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Día 2: Piernas Explosivas & Quema Grasa',
        focus: 'Sentadillas, Zancadas y Pulso Elevado',
        duration: 26,
        exercisesCount: 5,
        xpReward: 150,
        circuit: [
          { id: 'squats', name: 'Sentadillas Profundas a Cadencia', targetCount: 20, repsLabel: '20 reps rápidas', imageKey: 'squats', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 14, repsLabel: '14 reps alternadas', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'burpees', name: 'Burpees Tácticos', targetCount: 10, repsLabel: '10 reps explosivas', imageKey: 'burpees', muscles: ['Cardio'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Dinámicos', targetCount: 25, repsLabel: '25 reps rápidas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal', targetCount: 10, repsLabel: '35s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 3,
        title: 'Día 3: Recarga Metabólica & Caminata',
        focus: 'Hidratación abundante y recuperación activa',
        duration: 20,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
      {
        dayNumber: 4,
        title: 'Día 4: Asalto de Espalda & Cardio de Evasión',
        focus: 'Dorsales, Bíceps e Intervalos',
        duration: 26,
        exercisesCount: 5,
        xpReward: 150,
        circuit: [
          { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', targetCount: 12, repsLabel: '12 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 14, repsLabel: '14 reps estrictas', imageKey: 'pushups', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 30, repsLabel: '30 reps rápidas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal', targetCount: 10, repsLabel: '40s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ],
      },
      {
        dayNumber: 5,
        title: 'Día 5: Circuito Tabata Full Body',
        focus: 'Consumo máximo de oxígeno y resistencia',
        duration: 28,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'burpees', name: 'Burpees Tácticos', targetCount: 12, repsLabel: '12 reps continuas', imageKey: 'burpees', muscles: ['Full Body'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'squats', name: 'Sentadillas Profundas', targetCount: 20, repsLabel: '20 reps rápidas', imageKey: 'squats', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 15, repsLabel: '15 reps controladas', imageKey: 'pushups', muscles: ['Pectorales'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores a Máxima Cadencia', targetCount: 30, repsLabel: '30 reps explosivas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal', targetCount: 10, repsLabel: '45s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 6,
        title: 'Día 6: Movilidad & Asalto Semanal',
        focus: 'Apertura articular',
        duration: 15,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
      {
        dayNumber: 7,
        title: 'Día 7: Descanso y Cierre Metabólico',
        focus: 'Regeneración total',
        duration: 15,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
    ],
  },
  {
    id: 'weekly_iron_discipline_military',
    type: 'weekly',
    title: 'Protocolo Militar de Jin-Woo (7 Días Inquebrantables)',
    subtitle: '7 días continuos: La rutina del Sistema de Solo Leveling',
    description: '100 flexiones, 100 sentadillas, 100 abdominales y carrera adaptada cada día. El protocolo sagrado que despertó al Monarca de las Sombras.',
    durationLabel: '7 Días • 30-35 min/día',
    difficulty: 'Avanzado',
    targetAttribute: 'Mente',
    attributeColor: '#DC2626',
    totalXPReward: 1350,
    emoji: '⚔️',
    daysSchedule: Array.from({ length: 7 }, (_, i) => {
      const day = i + 1;
      return {
        dayNumber: day,
        title: `Día ${day}: Directiva del Sistema CORTEX`,
        focus: 'Flexiones, Sentadillas, Abdomen y Cardio estricto',
        duration: 32,
        exercisesCount: 5,
        xpReward: 190 + day * 5,
        circuit: [
          { id: 'pushups', name: 'Flexiones Militares Tácticas', targetCount: 16, repsLabel: '16 reps lentas y profundas', imageKey: 'pushups', muscles: ['Pecho', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'squats', name: 'Sentadillas de Acero', targetCount: 20, repsLabel: '20 reps completas', imageKey: 'squats', muscles: ['Cuádriceps', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'situps', name: 'Abdominales Tácticos', targetCount: 18, repsLabel: '18 reps estrictas', imageKey: 'situps', muscles: ['Abdomen'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'climbers', name: 'Escaladores de Evasión', targetCount: 30, repsLabel: '30 reps rápidas', imageKey: 'climbers', muscles: ['Cardio', 'Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha de Disciplina Absoluta', targetCount: 10, repsLabel: '45s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      };
    }),
  },

  // =========================================================================
  // 3. PLANES MENSUALES (Mesociclos de 30 Días CORTEX)
  // =========================================================================
  {
    id: 'monthly_genesis_rebuild',
    type: 'monthly',
    title: 'Génesis del Cazador (30 Días de Adaptación)',
    subtitle: 'Transformación progresiva de Rango E a D',
    description: 'El programa fundamental de 30 días para quienes comienzan o tienen sobrepeso. Desarrolla fuerza funcional, densidad muscular y acondicionamiento cardiovascular sin saltos ni impacto en rodillas.',
    durationLabel: '30 Días • 20-25 min/día',
    difficulty: 'Principiante',
    targetAttribute: 'Vitalidad',
    attributeColor: '#10B981',
    totalXPReward: 3800,
    emoji: '🌱',
    daysSchedule: Array.from({ length: 30 }, (_, i) => {
      const d = i + 1;
      const isRest = d % 4 === 0;
      return {
        dayNumber: d,
        title: isRest ? `Día ${d}: Recarga Articular y Regeneración` : `Día ${d}: Fase ${Math.floor(d / 7) + 1} - Cero Impacto`,
        focus: isRest ? 'Descanso activo, hidratación y movilidad' : 'Fuerza asistida, control motor y core',
        duration: isRest ? 15 : 22,
        exercisesCount: isRest ? 2 : 4,
        xpReward: isRest ? 90 : 130,
        isRestDay: isRest,
      };
    }),
  },
  {
    id: 'monthly_awakening_30d',
    type: 'monthly',
    title: 'Despertar de Cazador (30 Días)',
    subtitle: 'Periodización de 4 semanas de progresión',
    description: 'Programa de transformación total coordinado por CORTEX. Aumenta la capacidad de trabajo semana tras semana, adaptando volumen y densidad según tu rango.',
    durationLabel: '30 Días • 30-40 min/día',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#EF4444',
    totalXPReward: 4500,
    emoji: '👑',
    daysSchedule: Array.from({ length: 30 }, (_, index) => {
      const day = index + 1;
      const isRest = day % 4 === 0 || day === 30;
      const week = Math.ceil(day / 7);

      let dayTitle = `Día ${day}: Sobrecarga Táctica`;
      let dayFocus = 'Fuerza e Hipertrofia Global';

      if (isRest) {
        dayTitle = `Día ${day}: Protocolo de Regeneración`;
        dayFocus = 'Descanso activo y descompresión';
      } else {
        const modulo = day % 3;
        if (modulo === 1) {
          dayTitle = `Día ${day}: Empuje & Hombros`;
          dayFocus = 'Pectorales, Deltoides y Tríceps';
        } else if (modulo === 2) {
          dayTitle = `Día ${day}: Tirón & Espalda`;
          dayFocus = 'Dorsales, Trapecios y Bíceps';
        } else {
          dayTitle = `Día ${day}: Piernas & Core`;
          dayFocus = 'Cuádriceps, Isquiotibiales y Abdomen';
        }
      }

      return {
        dayNumber: day,
        title: dayTitle,
        focus: `${dayFocus} (Semana ${week})`,
        duration: isRest ? 15 : 35,
        exercisesCount: isRest ? 2 : 5,
        xpReward: isRest ? 50 : 150 + Math.floor(day * 1.5),
        isRestDay: isRest,
      };
    }),
  },
  {
    id: 'monthly_shred_metabolism',
    type: 'monthly',
    title: 'Metabolismo de Acero (30 Días)',
    subtitle: 'Quema de tejido adiposo y densidad muscular',
    description: 'Protocolo de alta intensidad metabólica que maximiza el consumo de oxígeno post-ejercicio (EPOC) para esculpir un físico magro y letal.',
    durationLabel: '30 Días • 25-35 min/día',
    difficulty: 'Avanzado',
    targetAttribute: 'Agilidad',
    attributeColor: '#00F0FF',
    totalXPReward: 4200,
    emoji: '🔥',
    daysSchedule: Array.from({ length: 30 }, (_, index) => {
      const day = index + 1;
      const isRest = day % 4 === 0 || day === 30;

      return {
        dayNumber: day,
        title: isRest ? `Día ${day}: Protocolo de Enfriamiento` : `Día ${day}: Circuito Metabólico`,
        focus: isRest ? 'Movilidad articular y respiración' : 'HIIT Táctico & Densidad Muscular',
        duration: isRest ? 15 : 30,
        exercisesCount: isRest ? 2 : 5,
        xpReward: isRest ? 45 : 140 + Math.floor(day * 1.2),
        isRestDay: isRest,
      };
    }),
  },
  {
    id: 'monthly_titan_hypertrophy',
    type: 'monthly',
    title: 'Mesociclo Hipertrofia Titánica (30 Días)',
    subtitle: 'Masa muscular densa y fuerza pura de Rango B a A',
    description: 'Periodización de sobrecarga progresiva diseñada por CORTEX. Aumenta el volumen de series y la densidad neuromuscular cada 7 días para forzar la hipertrofia miofibrilar.',
    durationLabel: '30 Días • 35-42 min/día',
    difficulty: 'Avanzado',
    targetAttribute: 'Fuerza',
    attributeColor: '#F59E0B',
    totalXPReward: 4800,
    emoji: '🏛️',
    daysSchedule: Array.from({ length: 30 }, (_, index) => {
      const day = index + 1;
      const isRest = day % 4 === 0 || day === 30;
      const week = Math.ceil(day / 7);

      return {
        dayNumber: day,
        title: isRest ? `Día ${day}: Supercompensación Titánica` : `Día ${day}: Sobrecarga de Tensión Mecánica`,
        focus: isRest ? 'Descanso activo y síntesis proteica' : `Hipertrofia Miofibrilar (Fase Semana ${week})`,
        duration: isRest ? 15 : 38,
        exercisesCount: isRest ? 2 : 5,
        xpReward: isRest ? 60 : 160 + Math.floor(day * 1.6),
        isRestDay: isRest,
      };
    }),
  },
  {
    id: 'monthly_shadow_monarch_ascension',
    type: 'monthly',
    title: 'Ascensión del Monarca de las Sombras (30 Días)',
    subtitle: 'El protocolo supremo para cazadores Rango S',
    description: 'El desafío definitivo del Sistema. Demanda resistencia anaeróbica, potencia pura y disciplina mental inquebrantable a través de 30 días de combate contra los límites humanos.',
    durationLabel: '30 Días • 35-45 min/día',
    difficulty: 'Avanzado',
    targetAttribute: 'Mente',
    attributeColor: '#9333EA',
    totalXPReward: 5500,
    emoji: '🌌',
    daysSchedule: Array.from({ length: 30 }, (_, index) => {
      const day = index + 1;
      const isRest = day % 5 === 0;

      return {
        dayNumber: day,
        title: isRest ? `Día ${day}: Regeneración de Maná y Tejido` : `Día ${day}: Ascensión del Monarca`,
        focus: isRest ? 'Calma neural y descompresión espinal' : 'Capacidad de trabajo límite & Potencia neuromuscular',
        duration: isRest ? 18 : 40,
        exercisesCount: isRest ? 3 : 6,
        xpReward: isRest ? 70 : 180 + Math.floor(day * 1.8),
        isRestDay: isRest,
      };
    }),
  },
  {
    id: 'monthly_calisthenics_mastery',
    type: 'monthly',
    title: 'Dominio Calisténico Total (30 Días)',
    subtitle: 'Fuerza relativa sobrehumana y control de peso corporal',
    description: 'Construye un físico ágil, atlético y functional dominando flexiones complejas, palancas, sentadillas a una pierna y estabilidad en suspensión.',
    durationLabel: '30 Días • 30-35 min/día',
    difficulty: 'Intermedio',
    targetAttribute: 'Agilidad',
    attributeColor: '#06B6D4',
    totalXPReward: 4400,
    emoji: '🤸',
    daysSchedule: Array.from({ length: 30 }, (_, index) => {
      const day = index + 1;
      const isRest = day % 4 === 0 || day === 30;

      return {
        dayNumber: day,
        title: isRest ? `Día ${day}: Recarga Articular` : `Día ${day}: Palancas y Dominio Motor`,
        focus: isRest ? 'Movilidad de muñecas, hombros y caderas' : 'Calistenia de alta precisión y control isométrico',
        duration: isRest ? 15 : 32,
        exercisesCount: isRest ? 2 : 5,
        xpReward: isRest ? 50 : 150 + Math.floor(day * 1.4),
        isRestDay: isRest,
      };
    }),
  },
];

/**
 * MOTOR DE GENERACIÓN Y ADAPTACIÓN DE CIRCUITOS:
 * Obtiene el circuito de ejercicios del día seleccionado del plan y lo adapta
 * dinámicamente según:
 * 1. Equipamiento disponible (Gimnasio, Mancuernas, Peso Corporal puro)
 * 2. Experiencia previa (Principiante -> Asistidos, Intermedio -> Estándar, Avanzado -> Progresiones)
 * 3. Nivel de cazador en la app (Escala series, reps, tiempo de descanso y recompensas XP)
 */
export function getPlanDayCircuit(
  plan: TrainingPlan,
  dayNumber: number,
  userProfile?: {
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    level?: number;
    equipment?: string[];
    weight?: number;
    height?: number;
    kneeFriendly?: boolean;
  }
): CircuitExercise[] {
  let selectedCircuit: CircuitExercise[] = [];
  const day = plan.daysSchedule.find((d) => d.dayNumber === dayNumber) || plan.daysSchedule[0];

  const isBeginnerPlan =
    plan.difficulty === 'Principiante' ||
    plan.id.includes('beginner') ||
    plan.id.includes('genesis');

  if (day.circuit && day.circuit.length > 0) {
    selectedCircuit = day.circuit;
  } else if (day.isRestDay) {
    selectedCircuit = [
      {
        id: '1167',
        name: 'Descompresión de Pectorales & Hombros',
        targetCount: 45,
        repsLabel: '45s de apertura torácica',
        imageKey: '1167',
        muscles: ['Pectorales', 'Hombros', 'Trapecios'],
        sets: 2,
        restTimeSeconds: 30,
        xpReward: Math.round(day.xpReward / 3),
      },
      {
        id: '1346',
        name: 'Descompresión de Dorsales & Espalda',
        targetCount: 45,
        repsLabel: '45s de relajación espinal',
        imageKey: '1346',
        muscles: ['Dorsal Ancho', 'Espalda', 'Columna'],
        sets: 2,
        restTimeSeconds: 30,
        xpReward: Math.round(day.xpReward / 3),
      },
      {
        id: '1511',
        name: 'Extensión Isquiotibial & Cadena Posterior',
        targetCount: 45,
        repsLabel: '45s de elongación suave',
        imageKey: '1511',
        muscles: ['Isquiotibiales', 'Zona Lumbar'],
        sets: 2,
        restTimeSeconds: 30,
        xpReward: Math.round(day.xpReward / 3),
      },
    ];
  } else {
    // Generación dinámica modular para planes largos (30 días)
    const modulo = dayNumber % 3;
    if (isBeginnerPlan) {
      if (modulo === 1) {
        // Día Empuje Asistido
        selectedCircuit = [
          { id: 'pushups_assisted', name: 'Flexiones Inclinadas de Pecho', targetCount: 10, repsLabel: '10 reps controladas', imageKey: 'pushups_assisted', muscles: ['Pectorales', 'Tríceps'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'overhead_press', name: 'Press Militar Asistido', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'overhead_press', muscles: ['Deltoides'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps', targetCount: 12, repsLabel: '12 reps suaves', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 30, xpReward: 25 },
          { id: 'plank_assisted', name: 'Plancha con Apoyo de Rodillas', targetCount: 10, repsLabel: '20s de tensión', imageKey: 'plank_assisted', muscles: ['Core'], sets: 3, restTimeSeconds: 35, xpReward: 25 },
        ];
      } else if (modulo === 2) {
        // Día Tirón y Espalda Segura
        selectedCircuit = [
          { id: 'dumbbell_row', name: 'Remo con Mancuerna Unilateral', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Espalda'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Dorsales'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'barbell_curl', name: 'Curl de Bíceps Táctico', targetCount: 10, repsLabel: '10 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 30, xpReward: 25 },
          { id: 'glute_bridge', name: 'Puente de Glúteos en Suelo', targetCount: 12, repsLabel: '12 reps con contracción', imageKey: 'glute_bridge', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 30, xpReward: 25 },
        ];
      } else {
        // Día Piernas Cero Impacto
        selectedCircuit = [
          { id: 'squats_assisted', name: 'Sentadilla Asistida con Soporte', targetCount: 12, repsLabel: '12 reps profundas y lentas', imageKey: 'squats_assisted', muscles: ['Cuádriceps', 'Glúteos'], sets: 3, restTimeSeconds: 35, xpReward: 30 },
          { id: 'glute_bridge', name: 'Puente de Glúteos en Suelo', targetCount: 12, repsLabel: '12 reps con pausa', imageKey: 'glute_bridge', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 30, xpReward: 30 },
          { id: 'glute_bridge_march', name: 'Marcha de Puente Pélvico', targetCount: 12, repsLabel: '12 reps alternadas', imageKey: 'glute_bridge_march', muscles: ['Cadena Posterior'], sets: 3, restTimeSeconds: 30, xpReward: 25 },
          { id: 'plank_assisted', name: 'Plancha con Apoyo de Rodillas', targetCount: 10, repsLabel: '20s de respiración', imageKey: 'plank_assisted', muscles: ['Core'], sets: 3, restTimeSeconds: 35, xpReward: 25 },
        ];
      }
    } else {
      if (modulo === 1) {
        // Día Empuje & Hombros
        selectedCircuit = [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'overhead_press', muscles: ['Hombros'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'pushups', muscles: ['Pecho', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'diamond', name: 'Flexiones Diamante', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'diamond', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ];
      } else if (modulo === 2) {
        // Día Tirón & Espalda
        selectedCircuit = [
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Dorsales'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 20, repsLabel: '20 reps dinámicas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ];
      } else {
        // Día Piernas & Potencia
        selectedCircuit = [
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 8, repsLabel: '8 reps pesadas', imageKey: 'deadlift', muscles: ['Isquios', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 12, repsLabel: '12 reps por pierna', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'burpees', name: 'Burpees Tácticos', targetCount: 10, repsLabel: '10 reps explosivas', imageKey: 'burpees', muscles: ['Cardio'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 25 },
        ];
      }
    }
  }

  // Si no se proporcionó perfil o solo se envió un arreglo antiguo de equipo
  const profile = Array.isArray(userProfile)
    ? { equipment: userProfile }
    : userProfile;

  return adaptCircuitForUser(selectedCircuit, profile);
}
