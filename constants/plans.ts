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
  // 1. PLANES DIARIOS (Misiones Tácticas de 1 Día)
  // =========================================================================
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
          {
            id: 'bench_press',
            name: 'Press de Banca Plano',
            targetCount: 10,
            repsLabel: '10 reps lentas',
            imageKey: 'bench_press',
            muscles: ['Pectorales', 'Tríceps'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'lat_pulldown',
            name: 'Jalón al Pecho en Polea',
            targetCount: 12,
            repsLabel: '12 reps lentas',
            imageKey: 'lat_pulldown',
            muscles: ['Dorsales', 'Bíceps'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'goblet_squat',
            name: 'Sentadilla Goblet con Carga',
            targetCount: 12,
            repsLabel: '12 reps profundas',
            imageKey: 'goblet_squat',
            muscles: ['Cuádriceps', 'Glúteos'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 30,
          },
          {
            id: 'overhead_press',
            name: 'Press Militar de Hombros',
            targetCount: 10,
            repsLabel: '10 reps estrictas',
            imageKey: 'overhead_press',
            muscles: ['Deltoides', 'Tríceps'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 30,
          },
          {
            id: 'barbell_curl',
            name: 'Curl de Bíceps Táctico',
            targetCount: 12,
            repsLabel: '12 reps estrictas',
            imageKey: 'barbell_curl',
            muscles: ['Bíceps', 'Braquial'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 30,
          },
          {
            id: 'plank',
            name: 'Plancha Abdominal Táctica',
            targetCount: 10,
            repsLabel: '30s de tensión',
            imageKey: 'plank',
            muscles: ['Core', 'Transverso'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 30,
          },
        ],
      },
    ],
  },
  {
    id: 'daily_upper_spartan',
    type: 'daily',
    title: 'Spartan Tren Superior',
    subtitle: 'Arsenal de empuje y tirón para torso',
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
        title: 'Arsenal Superior',
        focus: 'Pecho, Espalda y Brazos',
        duration: 30,
        exercisesCount: 5,
        xpReward: 175,
        circuit: [
          {
            id: 'bench_press',
            name: 'Press de Banca Plano',
            targetCount: 10,
            repsLabel: '10 reps lentas',
            imageKey: 'bench_press',
            muscles: ['Pectorales', 'Tríceps'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'dumbbell_row',
            name: 'Remo con Mancuerna Unilateral',
            targetCount: 10,
            repsLabel: '10 reps por brazo',
            imageKey: 'dumbbell_row',
            muscles: ['Dorsales', 'Romboides'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'overhead_press',
            name: 'Press Militar de Hombros',
            targetCount: 10,
            repsLabel: '10 reps lentas',
            imageKey: 'overhead_press',
            muscles: ['Deltoides', 'Trapecios'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'tricep_extension',
            name: 'Extensiones de Tríceps',
            targetCount: 12,
            repsLabel: '12 reps continuas',
            imageKey: 'tricep_extension',
            muscles: ['Tríceps'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'barbell_curl',
            name: 'Curl de Bíceps con Barra',
            targetCount: 12,
            repsLabel: '12 reps lentas',
            imageKey: 'barbell_curl',
            muscles: ['Bíceps', 'Antebrazos'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
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
          {
            id: 'goblet_squat',
            name: 'Sentadilla Goblet con Carga',
            targetCount: 12,
            repsLabel: '12 reps profundas',
            imageKey: 'goblet_squat',
            muscles: ['Cuádriceps', 'Glúteos'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'deadlift',
            name: 'Peso Muerto Táctico',
            targetCount: 8,
            repsLabel: '8 reps pesadas',
            imageKey: 'deadlift',
            muscles: ['Isquios', 'Glúteos', 'Espalda baja'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'squats',
            name: 'Sentadillas Profundas',
            targetCount: 15,
            repsLabel: '15 reps lentas',
            imageKey: 'squats',
            muscles: ['Cuádriceps', 'Glúteos'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'lunges',
            name: 'Zancadas Tácticas',
            targetCount: 12,
            repsLabel: '12 reps dinámicas',
            imageKey: 'lunges',
            muscles: ['Glúteos', 'Estabilidad'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'plank',
            name: 'Plancha Abdominal Táctica',
            targetCount: 10,
            repsLabel: '30s de tensión',
            imageKey: 'plank',
            muscles: ['Core', 'Transverso'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 30,
          },
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
          {
            id: 'burpees',
            name: 'Burpees Tácticos',
            targetCount: 12,
            repsLabel: '12 reps explosivas',
            imageKey: 'burpees',
            muscles: ['Cuerpo completo', 'Cardio'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'climbers',
            name: 'Escaladores Tácticos',
            targetCount: 20,
            repsLabel: '20 reps dinámicas',
            imageKey: 'climbers',
            muscles: ['Core', 'Flexores cadera'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 30,
          },
          {
            id: 'squats',
            name: 'Sentadillas Profundas',
            targetCount: 15,
            repsLabel: '15 reps continuas',
            imageKey: 'squats',
            muscles: ['Piernas', 'Glúteos'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 30,
          },
          {
            id: 'pushups',
            name: 'Flexiones Militares',
            targetCount: 12,
            repsLabel: '12 reps de empuje',
            imageKey: 'pushups',
            muscles: ['Pectorales', 'Tríceps'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 35,
          },
          {
            id: 'plank',
            name: 'Plancha Abdominal Táctica',
            targetCount: 10,
            repsLabel: '30s de tensión',
            imageKey: 'plank',
            muscles: ['Core', 'Transverso'],
            sets: 3,
            restTimeSeconds: 20,
            xpReward: 30,
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 2. PLANES SEMANALES (Programas de 7 Días)
  // =========================================================================
  {
    id: 'weekly_spartan_split',
    type: 'weekly',
    title: 'División Espartana (Torso / Pierna)',
    subtitle: 'Sobrecarga y frecuencia 2x semanal',
    description: 'Estructura táctica alternando tren superior y tren inferior con días de descanso activo y recarga neural.',
    durationLabel: '7 Días • 30-35 min/día',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#F59E0B',
    totalXPReward: 980,
    emoji: '🛡️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Torso Superior: Potencia A',
        focus: 'Pecho, Espalda y Hombros',
        duration: 35,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'overhead_press', muscles: ['Hombros'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Dorsales'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Tren Inferior: Cimientos A',
        focus: 'Cuádriceps, Isquios y Glúteos',
        duration: 35,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 8, repsLabel: '8 reps pesadas', imageKey: 'deadlift', muscles: ['Isquios', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'squats', name: 'Sentadillas Profundas', targetCount: 15, repsLabel: '15 reps lentas', imageKey: 'squats', muscles: ['Cuádriceps', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 20, repsLabel: '20 reps dinámicas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 3,
        title: 'Protocolo de Recuperación y Movilidad',
        focus: 'Descompresión Articular y Calma Neural',
        duration: 15,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
      {
        dayNumber: 4,
        title: 'Torso Superior: Hipertrofia B',
        focus: 'Pectorales, Dorsales y Brazos',
        duration: 35,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Dorsal'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 5,
        title: 'Tren Inferior: Potencia B',
        focus: 'Fuerza Unilateral y Cadena Posterior',
        duration: 35,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 8, repsLabel: '8 reps pesadas', imageKey: 'deadlift', muscles: ['Cadena posterior'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 12, repsLabel: '12 reps por pierna', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 20, repsLabel: '20 reps dinámicas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 6,
        title: 'Combate Total: Circuito Táctico',
        focus: 'Full Body Integrado y Cardio',
        duration: 30,
        exercisesCount: 5,
        xpReward: 180,
        circuit: [
          { id: 'burpees', name: 'Burpees Tácticos', targetCount: 10, repsLabel: '10 reps explosivas', imageKey: 'burpees', muscles: ['Cuerpo completo'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'pushups', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      },
      {
        dayNumber: 7,
        title: 'Regeneración Neural & Cierre Semanal',
        focus: 'Movilidad Articular y Descanso Parasimpático',
        duration: 15,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
    ],
  },
  {
    id: 'weekly_hunter_calisthenics',
    type: 'weekly',
    title: 'Monarca Push / Pull / Legs',
    subtitle: 'El clásico split de alto rendimiento',
    description: 'Enfoque biomecánico en tres pilares: Empuje (pecho, tríceps, hombros), Tirón (espalda, bíceps) y Piernas completas.',
    durationLabel: '7 Días • 30 min/día',
    difficulty: 'Intermedio',
    targetAttribute: 'Fuerza',
    attributeColor: '#EF4444',
    totalXPReward: 960,
    emoji: '⚔️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Día 1: Empuje (Push)',
        focus: 'Pectorales, Deltoides Anterior y Tríceps',
        duration: 30,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'overhead_press', muscles: ['Hombros'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'pushups', muscles: ['Pecho', 'Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'diamond', name: 'Flexiones Diamante', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'diamond', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Día 2: Tirón (Pull)',
        focus: 'Dorsales, Trapecios y Bíceps',
        duration: 30,
        exercisesCount: 4,
        xpReward: 150,
        circuit: [
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Dorsales'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Espalda media'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'barbell_curl', name: 'Curl de Bíceps Táctico', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      },
      {
        dayNumber: 3,
        title: 'Día 3: Piernas (Legs)',
        focus: 'Cuádriceps, Glúteos y Gemelos',
        duration: 30,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 8, repsLabel: '8 reps pesadas', imageKey: 'deadlift', muscles: ['Isquios', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 12, repsLabel: '12 reps por pierna', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 20, repsLabel: '20 reps dinámicas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 4,
        title: 'Día 4: Descanso Táctico',
        focus: 'Movilidad y Respiración Diafragmática',
        duration: 15,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
      {
        dayNumber: 5,
        title: 'Día 5: Torso Superior Completo',
        focus: 'Densidad Muscular de Torso',
        duration: 35,
        exercisesCount: 5,
        xpReward: 170,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'overhead_press', muscles: ['Hombros'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 6,
        title: 'Día 6: Pierna & Resistencia Anaeróbica',
        focus: 'Fuerza Explosiva y Salto',
        duration: 30,
        exercisesCount: 5,
        xpReward: 160,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'burpees', name: 'Burpees Tácticos', targetCount: 10, repsLabel: '10 reps explosivas', imageKey: 'burpees', muscles: ['Cardio', 'Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 12, repsLabel: '12 reps por pierna', imageKey: 'lunges', muscles: ['Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'climbers', name: 'Escaladores Tácticos', targetCount: 20, repsLabel: '20 reps dinámicas', imageKey: 'climbers', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 7,
        title: 'Día 7: Calma Parasimpática',
        focus: 'Alargamiento Muscular y Recuperación',
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
    title: 'Fuerza de Hierro (Gimnasio & Cargas)',
    subtitle: 'Protocolo de sobrecarga con barras y mancuernas',
    description: 'Diseñado específicamente para cazadores con acceso a gimnasio completo, mancuernas pesadas y poleas.',
    durationLabel: '7 Días • 40 min/día',
    difficulty: 'Avanzado',
    targetAttribute: 'Fuerza',
    attributeColor: '#8B5CF6',
    totalXPReward: 1050,
    emoji: '🏋️‍♂️',
    daysSchedule: [
      {
        dayNumber: 1,
        title: 'Día 1: Pecho de Acero & Tríceps',
        focus: 'Pectoral Mayor y Bloqueo de Tríceps',
        duration: 40,
        exercisesCount: 5,
        xpReward: 180,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho'], sets: 4, restTimeSeconds: 20, xpReward: 40 },
          { id: 'pushups', name: 'Flexiones Militares', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'pushups', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps estrictas', imageKey: 'overhead_press', muscles: ['Hombros'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps en Polea', targetCount: 12, repsLabel: '12 reps continuas', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
        ],
      },
      {
        dayNumber: 2,
        title: 'Día 2: Espalda Dorsal & Bíceps',
        focus: 'Jalón en Polea y Peso Muerto',
        duration: 40,
        exercisesCount: 5,
        xpReward: 180,
        circuit: [
          { id: 'deadlift', name: 'Peso Muerto Táctico con Barra', targetCount: 8, repsLabel: '8 reps pesadas', imageKey: 'deadlift', muscles: ['Espalda baja', 'Cadena posterior'], sets: 4, restTimeSeconds: 20, xpReward: 40 },
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Dorsal'], sets: 4, restTimeSeconds: 20, xpReward: 40 },
          { id: 'dumbbell_row', name: 'Remo Unilateral con Mancuerna', targetCount: 10, repsLabel: '10 reps por brazo', imageKey: 'dumbbell_row', muscles: ['Espalda media'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 3,
        title: 'Día 3: Piernas de Titán',
        focus: 'Sentadilla con Carga e Isquios',
        duration: 40,
        exercisesCount: 5,
        xpReward: 180,
        circuit: [
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Cuádriceps'], sets: 4, restTimeSeconds: 20, xpReward: 40 },
          { id: 'deadlift', name: 'Peso Muerto Táctico', targetCount: 8, repsLabel: '8 reps pesadas', imageKey: 'deadlift', muscles: ['Isquios', 'Glúteos'], sets: 4, restTimeSeconds: 20, xpReward: 40 },
          { id: 'squats', name: 'Sentadillas Profundas', targetCount: 15, repsLabel: '15 reps lentas', imageKey: 'squats', muscles: ['Cuádriceps', 'Glúteos'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'lunges', name: 'Zancadas Tácticas', targetCount: 12, repsLabel: '12 reps por pierna', imageKey: 'lunges', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 4,
        title: 'Día 4: Protocolo de Descanso Activo',
        focus: 'Movilidad Lumbar y Descompresión',
        duration: 15,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
      {
        dayNumber: 5,
        title: 'Día 5: Hombros Blindados & Brazos',
        focus: 'Deltoides, Bíceps y Tríceps',
        duration: 35,
        exercisesCount: 5,
        xpReward: 170,
        circuit: [
          { id: 'overhead_press', name: 'Press Militar de Hombros', targetCount: 10, repsLabel: '10 reps estrictas', imageKey: 'overhead_press', muscles: ['Hombros'], sets: 4, restTimeSeconds: 20, xpReward: 40 },
          { id: 'pike', name: 'Flexiones en Pica', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'pike', muscles: ['Deltoides', 'Trapecios'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'barbell_curl', name: 'Curl de Bíceps con Barra', targetCount: 12, repsLabel: '12 reps estrictas', imageKey: 'barbell_curl', muscles: ['Bíceps'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'tricep_extension', name: 'Extensiones de Tríceps en Polea', targetCount: 12, repsLabel: '12 reps continuas', imageKey: 'tricep_extension', muscles: ['Tríceps'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 6,
        title: 'Día 6: Full Body Hipertrofia Atlas',
        focus: 'Sobrecarga de Todos los Patrones Motores',
        duration: 40,
        exercisesCount: 5,
        xpReward: 180,
        circuit: [
          { id: 'bench_press', name: 'Press de Banca Plano', targetCount: 10, repsLabel: '10 reps lentas', imageKey: 'bench_press', muscles: ['Pecho'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', targetCount: 12, repsLabel: '12 reps lentas', imageKey: 'lat_pulldown', muscles: ['Espalda'], sets: 3, restTimeSeconds: 20, xpReward: 40 },
          { id: 'goblet_squat', name: 'Sentadilla Goblet con Carga', targetCount: 12, repsLabel: '12 reps profundas', imageKey: 'goblet_squat', muscles: ['Piernas'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'burpees', name: 'Burpees Tácticos', targetCount: 10, repsLabel: '10 reps explosivas', imageKey: 'burpees', muscles: ['Metabólico'], sets: 3, restTimeSeconds: 20, xpReward: 35 },
          { id: 'plank', name: 'Plancha Abdominal Táctica', targetCount: 10, repsLabel: '30s de tensión', imageKey: 'plank', muscles: ['Core'], sets: 3, restTimeSeconds: 20, xpReward: 30 },
        ],
      },
      {
        dayNumber: 7,
        title: 'Día 7: Calma Parasimpática & Regeneración',
        focus: 'Movilidad de Cadera y Hombros',
        duration: 15,
        exercisesCount: 2,
        xpReward: 80,
        isRestDay: true,
      },
    ],
  },

  // =========================================================================
  // 3. PLANES MENSUALES (Campañas de 30 Días)
  // =========================================================================
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
  }
): CircuitExercise[] {
  let selectedCircuit: CircuitExercise[] = [];
  const day = plan.daysSchedule.find((d) => d.dayNumber === dayNumber) || plan.daysSchedule[0];

  if (day.circuit && day.circuit.length > 0) {
    selectedCircuit = day.circuit;
  } else if (day.isRestDay) {
    selectedCircuit = [
      {
        id: 'squats',
        name: 'Sentadillas Isométricas Suaves',
        targetCount: 10,
        repsLabel: '10 reps lentas de movilidad',
        imageKey: 'squats',
        muscles: ['Piernas', 'Movilidad'],
        sets: 2,
        restTimeSeconds: 25,
        xpReward: Math.round(day.xpReward / 2),
      },
      {
        id: 'plank',
        name: 'Plancha Abdominal Táctica',
        targetCount: 10,
        repsLabel: '25s de respiración',
        imageKey: 'plank',
        muscles: ['Core'],
        sets: 2,
        restTimeSeconds: 25,
        xpReward: Math.round(day.xpReward / 2),
      },
    ];
  } else {
    // Generación dinámica modular para planes largos (30 días)
    const modulo = dayNumber % 3;
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

  // Si no se proporcionó perfil o solo se envió un arreglo antiguo de equipo
  const profile = Array.isArray(userProfile)
    ? { equipment: userProfile }
    : userProfile;

  return adaptCircuitForUser(selectedCircuit, profile);
}
