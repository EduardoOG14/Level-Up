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
  {
    id: 'boss_igris',
    name: 'Igris, el Comandante Carmesí',
    title: 'Caballero de Élite de la Mazmorra Roja',
    emoji: '⚔️',
    color: '#EF4444',
    lore: 'Un guardián implacable forjado en combate ancestral. Para drenar sus 1,000 puntos de armadura, debes ejecutar cada estación con control absoluto.',
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
  {
    id: 'boss_baruka',
    name: 'Baruka, el Señor de la Escarcha',
    title: 'Monarca de los Elfos de Nieve',
    emoji: '❄️',
    color: '#00F0FF',
    lore: 'Veloz como una ventisca. Exige resistencia anaeróbica y agilidad pura para quebrar su escudo helado.',
    totalHP: 1000,
    xpReward: 400,
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
        xpReward: 80,
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
        xpReward: 80,
      },
      {
        id: 'pushups',
        name: 'Flexiones de Fuerza Rápida',
        targetCount: 14,
        repsLabel: '14 reps lentas',
        imageKey: 'pushups',
        muscles: ['Pectorales', 'Tríceps'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 80,
      },
      {
        id: 'squats',
        name: 'Sentadillas con Pausa Glacial',
        targetCount: 16,
        repsLabel: '16 reps lentas',
        imageKey: 'squats',
        muscles: ['Piernas', 'Core'],
        sets: 3,
        restTimeSeconds: 20,
        xpReward: 80,
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
        xpReward: 80,
      },
    ],
  },
];

export function getCurrentWeeklyBoss(): WeeklyBoss {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  const index = weekNumber % WEEKLY_BOSSES.length;
  return WEEKLY_BOSSES[index];
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
