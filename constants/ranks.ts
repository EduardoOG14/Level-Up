export type RankKey = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface Rank {
  key: RankKey;
  name: string;
  label: string;
  minLevel: number;
  maxLevel: number;
  minXP: number;
  maxXP: number;
  color: string;
  emoji: string;
  description: string;
}

export const RANKS: Rank[] = [
  {
    key: 'E',
    name: 'E-Rank',
    label: 'Novato',
    minLevel: 1,
    maxLevel: 10,
    minXP: 0,
    maxXP: 5000,
    color: '#9CA3AF',
    emoji: '🪨',
    description: 'El comienzo de todo. Cada gran leyenda empezó aquí.',
  },
  {
    key: 'D',
    name: 'D-Rank',
    label: 'Aprendiz',
    minLevel: 11,
    maxLevel: 20,
    minXP: 5001,
    maxXP: 15000,
    color: '#78716C',
    emoji: '🥉',
    description: 'Ya no eres un principiante. El camino apenas comienza.',
  },
  {
    key: 'C',
    name: 'C-Rank',
    label: 'Guerrero',
    minLevel: 21,
    maxLevel: 35,
    minXP: 15001,
    maxXP: 35000,
    color: '#C0C0C0',
    emoji: '🥈',
    description: 'Tu cuerpo se está forjando. La disciplina es tu arma.',
  },
  {
    key: 'B',
    name: 'B-Rank',
    label: 'Élite',
    minLevel: 36,
    maxLevel: 50,
    minXP: 35001,
    maxXP: 65000,
    color: '#F59E0B',
    emoji: '🥇',
    description: 'Pocos llegan aquí. Eres parte de la élite.',
  },
  {
    key: 'A',
    name: 'A-Rank',
    label: 'Maestro',
    minLevel: 51,
    maxLevel: 70,
    minXP: 65001,
    maxXP: 110000,
    color: '#10B981',
    emoji: '💎',
    description: 'Tu maestría es evidente. Inspiras a los que te rodean.',
  },
  {
    key: 'S',
    name: 'S-Rank',
    label: 'Legendario',
    minLevel: 71,
    maxLevel: 90,
    minXP: 110001,
    maxXP: 175000,
    color: '#3B82F6',
    emoji: '🔥',
    description: 'Leyenda viviente. Tu nombre se conoce en el sistema.',
  },
  {
    key: 'SS',
    name: 'SS-Rank',
    label: 'Mítico',
    minLevel: 91,
    maxLevel: 99,
    minXP: 175001,
    maxXP: 260000,
    color: '#8B5CF6',
    emoji: '⚡',
    description: 'Mítico. Más allá de los límites humanos normales.',
  },
  {
    key: 'SSS',
    name: 'SSS-Rank',
    label: 'Trascendente',
    minLevel: 100,
    maxLevel: 100,
    minXP: 260001,
    maxXP: 999999,
    color: '#F97316',
    emoji: '👑',
    description: 'La cima absoluta. Trascendiste todos los límites.',
  },
];

export function getRankByXP(xp: number): Rank {
  return RANKS.slice().reverse().find((r) => xp >= r.minXP) || RANKS[0];
}

export function getRankByLevel(level: number): Rank {
  return RANKS.slice().reverse().find((r) => level >= r.minLevel) || RANKS[0];
}

export function getLevelByXP(xp: number): number {
  if (xp <= 0) return 1;
  // Progressive XP per level: level n requires n * 500 XP cumulative
  let totalXP = 0;
  for (let level = 1; level <= 100; level++) {
    totalXP += level * 500;
    if (xp < totalXP) return level;
  }
  return 100;
}

export function getXPForNextLevel(currentXP: number): { current: number; required: number; progress: number } {
  const currentLevel = getLevelByXP(currentXP);
  if (currentLevel >= 100) return { current: currentXP, required: currentXP, progress: 1 };
  
  let xpForCurrentLevel = 0;
  let xpForNextLevel = 0;
  let cumulative = 0;
  
  for (let l = 1; l <= 100; l++) {
    const prev = cumulative;
    cumulative += l * 500;
    if (l === currentLevel) xpForCurrentLevel = prev;
    if (l === currentLevel + 1) { xpForNextLevel = cumulative; break; }
  }
  
  const required = xpForNextLevel - xpForCurrentLevel;
  const current = currentXP - xpForCurrentLevel;
  return { current, required, progress: Math.min(current / required, 1) };
}
