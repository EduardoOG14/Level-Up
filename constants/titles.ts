export interface HunterTitle {
  id: string;
  name: string;
  badgeEmoji: string;
  color: string;
  lore: string;
  criteriaLabel: string;
  priority: number; // Mayor prioridad prevalece al evaluar la semana
}

export const HUNTER_TITLES: HunterTitle[] = [
  {
    id: 'monarch_shadows',
    name: 'Monarca de las Sombras',
    badgeEmoji: '👑',
    color: '#F59E0B',
    lore: 'El Sistema reconoce a aquel que doblegó al Jefe de Mazmorra y conquistó más de 3 circuitos en una misma semana. El poder absoluto reside en su voluntad.',
    criteriaLabel: 'Derrotar al Jefe Semanal + 3 Circuitos completados',
    priority: 100,
  },
  {
    id: 'boss_slayer',
    name: 'Azote de Mazmorras',
    badgeEmoji: '🩸',
    color: '#EF4444',
    lore: 'Guardián implacable capaz de pulverizar las amenazas de rango superior sin vacilar.',
    criteriaLabel: 'Derrotar al Jefe de Mazmorra del Asalto Semanal',
    priority: 80,
  },
  {
    id: 'iron_titan',
    name: 'Titán de Hierro',
    badgeEmoji: '🦾',
    color: '#8B5CF6',
    lore: 'Forjado bajo la sobrecarga biomecánica de al menos 4 circuitos de alta intensidad en los últimos 7 días.',
    criteriaLabel: 'Completar 4 o más circuitos de entrenamiento en la semana',
    priority: 70,
  },
  {
    id: 'perfect_discipline',
    name: 'Señor de la Disciplina',
    badgeEmoji: '⚡',
    color: '#00F0FF',
    lore: 'La motivación es efímera, pero su constancia es inquebrantable. Cumplió todas las directivas diarias durante la semana.',
    criteriaLabel: 'Conquistar las directivas diarias 5 o más días en la semana',
    priority: 60,
  },
  {
    id: 'pure_vitality',
    name: 'Fuente de Vitalidad',
    badgeEmoji: '💧',
    color: '#10B981',
    lore: 'Maestro del balance biológico celular. Mantuvo su hidratación táctica en nivel óptimo.',
    criteriaLabel: 'Completar la meta de 8 vasos de agua en la semana',
    priority: 50,
  },
  {
    id: 'shadow_soldier',
    name: 'Soldado de las Sombras',
    badgeEmoji: '⚔️',
    color: '#3B82F6',
    lore: 'En constante ascenso. Superó 2 circuitos y se mantiene en pie ante cualquier desafío.',
    criteriaLabel: 'Completar al menos 2 circuitos de entrenamiento en la semana',
    priority: 30,
  },
  {
    id: 'cortex_initiate',
    name: 'Iniciado de CORTEX',
    badgeEmoji: '🪨',
    color: '#9CA3AF',
    lore: 'El despertar del cazador ha comenzado. Sus primeras batallas forjarán su destino en el Sistema.',
    criteriaLabel: 'Título táctico base del Sistema',
    priority: 10,
  },
];

export function getTitleById(id: string): HunterTitle {
  return HUNTER_TITLES.find((t) => t.id === id) || HUNTER_TITLES[HUNTER_TITLES.length - 1];
}
