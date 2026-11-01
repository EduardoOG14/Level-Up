import { CircuitExercise } from './plans';

export interface WeeklyBoss {
  id: string;
  name: string;
  title: string;
  emoji: string;
  color: string;
  lore: string;
  totalHP: number;
  xpReward: number;
  circuit: CircuitExercise[];
}

export const WEEKLY_BOSSES: WeeklyBoss[] = [
  // =========================================================================
  // JEFE 1: IGRIS, EL COMANDANTE CARMESÍ (RANGO ROJO - NIVEL 1)
  // =========================================================================
  {
    id: 'boss_igris',
    name: 'Igris, el Comandante Carmesí',
    title: 'Caballero de Élite de la Mazmorra Roja',
    emoji: '⚔️',
    color: '#EF4444',
    lore: 'Un guardián implacable forjado en combate ancestral. Para drenar sus 1,000 puntos de armadura, debes ejecutar cada estación con control absoluto y empuje implacable.',
    totalHP: 1000,
    xpReward: 400,
    circuit: [
      {
        id: 'pushups',
        name: 'Flexiones Militares Tácticas',
        targetCount: 15,
        repsLabel: '15 reps lentas',
        imageKey: 'pushups',
        muscles: ['Pectorales', 'Tríceps', 'Core'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 80,
      },
      {
        id: 'diamond',
        name: 'Flexiones Diamante de Asalto',
        targetCount: 12,
        repsLabel: '12 reps lentas',
        imageKey: 'diamond',
        muscles: ['Tríceps', 'Pectoral Interno'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 80,
      },
      {
        id: 'pike',
        name: 'Flexiones en Pica de Demolición',
        targetCount: 10,
        repsLabel: '10 reps estrictas',
        imageKey: 'pike',
        muscles: ['Deltoides', 'Trapecios'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 80,
      },
      {
        id: 'squats',
        name: 'Sentadillas Profundas de Acero',
        targetCount: 18,
        repsLabel: '18 reps lentas',
        imageKey: 'squats',
        muscles: ['Cuádriceps', 'Glúteos'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 80,
      },
      {
        id: 'burpees',
        name: 'Burpees Tácticos Finales',
        targetCount: 12,
        repsLabel: '12 reps explosivas',
        imageKey: 'burpees',
        muscles: ['Full Body', 'Cardio'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 80,
      },
    ],
  },

  // =========================================================================
  // JEFE 2: BARUKA, EL SEÑOR DE LA ESCARCHA (RANGO ESCARCHA - NIVEL 2)
  // =========================================================================
  {
    id: 'boss_baruka',
    name: 'Baruka, el Señor de la Escarcha',
    title: 'Monarca de los Elfos de Nieve',
    emoji: '❄️',
    color: '#00F0FF',
    lore: 'Veloz como una ventisca gélida. Exige resistencia anaeróbica extrema y agilidad pura para quebrar su escudo de hielo eterno.',
    totalHP: 1200,
    xpReward: 500,
    circuit: [
      {
        id: 'climbers',
        name: 'Escaladores Tácticos de Nieve',
        targetCount: 25,
        repsLabel: '25 reps controladas',
        imageKey: 'climbers',
        muscles: ['Core', 'Cardio'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 100,
      },
      {
        id: 'lunges',
        name: 'Zancadas Tácticas de Agilidad',
        targetCount: 14,
        repsLabel: '14 reps por pierna',
        imageKey: 'lunges',
        muscles: ['Cuádriceps', 'Glúteos'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 100,
      },
      {
        id: 'pushups',
        name: 'Flexiones de Fuerza Rápida',
        targetCount: 15,
        repsLabel: '15 reps lentas',
        imageKey: 'pushups',
        muscles: ['Pectorales', 'Tríceps'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 100,
      },
      {
        id: 'squats',
        name: 'Sentadillas con Pausa Glacial',
        targetCount: 18,
        repsLabel: '18 reps lentas',
        imageKey: 'squats',
        muscles: ['Piernas', 'Core'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 100,
      },
      {
        id: 'plank',
        name: 'Plancha Isométrica Glacial',
        targetCount: 10,
        repsLabel: '45s de tensión',
        imageKey: 'plank',
        muscles: ['Core abdominal'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 100,
      },
    ],
  },

  // =========================================================================
  // JEFE 3: KARGALGAN, EL GRAN HECHICERO ORCO (RANGO A - NIVEL 3)
  // =========================================================================
  {
    id: 'boss_kargalgan',
    name: 'Kargalgan, el Gran Hechicero Orco',
    title: 'Sumo Chamán de los Altos Orcos',
    emoji: '🧙‍♂️',
    color: '#8B5CF6',
    lore: 'Líder supremo de los Altos Orcos. Protegido por una barrera arcana que solo colapsa ante la potencia de cadenas musculares compuestas y resistencia al ácido láctico.',
    totalHP: 1500,
    xpReward: 600,
    circuit: [
      {
        id: 'pushups',
        name: 'Flexiones de Ruptura Arcana',
        targetCount: 16,
        repsLabel: '16 reps estrictas',
        imageKey: 'pushups',
        muscles: ['Pecho', 'Tríceps'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 120,
      },
      {
        id: 'climbers',
        name: 'Escaladores Dinámicos de Asalto',
        targetCount: 30,
        repsLabel: '30 reps explosivas',
        imageKey: 'climbers',
        muscles: ['Core', 'Flexores'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 120,
      },
      {
        id: 'squats',
        name: 'Sentadillas Isométricas Profundas',
        targetCount: 20,
        repsLabel: '20 reps lentas',
        imageKey: 'squats',
        muscles: ['Cuádriceps', 'Glúteos'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 120,
      },
      {
        id: 'diamond',
        name: 'Flexiones Diamante de Choque',
        targetCount: 12,
        repsLabel: '12 reps lentas',
        imageKey: 'diamond',
        muscles: ['Tríceps', 'Core'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 120,
      },
      {
        id: 'plank',
        name: 'Plancha Blindada de Resistencia',
        targetCount: 10,
        repsLabel: '50s de tensión pura',
        imageKey: 'plank',
        muscles: ['Transverso Abdominal'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 120,
      },
    ],
  },

  // =========================================================================
  // JEFE 4: BERU, EL REY HORMIGA DEPREDADOR (RANGO S - NIVEL 4)
  // =========================================================================
  {
    id: 'boss_beru',
    name: 'Beru, el Rey Hormiga Depredador',
    title: 'Monarca de la Isla Jeju',
    emoji: '👑',
    color: '#F59E0B',
    lore: 'El ápice de la evolución biológica. Su velocidad y letalidad demandan fuerza explosiva, control excéntrico y determinación absoluta.',
    totalHP: 1800,
    xpReward: 750,
    circuit: [
      {
        id: 'burpees',
        name: 'Burpees de Evasión Supersónica',
        targetCount: 15,
        repsLabel: '15 reps a máxima cadencia',
        imageKey: 'burpees',
        muscles: ['Full Body', 'Cardio'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 150,
      },
      {
        id: 'diamond',
        name: 'Flexiones Diamante de Perforación',
        targetCount: 15,
        repsLabel: '15 reps lentas',
        imageKey: 'diamond',
        muscles: ['Tríceps', 'Pectorales'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 150,
      },
      {
        id: 'lunges',
        name: 'Zancadas Tácticas de Combate',
        targetCount: 16,
        repsLabel: '16 reps alternadas',
        imageKey: 'lunges',
        muscles: ['Glúteos', 'Cuádriceps'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 150,
      },
      {
        id: 'climbers',
        name: 'Escaladores de Máxima Potencia',
        targetCount: 35,
        repsLabel: '35 reps continuas',
        imageKey: 'climbers',
        muscles: ['Core', 'Hombros'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 150,
      },
      {
        id: 'plank',
        name: 'Plancha Inquebrantable de Acero',
        targetCount: 10,
        repsLabel: '60s de respiración constante',
        imageKey: 'plank',
        muscles: ['Core completo'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 150,
      },
    ],
  },

  // =========================================================================
  // JEFE 5: ANTARES, EL MONARCA DE LA DESTRUCCIÓN (RANGO FINAL - NIVEL 5)
  // =========================================================================
  {
    id: 'boss_antares',
    name: 'Antares, el Monarca de la Destrucción',
    title: 'Rey de los Dragones del Caos',
    emoji: '🐉',
    color: '#DC2626',
    lore: 'El adversario definitivo del multiverso de sombras. El aliento del dragón incinera la debilidad. Solo un Cazador que haya dominado todas las cadenas biomecánicas puede someter su voluntad.',
    totalHP: 2200,
    xpReward: 1000,
    circuit: [
      {
        id: 'burpees',
        name: 'Burpees del Colapso Ígneo',
        targetCount: 16,
        repsLabel: '16 reps explosivas',
        imageKey: 'burpees',
        muscles: ['Cuerpo Completo'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 200,
      },
      {
        id: 'pushups',
        name: 'Flexiones Militares de Dragón',
        targetCount: 20,
        repsLabel: '20 reps lentas y profundas',
        imageKey: 'pushups',
        muscles: ['Pectorales', 'Tríceps'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 200,
      },
      {
        id: 'squats',
        name: 'Sentadillas de Carga Titánica',
        targetCount: 22,
        repsLabel: '22 reps lentas',
        imageKey: 'squats',
        muscles: ['Cuádriceps', 'Glúteos'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 200,
      },
      {
        id: 'diamond',
        name: 'Flexiones Diamante de Lava',
        targetCount: 15,
        repsLabel: '15 reps estrictas',
        imageKey: 'diamond',
        muscles: ['Tríceps', 'Pectoral Interno'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 200,
      },
      {
        id: 'plank',
        name: 'Plancha Sagrada del Monarca',
        targetCount: 10,
        repsLabel: '60s de tensión absoluta',
        imageKey: 'plank',
        muscles: ['Núcleo Abdominal Completo'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 200,
      },
    ],
  },
];

export function getBossById(id: string): WeeklyBoss | undefined {
  return WEEKLY_BOSSES.find((b) => b.id === id);
}

/**
 * Resuelve el jefe activo según la escalera de progresión del usuario.
 * El jefe NUNCA cambia hasta que el usuario lo haya derrotado.
 */
export function getActiveBossForUser(defeatedBossIds: string[] = []): WeeklyBoss {
  const pendingBoss = WEEKLY_BOSSES.find((b) => !defeatedBossIds.includes(b.id));
  return pendingBoss || WEEKLY_BOSSES[WEEKLY_BOSSES.length - 1];
}

/**
 * Resuelve el jefe actual (por defecto Igris o el primer jefe pendiente no derrotado)
 */
export function getCurrentWeeklyBoss(defeatedBossIds: string[] = []): WeeklyBoss {
  return getActiveBossForUser(defeatedBossIds);
}

export function isBossRaidAvailable(now: Date = new Date()): boolean {
  const day = now.getDay();
  return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
}

export interface BossCountdown {
  isAvailable: boolean;
  label: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

export function getBossCountdown(now: Date = new Date()): BossCountdown {
  const day = now.getDay();
  const isAvailable = day === 0 || day === 6;

  if (isAvailable) {
    // Cuenta regresiva hasta el cierre del portal: Domingo 23:59:59
    const daysUntilSundayEnd = day === 6 ? 1 : 0;
    const sundayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysUntilSundayEnd,
      23,
      59,
      59,
      999
    );
    const diff = Math.max(0, sundayEnd.getTime() - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const formatted = days > 0
      ? `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`
      : `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;

    return {
      isAvailable: true,
      label: 'Tiempo restante para el cierre del Portal',
      days,
      hours,
      minutes,
      seconds,
      formatted,
    };
  } else {
    // Cuenta regresiva hasta el próximo Sábado 00:00:00 (Lunes a Viernes)
    const daysUntilSaturday = 6 - day;
    const saturdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysUntilSaturday,
      0,
      0,
      0,
      0
    );
    const diff = Math.max(0, saturdayStart.getTime() - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const formatted = days > 0
      ? `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`
      : `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;

    return {
      isAvailable: false,
      label: 'Tiempo restante para combatir contra el jefe',
      days,
      hours,
      minutes,
      seconds,
      formatted,
    };
  }
}

export function getCurrentWeekKey(now: Date = new Date()): string {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${weekNumber}`;
}
