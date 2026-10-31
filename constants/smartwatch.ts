export type SmartwatchBrand = 'samsung' | 'apple' | 'cubitt' | 'xiaomi';

export interface SmartwatchBrandConfig {
  id: SmartwatchBrand;
  name: string;
  accentColor: string;
  glowColor: string;
  secondaryColor: string;
  icon: string;
  badge: string;
  protocolName: string;
  popularModels: string[];
  description: string;
}

export const SMARTWATCH_BRANDS: Record<SmartwatchBrand, SmartwatchBrandConfig> = {
  samsung: {
    id: 'samsung',
    name: 'Samsung',
    accentColor: '#2563EB',
    glowColor: 'rgba(37, 99, 235, 0.4)',
    secondaryColor: '#60A5FA',
    icon: 'watch',
    badge: 'SAMSUNG HEALTH // GALAXY LINK',
    protocolName: 'Samsung Privileged Health & Health Connect',
    popularModels: [
      'Galaxy Watch 6 Classic',
      'Galaxy Watch 6',
      'Galaxy Watch 5 Pro',
      'Galaxy Watch 4',
      'Galaxy Fit 3',
    ],
    description: 'Sincronización continua de pasos, ritmo cardíaco por fotopletismografía, gasto calórico y análisis de sueño profundo.',
  },
  apple: {
    id: 'apple',
    name: 'Apple',
    accentColor: '#FA2D55',
    glowColor: 'rgba(250, 45, 85, 0.4)',
    secondaryColor: '#FB7185',
    icon: 'logo-apple',
    badge: 'APPLE HEALTHKIT // WATCH LINK',
    protocolName: 'Apple HealthKit Telemetry Bridge',
    popularModels: [
      'Apple Watch Ultra 2',
      'Apple Watch Series 9',
      'Apple Watch SE (2nd Gen)',
      'Apple Watch Ultra',
      'Apple Watch Series 8',
    ],
    description: 'Lectura en tiempo real de anillos de actividad, frecuencia cardíaca en reposo, HRV (variabilidad cardíaca) y horas de sueño.',
  },
  cubitt: {
    id: 'cubitt',
    name: 'Cubitt',
    accentColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    secondaryColor: '#34D399',
    icon: 'fitness',
    badge: 'CUBITT PRO // SMART LINK',
    protocolName: 'Cubitt Pro Bluetooth GATT Protocol',
    popularModels: [
      'Cubitt CT4 GPS Pro',
      'Cubitt Viva Pro',
      'Cubitt Aura',
      'Cubitt CT2 Pro Series',
      'Cubitt Jr Tracker',
    ],
    description: 'Protocolo BLE optimizado para Cubitt: podómetro dinámico, pulsaciones por minuto continuas, oxigenación SpO2 y gasto metabólico.',
  },
  xiaomi: {
    id: 'xiaomi',
    name: 'Xiaomi',
    accentColor: '#FF6900',
    glowColor: 'rgba(255, 105, 0, 0.4)',
    secondaryColor: '#FDBA74',
    icon: 'flash',
    badge: 'MI FITNESS // ZEPP LINK',
    protocolName: 'Xiaomi Mi Fitness & Zepp Life Ecosystem',
    popularModels: [
      'Xiaomi Smart Band 9',
      'Xiaomi Smart Band 8',
      'Xiaomi Watch 2 Pro',
      'Xiaomi Watch S3',
      'Redmi Watch 4',
    ],
    description: 'Enlace bidireccional con el ecosistema Mi Fitness: conteo milimétrico de pasos, estrés fisiológico y monitoreo cardiovascular.',
  },
};

export interface SmartwatchMetrics {
  steps: number;
  stepGoal: number;
  activeCalories: number;
  calorieGoal: number;
  currentHeartRate: number;
  restingHeartRate: number;
  maxHeartRateToday: number;
  sleepHours: number;
  sleepQuality: number; // 0-100%
  readinessScore: number; // 0-100%
  stressLevel: 'low' | 'moderate' | 'high';
  lastSyncTime: string;
  batteryLevel: number; // %
}

export interface SmartwatchAdaptiveWorkout {
  id: string;
  title: string;
  subtitle: string;
  intensity: 'recovery' | 'moderate' | 'high_intensity' | 'endurance';
  triggerReason: string;
  cortexDiagnosis: string;
  exercises: {
    id: string;
    name: string;
    reps: string;
    sets: number;
    targetCount: number;
    imageKey: string;
    muscles: string[];
  }[];
  estimatedMinutes: number;
  xpReward: number;
  vitalityGain: number;
  strengthGain: number;
  agilityGain: number;
}

export interface SmartwatchCongratulation {
  id: string;
  timestamp: number;
  dateLabel: string;
  title: string;
  message: string;
  speechText: string;
  badgeEmoji: string;
  metricKey: 'steps' | 'calories' | 'heart_rate' | 'sleep' | 'readiness';
  metricValue: string;
  tier: 'epic' | 'legendary' | 'triumph';
  spoken?: boolean;
}
