import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../../stores/userStore';
import { usePlanStore } from '../../stores/planStore';
import { StreakEngine, type DailyStreakStatus } from '../../services/streakEngine';
import { StreakStatusCard } from '../../components/gamification/StreakStatusCard';
import { RankBadge } from '../../components/ui/RankBadge';
import { type Quest } from '../../components/gamification/QuestCard';
import { QuestDetailModal } from '../../components/gamification/QuestDetailModal';
import {
  EXERCISE_GUIDES,
  resolveExerciseGuide,
  isExerciseAvailable,
  getBodyweightAlternativeKey,
} from '../../constants/exercises';
import { DailyCompletionModal } from '../../components/gamification/DailyCompletionModal';
import { WeeklyWeightModal } from '../../components/progress/WeeklyWeightModal';
import { useProgressStore } from '../../stores/progressStore';
import { Card } from '../../components/ui/Card';
import { getXPForNextLevel, getRankByXP } from '../../constants/ranks';
import { generateDailyQuests, generateDailyTip } from '../../services/gemini';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import type { UserContext } from '../../services/gemini';
import { renderAvatarContent } from '../../components/ui/Avatar';
import { useWaterStore } from '../../stores/waterStore';
import { useAchievementStore } from '../../stores/achievementStore';
import { useTitleStore } from '../../stores/titleStore';
import { usePenaltyStore } from '../../stores/penaltyStore';
import { Haptics } from '../../services/haptics';
import { SoundEffects } from '../../services/soundEffects';
import { CORTEXNotifications } from '../../services/notifications';
import { SmartwatchSyncModal } from '../../components/smartwatch/SmartwatchSyncModal';
import { useSmartwatchStore } from '../../stores/smartwatchStore';
import { PlanCircuitModal, type CustomCircuitData } from '../../components/plans/PlanCircuitModal';
import { TodayWorkoutCard } from '../../components/dashboard/TodayWorkoutCard';
import { DailyRewardChestModal } from '../../components/gamification/DailyRewardChestModal';

// Obtiene la clave de fecha del día actual YYYY-MM-DD
const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Protocolo táctico base con exactamente 5 Misiones Diarias
export const DEFAULT_FIVE_QUESTS: Quest[] = [
  {
    id: 'quest_1',
    exerciseKey: 'pushups',
    title: 'Misión 1: Flexiones Militares Tácticas',
    description: 'Ejecuta 3 series con cadencia lenta de 4s bajada y 2s pausa isométrica.',
    category: 'exercise',
    xpReward: 120,
    statBoost: { stat: 'strength', value: 1 },
    icon: '⚔️',
    completed: false,
    exerciseName: 'Flexiones Militares / Push-Ups',
    targetMuscles: ['Pectorales', 'Tríceps', 'Deltoides', 'Core'],
    sets: 3,
    reps: '10 - 12 reps lentas',
    difficulty: 'Rango E',
    instructions: [
      'Manos al ancho de hombros con el cuerpo en línea recta.',
      'Desciende despacio en 4 segundos hasta 2 cm del suelo.',
      'Sostén 2 segundos de pausa isométrica en el fondo.',
      'Empuja constante en 2 segundos hasta la posición inicial.',
    ],
    cortexAdvice: 'El control excéntrico es la clave del poder físico.',
  },
  {
    id: 'quest_2',
    exerciseKey: 'squats',
    title: 'Misión 2: Sentadillas Tácticas de Cazador',
    description: 'Desarrolla la base del tren inferior con descenso controlado y máxima estabilidad articular.',
    category: 'exercise',
    xpReward: 120,
    statBoost: { stat: 'agility', value: 1 },
    icon: '🦵',
    completed: false,
    exerciseName: 'Sentadillas Tácticas / Potty Squat',
    targetMuscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Cadena Posterior'],
    sets: 3,
    reps: '10 - 12 reps lentas',
    difficulty: 'Rango E',
    instructions: [
      'Pies separados al ancho de hombros con puntas ligeramente hacia afuera.',
      'Baja despacio en 3 segundos empujando la cadera hacia atrás hasta los 90°.',
      'Pausa isométrica de 1 segundo en el paralelo sin rebotar.',
      'Sube con potencia constante empujando exclusivamente desde los talones.',
    ],
    cortexAdvice: 'Rodillas alineadas con el segundo dedo del pie. Si tienes sobrepeso, siéntate en una silla (Box Squat) para proteger tus meniscos.',
  },
  {
    id: 'quest_3',
    exerciseKey: 'pike',
    title: 'Misión 3: Flexiones en Pica / Pike Push-Ups',
    description: 'Enfoque estricto en deltoides, hombros y tríceps con peso corporal.',
    category: 'exercise',
    xpReward: 120,
    statBoost: { stat: 'strength', value: 1 },
    icon: '⚡',
    completed: false,
    exerciseName: 'Flexiones en Pica / Pike Push-Ups',
    targetMuscles: ['Deltoides anterior', 'Deltoides medio', 'Tríceps', 'Core'],
    sets: 3,
    reps: '8 - 10 reps lentas',
    difficulty: 'Rango D',
    instructions: [
      'Posición de V invertida con cadera elevada y piernas rectas.',
      'Baja la cabeza despacio en 4 segundos hacia el frente de tus manos.',
      'Sostén 2 segundos de tensión pura en hombros en el fondo.',
      'Empuja con potencia en 2 segundos hasta extender los brazos.',
    ],
    cortexAdvice: 'Excelente para construir fuerza de empuje vertical sin mancuernas ni pesas.',
  },
  {
    id: 'quest_4',
    exerciseKey: 'diamond',
    title: 'Misión 4: Flexiones Diamante de Poder',
    description: 'Alinea los dedos para enfocar el esfuerzo en tríceps y pectoral interno.',
    category: 'exercise',
    xpReward: 130,
    statBoost: { stat: 'strength', value: 2 },
    icon: '💎',
    completed: false,
    exerciseName: 'Flexiones Diamante / Diamond Push-Ups',
    targetMuscles: ['Tríceps', 'Pectoral Interno', 'Deltoides anterior'],
    sets: 3,
    reps: '8 - 10 reps lentas',
    difficulty: 'Rango D',
    instructions: [
      'Junta las manos formando un diamante bajo el centro del pecho.',
      'Desciende despacio en 4 segundos sintiendo la tensión en tríceps.',
      'Pausa de 2 segundos rozando el dorso de las manos.',
      'Empuja con potencia controlada en 2 segundos.',
    ],
    cortexAdvice: 'Si la intensidad es muy alta, apoya las rodillas para no comprometer la técnica.',
  },
  {
    id: 'quest_5',
    exerciseKey: 'rear_lunge',
    title: 'Misión 5: Zancadas Tácticas de Agilidad',
    description: 'Paso largo y controlado para fuerza unilateral y estabilidad de rodilla.',
    category: 'exercise',
    xpReward: 130,
    statBoost: { stat: 'agility', value: 2 },
    icon: '⚡',
    completed: false,
    exerciseName: 'Zancadas Tácticas / Reverse Lunge',
    targetMuscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Equilibrio'],
    sets: 3,
    reps: '10 reps por pierna',
    difficulty: 'Rango D',
    instructions: [
      'Da un paso hacia atrás (zancada inversa) manteniendo el torso erguido.',
      'Desciende en 3 segundos hasta que la rodilla trasera quede a 2 cm del suelo.',
      'Sostén 1 segundo de pausa manteniendo la tibia delantera a 90°.',
      'Impulsa desde el talón delantero para volver a la posición inicial.',
    ],
    cortexAdvice: 'El paso hacia atrás (zancada inversa) elimina más del 50% del estrés de cizallamiento en la rótula.',
  },
];

export default function HomeScreen() {
  const { user, addXP, updateStreak, updateProfile, isLoading } = useUserStore();
  const { isCurrentPlanCompleted, getActivePlan, completedDayNumbers, completePlanDay } = usePlanStore();
  const router = useRouter();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showWeeklyWeightModal, setShowWeeklyWeightModal] = useState(false);
  const [showSmartwatchModal, setShowSmartwatchModal] = useState(false);
  const [showAdaptedCircuitModal, setShowAdaptedCircuitModal] = useState(false);
  const [smartwatchCircuitData, setSmartwatchCircuitData] = useState<CustomCircuitData | null>(null);
  const [streakStatus, setStreakStatus] = useState<DailyStreakStatus | null>(null);
  const [showDailyChestModal, setShowDailyChestModal] = useState(false);
  const [isDailyChestClaimedToday, setIsDailyChestClaimedToday] = useState(false);
  const [showTodayPlanModal, setShowTodayPlanModal] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(!SoundEffects.getIsEnabled());
  const [cortexTip, setCortexTip] = useState<string>(
    'Controla la cadencia excéntrica en cada repetición para potenciar la hipertrofia y la fortaleza neural. ⚡'
  );

  const checkDailyChestStatus = useCallback(async () => {
    try {
      const todayKey = getTodayDateKey();
      const uid = user?.uid || 'guest';
      const claimed = await AsyncStorage.getItem(`@fitrise_daily_chest_${uid}_${todayKey}`);
      setIsDailyChestClaimedToday(claimed === 'claimed');
    } catch {
      // Ignorar error de lectura local
    }
  }, [user?.uid]);

  const refreshStreakStatus = useCallback(async () => {
    if (!user?.uid) return;
    const status = await StreakEngine.getDailyStatus(user.uid);
    setStreakStatus(status);
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      refreshStreakStatus();
      checkDailyChestStatus();
      setIsSoundMuted(!SoundEffects.getIsEnabled());
      if (user) {
        usePlanStore.getState().syncCortexDailyDirective(user);
      }
    }, [refreshStreakStatus, checkDailyChestStatus, user])
  );

  // Pulso continuo del Sistema Solo Leveling
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const liveScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  const borderPulse = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 240, 255, 0.25)', 'rgba(0, 240, 255, 0.65)'],
  });

  const {
    initialize: initSmartwatch,
    adaptiveWorkout,
    brand: watchBrand,
    deviceName: watchDeviceName,
    isConnected: isWatchConnected,
    metrics: watchMetrics,
  } = useSmartwatchStore();
  const { loadProgress, recordDailyQuestsCompleted } = useProgressStore();
  const { loadTodayWater, currentMl, targetMl, cupsDrank, drinkCup, drinkCups, undoCup } = useWaterStore();
  const { loadAchievements, checkAutomaticAchievements } = useAchievementStore();
  const { currentTitle, loadAndEvaluateTitle } = useTitleStore();
  const { isPenaltyActive, checkAndTriggerPenalty, resolvePenalty } = usePenaltyStore();

  useEffect(() => {
    if (!isLoading) {
      if (!user || !user.goals || user.goals.length === 0) {
        router.replace('/(auth)/onboarding');
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    initSmartwatch();
    if (user?.uid) {
      loadTodayWater(user.uid);
      loadAchievements(user.uid);
      CORTEXNotifications.scheduleDailyDirectives();

      checkAndTriggerPenalty(user.uid, user.lastActiveDate, user.streak);

      loadProgress(user.uid).then(() => {
        const weeklyCircuits = useProgressStore.getState().getWeeklyCircuitsCount();
        const weeklyQuestDays = useProgressStore.getState().getWeeklyQuestDaysCount();
        const bossDefeated = useAchievementStore.getState().unlockedIds.includes('boss_weekly_slayer');

        loadAndEvaluateTitle(user.uid, {
          weeklyCircuits,
          weeklyQuestDays,
          bossDefeated,
          waterFullToday: useWaterStore.getState().isWaterFullToday(),
        });

        if (useProgressStore.getState().isWeeklyCheckinDue()) {
          setShowWeeklyWeightModal(true);
        }
        checkAutomaticAchievements(user.uid, user);
      });
    }
  }, [user?.uid]);

  const rank = user ? getRankByXP(user.totalXP) : null;
  const xpInfo = user ? getXPForNextLevel(user.totalXP) : null;

  const userContext: UserContext | null = user
    ? {
        name: user.name,
        level: user.level,
        rank: user.rank,
        totalXP: user.totalXP,
        stats: user.stats,
        streak: user.streak,
        goals: user.goals,
        fitnessLevel: user.fitnessLevel,
        equipment: user.equipment,
        age: user.age,
        weight: user.weight,
        height: user.height,
        activeTitle: currentTitle?.name,
        penaltyActive: isPenaltyActive,
        waterIntakeMl: currentMl,
        waterTargetMl: targetMl,
        smartwatch: isWatchConnected && watchBrand ? {
          brand: watchBrand,
          deviceName: watchDeviceName || watchBrand,
          steps: watchMetrics.steps,
          stepGoal: watchMetrics.stepGoal,
          heartRate: watchMetrics.currentHeartRate,
          restingHeartRate: watchMetrics.restingHeartRate,
          activeCalories: watchMetrics.activeCalories,
          sleepHours: watchMetrics.sleepHours,
          readinessScore: watchMetrics.readinessScore,
          stressLevel: watchMetrics.stressLevel,
        } : undefined,
      }
    : null;

  useEffect(() => {
    if (user?.uid && userContext) {
      const today = getTodayDateKey();
      const tipKey = `@fitrise_daily_tip_${user.uid}_${today}`;
      AsyncStorage.getItem(tipKey).then((saved) => {
        if (saved) {
          setCortexTip(saved);
        } else {
          generateDailyTip(userContext)
            .then((tip) => {
              if (tip && tip.trim()) {
                const cleaned = tip.replace(/\n+/g, ' ').trim();
                setCortexTip(cleaned);
                AsyncStorage.setItem(tipKey, cleaned);
              }
            })
            .catch(() => {});
        }
      });
    }
  }, [user?.uid]);

  const enrichQuest = (q: any, index: number): Quest => {
    const text = `${q.title || ''} ${q.description || ''} ${q.exerciseName || ''}`.toLowerCase();
    const userEq = userContext?.equipment || ['none'];
    let guide = EXERCISE_GUIDES.default;

    // 1. Si la quest trae una clave directa o ID de ejercicio, resolverla prioritariamente
    if (q.exerciseId || q.imageKey || q.exerciseKey) {
      guide = resolveExerciseGuide(q.exerciseId || q.imageKey || q.exerciseKey);
    } else if (
      text.includes('estira') ||
      text.includes('stretch') ||
      text.includes('descompre') ||
      text.includes('recupera') ||
      text.includes('movilidad') ||
      text.includes('mariposa') ||
      text.includes('yoga')
    ) {
      // Prioridad alta a protocolos de recuperación/estiramiento: previene que "pecho" active flexiones
      if (text.includes('pecho') || text.includes('hombro') || text.includes('pectoral')) {
        guide = resolveExerciseGuide('1167');
      } else if (text.includes('espalda') || text.includes('dorsal') || text.includes('columna')) {
        guide = resolveExerciseGuide('1346');
      } else if (text.includes('isquio') || text.includes('hamstring') || text.includes('pierna')) {
        guide = resolveExerciseGuide('1511');
      } else if (text.includes('glute') || text.includes('cadera') || text.includes('piriforme')) {
        guide = resolveExerciseGuide('1424');
      } else if (text.includes('cuad') || text.includes('quad')) {
        guide = resolveExerciseGuide('1512');
      } else if (text.includes('cuello') || text.includes('cervic')) {
        guide = resolveExerciseGuide('1403');
      } else {
        guide = resolveExerciseGuide('1494');
      }
    } else if (text.includes('diamante') || text.includes('diamond')) {
      guide = (EXERCISE_GUIDES as any).diamond || EXERCISE_GUIDES.pushups;
    } else if (text.includes('zancada') || text.includes('lunge')) {
      guide = (EXERCISE_GUIDES as any).lunges || EXERCISE_GUIDES.squats;
    } else if (text.includes('plancha') || text.includes('plank')) {
      guide = (EXERCISE_GUIDES as any).plank || EXERCISE_GUIDES.pushups;
    } else if (text.includes('dominada') || text.includes('pullup') || text.includes('pull-up')) {
      guide = isExerciseAvailable('pullups', userEq)
        ? (EXERCISE_GUIDES as any).pullups
        : (EXERCISE_GUIDES as any).pike;
    } else if (text.includes('fondo') || text.includes('dip')) {
      guide = isExerciseAvailable('dips', userEq)
        ? (EXERCISE_GUIDES as any).dips
        : (EXERCISE_GUIDES as any).diamond;
    } else if (text.includes('sentadilla') || text.includes('squat') || text.includes('pierna')) {
      guide = EXERCISE_GUIDES.squats;
    } else if (text.includes('biceps') || text.includes('curl') || text.includes('brazo')) {
      guide = isExerciseAvailable('curls', userEq)
        ? EXERCISE_GUIDES.curls
        : (EXERCISE_GUIDES as any).diamond;
    } else if (text.includes('pica') || text.includes('pike')) {
      guide = (EXERCISE_GUIDES as any).pike || EXERCISE_GUIDES.pushups;
    } else if (text.includes('flexion') || text.includes('push') || text.includes('pecho')) {
      guide = EXERCISE_GUIDES.pushups;
    } else {
      // Fallback por índice únicamente si el texto no coincidió con ninguna categoría
      if (index === 0) guide = EXERCISE_GUIDES.pushups;
      else if (index === 1) guide = EXERCISE_GUIDES.squats;
      else if (index === 2) guide = (EXERCISE_GUIDES as any).pike || EXERCISE_GUIDES.pushups;
      else if (index === 3) guide = (EXERCISE_GUIDES as any).diamond || EXERCISE_GUIDES.pushups;
      else if (index === 4) guide = (EXERCISE_GUIDES as any).lunges || EXERCISE_GUIDES.squats;
      else guide = EXERCISE_GUIDES.pushups;
    }

    // Garantía absoluta: si el ejercicio requiere equipo que el usuario no tiene, sustituirlo por peso corporal
    if (!isExerciseAvailable(guide.imageKey, userEq)) {
      const altKey = getBodyweightAlternativeKey(guide.imageKey);
      guide = (EXERCISE_GUIDES as any)[altKey] || EXERCISE_GUIDES.pushups;
    }

    // Ajuste por Zona de Castigo: incrementa un 50% la exigencia y recompensa
    const penaltyMultiplier = isPenaltyActive ? 1.5 : 1.0;
    const finalXp = Math.round((q.xpReward || (index >= 3 ? 130 : 120)) * penaltyMultiplier);
    const finalTitle = isPenaltyActive ? `⚠️ [CASTIGO] ${q.title || guide.name}` : (q.title || guide.name);
    const finalReps = isPenaltyActive ? `${q.reps || guide.reps} (Exigencia x1.5)` : (q.reps || guide.reps);

    return {
      id: q.id || `quest_${index + 1}`,
      title: finalTitle,
      description: isPenaltyActive
        ? 'Directiva intensificada de la Zona de Castigo para restablecer tu racha de cazador.'
        : q.description || 'Completa este protocolo táctico para ganar XP y mejorar tus estadísticas.',
      category: q.category || 'exercise',
      xpReward: finalXp,
      statBoost: q.statBoost || { stat: (index === 1 || index === 4 ? 'agility' : 'strength'), value: (index >= 3 ? 2 : 1) },
      icon: isPenaltyActive ? '🚨' : (q.icon || (index === 0 ? '⚔️' : index === 1 ? '🦵' : index === 2 ? '💪' : index === 3 ? '💎' : '⚡')),
      completed: q.completed ?? false,
      exerciseKey: guide.id,
      exerciseName: q.exerciseName || guide.name,
      targetMuscles: q.targetMuscles || guide.muscles,
      sets: q.sets || guide.sets,
      reps: finalReps,
      instructions: q.instructions || guide.steps,
      cortexAdvice: isPenaltyActive
        ? 'Protocolo de alta intensidad. Completa las repeticiones para no perder tu racha.'
        : q.cortexAdvice || guide.cortexAdvice,
    };
  };

  // Carga persistente de exactamente 5 misiones diarias
  const loadQuests = async () => {
    if (!user) return;
    const todayKey = getTodayDateKey();
    const questsKey = `@fitrise_daily_quests_${user.uid}_${todayKey}`;
    const bonusKey = `@fitrise_daily_bonus_${user.uid}_${todayKey}`;

    setLoadingQuests(true);
    try {
      // 1. Verificar si ya fue reclamado el bono de hoy
      const storedBonus = await AsyncStorage.getItem(bonusKey);
      setBonusClaimed(storedBonus === 'true');

      // 2. Verificar si ya existen las 5 misiones guardadas para hoy
      const storedQuests = await AsyncStorage.getItem(questsKey);
      if (storedQuests) {
        const parsed = JSON.parse(storedQuests);
        if (Array.isArray(parsed) && parsed.length === 5) {
          setQuests(parsed);
          setLoadingQuests(false);
          return;
        }
      }

      // 3. Si no existen para hoy, generar las 5 misiones diarias del día
      let newQuests: Quest[] = [];
      try {
        if (userContext) {
          const raw = await generateDailyQuests(userContext);
          const jsonMatch = raw.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed) && parsed.length >= 5) {
              newQuests = parsed.slice(0, 5).map((q: any, i: number) => enrichQuest(q, i));
            }
          }
        }
      } catch (err) {
        console.warn('Usando misiones base predeterminadas:', err);
      }

      // Si Gemini no generó 5 o hubo error, usar las 5 misiones base
      if (newQuests.length < 5) {
        newQuests = DEFAULT_FIVE_QUESTS.map((q, i) => enrichQuest(q, i));
      }

      setQuests(newQuests);
      await AsyncStorage.setItem(questsKey, JSON.stringify(newQuests));
    } catch (err) {
      console.error('Error cargando misiones diarias:', err);
      const fallback = DEFAULT_FIVE_QUESTS.map((q, i) => enrichQuest(q, i));
      setQuests(fallback);
    } finally {
      setLoadingQuests(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQuests();
    await refreshStreakStatus();
    setRefreshing(false);
  }, [user?.uid, refreshStreakStatus]);

  useEffect(() => {
    if (user?.uid) {
      StreakEngine.validateStreakOnAppLaunch(user.uid);
      refreshStreakStatus();
      loadQuests();
    }
  }, [user?.uid, refreshStreakStatus]);

  // Alternar estado de una misión (marcar / desmarcar) con ajuste dinámico de EXP
  const handleToggleQuest = async (questId: string) => {
    if (!user) return;
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    const isCompleting = !quest.completed;
    const todayKey = getTodayDateKey();
    const questsKey = `@fitrise_daily_quests_${user.uid}_${todayKey}`;
    const bonusKey = `@fitrise_daily_bonus_${user.uid}_${todayKey}`;

    // 1. Actualizar estado de la misión
    const updatedQuests = quests.map((q) =>
      q.id === questId ? { ...q, completed: isCompleting } : q
    );
    setQuests(updatedQuests);

    if (selectedQuest?.id === questId) {
      setSelectedQuest((prev) => (prev ? { ...prev, completed: isCompleting } : null));
    }

    // 2. Guardar en almacenamiento local
    await AsyncStorage.setItem(questsKey, JSON.stringify(updatedQuests));

    if (isCompleting) {
      // --- MARCAR COMO REALIZADA (+EXP) ---
      await addXP(quest.xpReward, quest.statBoost?.stat as any);
      await updateProfile({ questsCompleted: (user.questsCompleted || 0) + 1 });
      Haptics.success();
      SoundEffects.playChime();

      // Comprobar si se completaron las 5 misiones diarias
      const allCompleted = updatedQuests.length === 5 && updatedQuests.every((q) => q.completed);

      if (allCompleted) {
        await recordDailyQuestsCompleted(user.uid);
        await StreakEngine.recordQuestsCompleted(user.uid);
        await refreshStreakStatus();

        if (isPenaltyActive) {
          await resolvePenalty(user.uid);
        }
        SoundEffects.playLevelUp();
        if (!bonusClaimed) {
          // Otorgar Bono Extra de +300 XP
          await addXP(300, 'discipline');
          await AsyncStorage.setItem(bonusKey, 'true');
          setBonusClaimed(true);
          Haptics.triumph();
          setShowCompletionModal(true);
        }
      } else {
        await refreshStreakStatus();
      }
    } else {
      // --- DESMARCAR MISIÓN (-EXP) ---
      // Si el bono de 300 XP estaba reclamado y ya no están las 5 completas, revertirlo
      if (bonusClaimed) {
        await addXP(-300, 'discipline');
        await AsyncStorage.setItem(bonusKey, 'false');
        setBonusClaimed(false);
      }

      // Descontar la EXP de la misión y el contador de misiones
      await addXP(-quest.xpReward, quest.statBoost?.stat as any);
      await updateProfile({ questsCompleted: Math.max(0, (user.questsCompleted || 1) - 1) });
      Haptics.light();
      await refreshStreakStatus();
    }
  };

  const handleCompleteQuest = handleToggleQuest;

  const handleStartAdaptedWorkout = () => {
    if (!adaptiveWorkout) return;
    const circuitData: CustomCircuitData = {
      title: adaptiveWorkout.title,
      subtitle: adaptiveWorkout.subtitle,
      duration: adaptiveWorkout.estimatedMinutes,
      xpReward: adaptiveWorkout.xpReward,
      emoji: '⌚',
      circuit: adaptiveWorkout.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        targetCount: ex.targetCount,
        repsLabel: ex.reps,
        imageKey: ex.imageKey,
        muscles: ex.muscles,
        sets: ex.sets,
        restTimeSeconds: 20,
        xpReward: Math.round(adaptiveWorkout.xpReward / adaptiveWorkout.exercises.length),
      })),
    };
    setSmartwatchCircuitData(circuitData);
    setShowAdaptedCircuitModal(true);
  };

  const handleCompleteAdaptedCircuit = async (_dayNumber: number, xpReward: number) => {
    setShowAdaptedCircuitModal(false);
    if (xpReward > 0 && user?.uid) {
      await addXP(xpReward, 'vitality');
      await StreakEngine.recordRoutineCompleted(
        user.uid,
        adaptiveWorkout?.title || 'Circuito Bio-Nexo Adaptativo',
        xpReward
      );
      await refreshStreakStatus();
      SoundEffects.playLevelUp();
      Haptics.triumph();
    }
  };

  const currentActivePlan = getActivePlan();
  const nextPendingPlanDay = currentActivePlan
    ? currentActivePlan.daysSchedule.find((d) => !completedDayNumbers.includes(d.dayNumber)) ||
      currentActivePlan.daysSchedule[0]
    : null;
  const activeDayNumber = nextPendingPlanDay?.dayNumber || 1;

  if (!user || !user.goals || user.goals.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Buenos días' : hours < 18 ? 'Buenas tardes' : 'Buenas noches';
  const completedCount = quests.filter((q) => q.completed).length;
  const allQuestsCompleted = quests.length === 5 && completedCount === 5;
  const waterProgress = targetMl > 0 ? Math.min(100, Math.round((currentMl / targetMl) * 100)) : 0;
  const watchSteps = watchMetrics?.steps || 0;
  const watchStepGoal = watchMetrics?.stepGoal || 10000;
  const watchStepProgress = Math.min(100, Math.round((watchSteps / watchStepGoal) * 100));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brand.primary}
          />
        }
      >
        {/* Header Superior del Sistema Solo Leveling */}
        <View style={styles.systemHeader}>
          <View style={styles.systemBadgeRow}>
            <Animated.View style={[styles.systemLiveDot, { transform: [{ scale: liveScale }] }]} />
            <Text style={styles.systemBadgeTag}>[ SISTEMA: ESTADO DEL CAZADOR ]</Text>
            <Text style={styles.systemBadgeSub}>CORTEX V1.0</Text>
          </View>

          {/* Acciones Rápidas del Cazador: Cofre Diario y Audio Mute */}
          <View style={styles.systemHeaderActions}>
            <TouchableOpacity
              style={[
                styles.systemChestBtn,
                isDailyChestClaimedToday && styles.systemChestBtnClaimed,
              ]}
              onPress={() => {
                Haptics.light();
                setShowDailyChestModal(true);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.systemChestBtnEmoji}>
                {isDailyChestClaimedToday ? '💎' : '🎁'}
              </Text>
              <Text style={styles.systemChestBtnText}>
                {isDailyChestClaimedToday ? 'Reclamado' : 'Cofre'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.systemAudioToggleBtn}
              onPress={async () => {
                const next = await SoundEffects.toggleEnabled();
                setIsSoundMuted(!next);
                Haptics.light();
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isSoundMuted ? 'volume-mute' : 'volume-high'}
                size={15}
                color={isSoundMuted ? '#64748B' : '#00F0FF'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. HERO CARD DEL CAZADOR */}
        <Animated.View style={[styles.heroCard, { borderColor: borderPulse }]}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              style={styles.heroProfileRow}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
            >
              <View style={styles.avatarWrapper}>
                {renderAvatarContent(user.avatar, user.name, 60)}
                <View style={styles.avatarLevelBadge}>
                  <Text style={styles.avatarLevelText}>{user.level}</Text>
                </View>
              </View>

              <View style={styles.heroUserTexts}>
                <Text style={styles.greetingText}>{greeting},</Text>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {user.name} ⚡
                </Text>
                {currentTitle && (
                  <View style={[styles.hunterTitlePill, { borderColor: currentTitle.color + '55' }]}>
                    <Text style={styles.hunterTitleEmoji}>{currentTitle.badgeEmoji}</Text>
                    <Text style={[styles.hunterTitleLabel, { color: currentTitle.color }]}>
                      {currentTitle.name}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.heroBadgesCol}>
              <View style={styles.streakBadge}>
                <Text style={styles.streakIcon}>🔥</Text>
                <Text style={styles.streakCount}>{user.streak}</Text>
                <Text style={styles.streakUnit}>días</Text>
              </View>
              {rank && <RankBadge rankKey={rank.key} size="sm" showLabel={false} />}
            </View>
          </View>

          {/* Barra de Progreso XP Responsiva */}
          {xpInfo && (
            <View style={styles.xpSection}>
              <View style={styles.xpHeaderRow}>
                <Text style={styles.xpRankLabel}>{rank?.name} • Nivel {user.level}</Text>
                <Text style={styles.xpPointsValue}>
                  {xpInfo.current} / {xpInfo.required} XP ({Math.round(xpInfo.progress)}%)
                </Text>
              </View>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${xpInfo.progress}%` }]} />
              </View>
            </View>
          )}
        </Animated.View>

        {/* 2. ZONA DE CASTIGO (Solo si está activa) */}
        {isPenaltyActive && (
          <View style={styles.penaltyBanner}>
            <View style={styles.penaltyHeaderRow}>
              <View style={styles.penaltySirenPill}>
                <Ionicons name="warning" size={13} color="#EF4444" />
                <Text style={styles.penaltySirenText}>ZONA DE CASTIGO</Text>
              </View>
              <Text style={styles.penaltyMultiplierText}>RECOMPENSA x1.5</Text>
            </View>
            <Text style={styles.penaltyDesc}>
              Directivas previas omitidas. Misiones intensificadas temporalmente para salvar tu racha.
            </Text>
          </View>
        )}

        {/* 3. DIRECTIVA TÁCTICA CORTEX (INFORMACIÓN COMPLETA Y VISIBLE) */}
        <View style={styles.cortexCard}>
          <View style={styles.cortexCardHeader}>
            <View style={styles.cortexIconCircle}>
              <Ionicons name="hardware-chip-outline" size={20} color="#00F0FF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.cortexTitleRow}>
                <Text style={styles.cortexName}>[ ENLACE NEURAL CORTEX ]</Text>
                <View style={styles.cortexBadge}>
                  <Animated.View style={[styles.cortexLiveDot, { transform: [{ scale: liveScale }] }]} />
                  <Text style={styles.cortexBadgeText}>EN LÍNEA</Text>
                </View>
              </View>
              <Text style={styles.cortexSubtitle}>Directiva Táctica de Inteligencia Artificial</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/tutor')}
              style={styles.cortexChatBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubbles-outline" size={15} color="#00F0FF" />
              <Text style={styles.cortexChatBtnText}>Tutor</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cortexQuoteBox}>
            <Ionicons name="terminal-outline" size={16} color="rgba(0, 240, 255, 0.5)" style={{ marginBottom: 4 }} />
            <Text style={styles.cortexQuoteText}>
              {cortexTip}
            </Text>
          </View>
        </View>

        {/* 4. TELEMETRÍA TÁCTICA: HIDRATACIÓN Y BIO-NEXO */}
        <View style={styles.telemetryGrid}>
          {/* Card Hidratación */}
          <TouchableOpacity
            style={styles.telemetryCard}
            onPress={() => {
              if (user?.uid) {
                SoundEffects.playWaterDrop();
                drinkCup(user.uid);
              }
            }}
            onLongPress={() => {
              if (user?.uid && cupsDrank > 0) {
                Haptics.warning();
                undoCup(user.uid);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.telemetryCardTop}>
              <View style={styles.telemetryIconContainerWater}>
                <Ionicons name="water" size={18} color="#00F0FF" />
              </View>
              <View style={styles.telemetryTagWater}>
                <Text style={styles.telemetryTagWaterText}>{waterProgress}%</Text>
              </View>
            </View>

            <Text style={styles.telemetryCardLabel}>[ HIDRATACIÓN ]</Text>

            <View style={styles.telemetryMetricRow}>
              <Text style={styles.telemetryPrimaryValue}>{currentMl.toLocaleString()}</Text>
              <Text style={styles.telemetrySecondaryValue}> / {targetMl.toLocaleString()} ml</Text>
            </View>

            <View style={styles.telemetryProgressBarTrack}>
              <View style={[styles.telemetryProgressBarFillWater, { width: `${waterProgress}%` }]} />
            </View>

            {/* Chips de Registro Rápido: Vaso 250ml / Botella 500ml */}
            <View style={styles.hydrationChipsRow}>
              <TouchableOpacity
                style={styles.hydrationChipBtn}
                onPress={() => {
                  if (user?.uid) {
                    SoundEffects.playWaterDrop();
                    drinkCup(user.uid);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="water-outline" size={12} color="#00F0FF" />
                <Text style={styles.hydrationChipText}>+250 ml</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hydrationChipBtn}
                onPress={() => {
                  if (user?.uid) {
                    SoundEffects.playWaterDrop();
                    drinkCups(user.uid, 2);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="flask-outline" size={12} color="#00F0FF" />
                <Text style={styles.hydrationChipText}>+500 ml</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Card Bio-Nexo (Smartwatch) */}
          <TouchableOpacity
            style={styles.telemetryCard}
            onPress={() => setShowSmartwatchModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.telemetryCardTop}>
              <View style={styles.telemetryIconContainerWatch}>
                <Ionicons name="watch-outline" size={18} color="#10B981" />
              </View>
              <View style={[styles.watchStatusPill, isWatchConnected && styles.watchStatusPillActive]}>
                <View style={[styles.watchStatusDot, isWatchConnected && styles.watchStatusDotActive]} />
                <Text style={[styles.watchStatusText, isWatchConnected && styles.watchStatusTextActive]}>
                  {isWatchConnected ? 'ONLINE' : 'LINK'}
                </Text>
              </View>
            </View>

            <Text style={styles.telemetryCardLabel}>[ BIO-NEXO SMARTWATCH ]</Text>

            {isWatchConnected ? (
              <>
                <View style={styles.telemetryMetricRow}>
                  <Text style={styles.telemetryPrimaryValue}>{watchSteps.toLocaleString()}</Text>
                  <Text style={styles.telemetrySecondaryValue}> pasos</Text>
                </View>
                <View style={styles.telemetryProgressBarTrack}>
                  <View style={[styles.telemetryProgressBarFillWatch, { width: `${watchStepProgress}%` }]} />
                </View>
                <View style={styles.telemetryActionBtn}>
                  <Ionicons name="heart" size={14} color="#EF4444" />
                  <Text style={styles.telemetryActionBtnText}>
                    {watchMetrics.currentHeartRate} BPM • {watchMetrics.activeCalories} kcal
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.telemetryMetricRow}>
                  <Text style={styles.telemetryPrimaryValue}>Desconectado</Text>
                </View>
                <View style={styles.telemetryProgressBarTrack}>
                  <View style={[styles.telemetryProgressBarFillWatch, { width: '0%' }]} />
                </View>
                <View style={styles.telemetryActionBtn}>
                  <Ionicons name="bluetooth" size={15} color="#10B981" />
                  <Text style={[styles.telemetryActionBtnText, { color: '#10B981' }]}>Vincular reloj</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* DIRECTIVA TÁCTICA DEL DÍA: ACCESO DIRECTO 1-TAP AL ENTRENAMIENTO */}
        <TodayWorkoutCard
          activePlan={currentActivePlan || null}
          activePlanDay={activeDayNumber}
          isCompletedToday={streakStatus?.isRoutineCompleted ?? false}
          completedTitle={streakStatus?.completedRoutineTitle}
          onStartTodayWorkout={() => setShowTodayPlanModal(true)}
          onExplorePlans={() => router.push('/(tabs)/workouts')}
        />

        {/* 5. PACTO DE RACHA: ESTADO RIGUROSO (MISIONES + RUTINA) */}
        <StreakStatusCard
          streak={user.streak}
          questsCompletedCount={completedCount}
          totalQuests={5}
          areQuestsCompleted={allQuestsCompleted}
          isRoutineCompleted={streakStatus?.isRoutineCompleted ?? false}
          routineTitle={streakStatus?.completedRoutineTitle}
          isPenaltyActive={isPenaltyActive}
          shieldsCount={streakStatus?.shieldsAvailable}
          onPressQuests={() => {}}
          onPressRoutine={() => {
            if (currentActivePlan) {
              setShowTodayPlanModal(true);
            } else {
              router.push('/(tabs)/workouts');
            }
          }}
        />

        {/* Banner de Aviso: Plan Conquistado al 100% */}
        {isCurrentPlanCompleted() && (
          <TouchableOpacity
            style={styles.completedPlanNotice}
            onPress={() => router.push('/(tabs)/workouts')}
            activeOpacity={0.8}
          >
            <View style={styles.completedPlanNoticeIcon}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.completedPlanNoticeTitle}>¡PROGRAMA ACTUAL CONQUISTADO! 🏆</Text>
              <Text style={styles.completedPlanNoticeSubtitle}>
                Has finalizado "{getActivePlan()?.title}". Toca para seleccionar tu nuevo programa en Entrenamiento.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* 6. PROTOCOLO DE MISIONES DIARIAS */}
        <Animated.View style={[styles.questsCard, { borderColor: borderPulse }]}>
          <View style={styles.questsHeader}>
            <View style={styles.questsTitleWrapper}>
              <View style={styles.questsTitleIconBox}>
                <Ionicons name="shield-checkmark" size={18} color="#00F0FF" />
              </View>
              <Text style={styles.questsTitle}>[ DIRECTIVAS DE MISIÓN DIARIA ]</Text>
              <View
                style={[
                  styles.questProgressBadge,
                  allQuestsCompleted && styles.questProgressBadgeComplete,
                ]}
              >
                <Text
                  style={[
                    styles.questProgressText,
                    allQuestsCompleted && styles.questProgressTextComplete,
                  ]}
                >
                  {completedCount}/5
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => allQuestsCompleted && setShowCompletionModal(true)}
              disabled={!allQuestsCompleted}
              activeOpacity={0.7}
              style={[
                styles.bonusBadge,
                allQuestsCompleted && styles.bonusBadgeClaimed,
              ]}
            >
              <Text
                style={[
                  styles.bonusBadgeText,
                  allQuestsCompleted && styles.bonusBadgeTextClaimed,
                ]}
              >
                {allQuestsCompleted ? '👑 +300 XP Reclamado' : '⚡ +300 XP Bonus'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5 Segmentos de Progreso Visual */}
          <View style={styles.segmentedProgressBar}>
            {quests.map((q, idx) => (
              <View
                key={idx}
                style={[
                  styles.progressSegment,
                  q.completed && styles.progressSegmentDone,
                ]}
              />
            ))}
          </View>

          {/* Lista de Misiones */}
          {loadingQuests ? (
            <View style={styles.questsLoadingBox}>
              <ActivityIndicator color="#00F0FF" size="small" />
              <Text style={styles.questsLoadingText}>Sincronizando directivas con CORTEX...</Text>
            </View>
          ) : (
            <View style={styles.questsList}>
              {quests.map((quest) => {
                const displayTitle = quest.title.replace(/^Misión \d+:\s*/, '');
                return (
                  <TouchableOpacity
                    key={quest.id}
                    style={[
                      styles.questItem,
                      quest.completed && styles.questItemDone,
                    ]}
                    onPress={() => handleToggleQuest(quest.id)}
                    onLongPress={() => setSelectedQuest(quest)}
                    activeOpacity={0.75}
                  >
                    {/* Botón Indicador de Check (Toque Rápido para Alternar) */}
                    <View
                      style={[
                        styles.questCheckButton,
                        quest.completed && styles.questCheckButtonDone,
                      ]}
                    >
                      {quest.completed ? (
                        <Ionicons name="checkmark" size={18} color="#0A0A0F" />
                      ) : (
                        <View style={styles.questCheckInnerRing} />
                      )}
                    </View>

                    {/* Emoji Táctico de la Misión */}
                    <View style={styles.questIconBox}>
                      <Text style={styles.questIconEmoji}>{quest.icon}</Text>
                    </View>

                    {/* Directiva y Repeticiones */}
                    <View style={styles.questTexts}>
                      <Text
                        style={[
                          styles.questTitleText,
                          quest.completed && styles.questTitleTextDone,
                        ]}
                        numberOfLines={1}
                      >
                        {displayTitle}
                      </Text>
                      <Text style={styles.questSubtitleText} numberOfLines={1}>
                        {quest.sets ? `${quest.sets} series • ` : ''}
                        {quest.reps || ''}
                      </Text>
                    </View>

                    {/* Píldora de Recompensa de EXP */}
                    <View
                      style={[
                        styles.questRewardPill,
                        quest.completed && styles.questRewardPillDone,
                      ]}
                    >
                      <Text
                        style={[
                          styles.questRewardPillText,
                          quest.completed && styles.questRewardPillTextDone,
                        ]}
                      >
                        {quest.completed ? `✓ +${quest.xpReward} XP` : `+${quest.xpReward} XP`}
                      </Text>
                    </View>

                    {/* Botón Táctico para Abrir Guía 3D y Entrenador */}
                    <TouchableOpacity
                      style={styles.questInfoBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setSelectedQuest(quest);
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                      activeOpacity={0.65}
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={20}
                        color={quest.completed ? '#64748B' : '#00F0FF'}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Ventana Táctica de Misión Diaria */}
      {selectedQuest && (
        <QuestDetailModal
          quest={selectedQuest}
          visible={!!selectedQuest}
          onClose={() => setSelectedQuest(null)}
          onComplete={handleCompleteQuest}
        />
      )}

      {/* Modal de Felicitación al Completar las 5 Misiones */}
      <DailyCompletionModal
        visible={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        bonusXP={300}
        isRoutineCompleted={streakStatus?.isRoutineCompleted ?? false}
      />

      {/* Modal de Calibración de Peso Semanal */}
      <WeeklyWeightModal
        visible={showWeeklyWeightModal}
        onClose={() => setShowWeeklyWeightModal(false)}
      />

      {/* Modal de Gestión y Sincronización Smartwatch */}
      <SmartwatchSyncModal
        visible={showSmartwatchModal}
        onClose={() => setShowSmartwatchModal(false)}
        onStartAdaptedWorkout={handleStartAdaptedWorkout}
      />

      {/* Modal de Circuito Adaptado por Smartwatch */}
      <PlanCircuitModal
        visible={showAdaptedCircuitModal}
        customCircuit={smartwatchCircuitData}
        autoStart={false}
        onClose={() => setShowAdaptedCircuitModal(false)}
        onCompleteDay={handleCompleteAdaptedCircuit}
      />

      {/* Modal de Circuito de Entrenamiento Diario (Lanzador Directo desde Home) */}
      <PlanCircuitModal
        visible={showTodayPlanModal}
        plan={currentActivePlan || null}
        dayNumber={activeDayNumber}
        autoStart={false}
        onClose={() => setShowTodayPlanModal(false)}
        onCompleteDay={async (dayNum, xpReward) => {
          setShowTodayPlanModal(false);
          if (currentActivePlan) {
            await completePlanDay(dayNum);
            if (user?.uid) {
              const dayObj = currentActivePlan.daysSchedule.find((d) => d.dayNumber === dayNum);
              const routineTitle = dayObj ? `${currentActivePlan.title} - Día ${dayNum}` : currentActivePlan.title;
              await StreakEngine.recordRoutineCompleted(user.uid, routineTitle, xpReward);
              await refreshStreakStatus();
            }
          }
        }}
      />

      {/* Modal de Suministros Diarios del Sistema Solo Leveling */}
      <DailyRewardChestModal
        visible={showDailyChestModal}
        onClose={() => setShowDailyChestModal(false)}
        onClaimed={async () => {
          setIsDailyChestClaimedToday(true);
          await refreshStreakStatus();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
    gap: 16,
  },

  // Header del Sistema Solo Leveling
  systemHeader: {
    marginBottom: -4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  systemHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  systemChestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F121E',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  systemChestBtnClaimed: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  systemChestBtnEmoji: {
    fontSize: 12,
  },
  systemChestBtnText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  systemAudioToggleBtn: {
    backgroundColor: '#0F121E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Radius.full,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hydrationChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  hydrationChipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: Radius.sm,
    paddingVertical: 4,
  },
  hydrationChipText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
  },
  systemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F121E',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  systemLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00F0FF',
  },
  systemBadgeTag: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  systemBadgeSub: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },

  // 1. HERO HUD DEL CAZADOR
  heroCard: {
    backgroundColor: '#0F121E',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarLevelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#00F0FF',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#0A0A0F',
  },
  avatarLevelText: {
    color: '#0A0A0F',
    fontSize: 11,
    fontWeight: '900',
  },
  heroUserTexts: {
    flex: 1,
    gap: 3,
  },
  greetingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  userNameText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  hunterTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  hunterTitleEmoji: {
    fontSize: 12,
  },
  hunterTitleLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroBadgesCol: {
    alignItems: 'flex-end',
    gap: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  streakIcon: { fontSize: 16 },
  streakCount: { color: '#EF4444', fontSize: 15, fontWeight: 'bold' },
  streakUnit: { color: '#94A3B8', fontSize: 11 },

  // Barra XP
  xpSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 8,
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpRankLabel: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '700',
  },
  xpPointsValue: {
    color: '#00F0FF',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  xpTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 4,
  },

  // 2. PENALTY BANNER
  penaltyBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    gap: 8,
  },
  penaltyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  penaltySirenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  penaltySirenText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  penaltyMultiplierText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  penaltyDesc: {
    color: '#E2E8F0',
    fontSize: 12.5,
    lineHeight: 18,
  },

  // AVISO DE PLAN CONQUISTADO
  completedPlanNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: Spacing.md,
    gap: 12,
    marginBottom: Spacing.md,
  },
  completedPlanNoticeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedPlanNoticeTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  completedPlanNoticeSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },

  // 3. CORTEX PROTOCOLO TÁCTICO (EXPANDIDO Y COMPLETO)
  cortexCard: {
    backgroundColor: '#0F121E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    gap: 12,
  },
  cortexCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cortexIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cortexTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cortexName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  cortexBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.16)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  cortexLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F0FF',
  },
  cortexBadgeText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cortexSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  cortexChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  cortexChatBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
  },
  cortexQuoteBox: {
    backgroundColor: 'rgba(0, 240, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#00F0FF',
    gap: 4,
  },
  cortexQuoteText: {
    color: '#F1F5F9',
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '500',
  },

  // 4. TELEMETRÍA TÁCTICA: HIDRATACIÓN + SMARTWATCH
  telemetryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: '#0F121E',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 7,
  },
  telemetryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryIconContainerWater: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryIconContainerWatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryTagWater: {
    backgroundColor: 'rgba(0, 240, 255, 0.16)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  telemetryTagWaterText: {
    color: '#00F0FF',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  watchStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.18)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  watchStatusPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  watchStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  watchStatusDotActive: {
    backgroundColor: '#10B981',
  },
  watchStatusText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  watchStatusTextActive: {
    color: '#10B981',
  },
  telemetryCardLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  telemetryMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  telemetryPrimaryValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  telemetrySecondaryValue: {
    color: '#94A3B8',
    fontSize: 12,
  },
  telemetryProgressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 3,
  },
  telemetryProgressBarFillWater: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 3,
  },
  telemetryProgressBarFillWatch: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  telemetryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 2,
  },
  telemetryActionBtnText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '600',
  },

  // 5. PROTOCOLO DE MISIONES DIARIAS
  questsCard: {
    backgroundColor: '#0F121E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  questsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questsTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questsTitleIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questsTitle: {
    color: '#F8FAFC',
    fontSize: 15.5,
    fontWeight: 'bold',
  },
  questProgressBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  questProgressBadgeComplete: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  questProgressText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  questProgressTextComplete: {
    color: '#F59E0B',
  },
  bonusBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  bonusBadgeClaimed: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  bonusBadgeText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bonusBadgeTextClaimed: {
    color: '#F59E0B',
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    gap: 4,
    height: 5,
    marginVertical: 2,
  },
  progressSegment: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2.5,
  },
  progressSegmentDone: {
    backgroundColor: '#10B981',
  },
  questsLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  questsLoadingText: {
    color: '#64748B',
    fontSize: 12,
  },
  questsList: {
    gap: 8,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  questItemDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  questCheckButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questCheckButtonDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  questCheckInnerRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.5)',
  },
  questContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questIconEmoji: {
    fontSize: 18,
  },
  questTexts: {
    flex: 1,
  },
  questTitleText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  questTitleTextDone: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  questSubtitleText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  questRewardPill: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  questRewardPillDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  questRewardPillText: {
    color: '#00F0FF',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  questRewardPillTextDone: {
    color: '#10B981',
  },
  questInfoBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
