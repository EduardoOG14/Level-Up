import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Animated,
  Modal,
} from 'react-native';
import { SafeScreen } from '../../components/ui/SafeScreen';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../../stores/userStore';
import { usePlanStore } from '../../stores/planStore';
import { generateWorkoutPlan } from '../../services/gemini';
import { Card } from '../../components/ui/Card';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { TRAINING_PLANS, type PlanType, type TrainingPlan } from '../../constants/plans';
import { PlanAlarmModal } from '../../components/plans/PlanAlarmModal';
import { PlanCircuitModal, type CustomCircuitData } from '../../components/plans/PlanCircuitModal';
import { PlanCompletedModal } from '../../components/plans/PlanCompletedModal';
import { RestAdvisoryModal } from '../../components/plans/RestAdvisoryModal';
import { StreakEngine, getLocalDateKey } from '../../services/streakEngine';
import {
  resolveExerciseGuide,
  validateAndAdaptCircuit,
  adaptCircuitForUser,
} from '../../constants/exercises';
import { ExerciseMedia } from '../../components/ui/ExerciseMedia';
import type { Quest } from '../../components/gamification/QuestCard';
import { type CircuitExercise, getPlanDayCircuit } from '../../constants/plans';
import {
  CortexDirective,
  type CortexDirectiveResult,
  type RecalibrationFocus,
} from '../../services/cortexDirectiveService';
import {
  getCurrentWeeklyBoss,
  isBossRaidAvailable,
  getBossCountdown,
  getCurrentWeekKey,
  WEEKLY_BOSSES,
  type BossCountdown,
} from '../../constants/bosses';
import { useBossStore } from '../../stores/bossStore';
import { useAchievementStore } from '../../stores/achievementStore';
import { Haptics } from '../../services/haptics';
import { SoundEffects } from '../../services/soundEffects';
import { RecoveryModal } from '../../components/recovery/RecoveryModal';
import { useSmartwatchStore } from '../../stores/smartwatchStore';
import { SMARTWATCH_BRANDS } from '../../constants/smartwatch';
import { useCortexEnergyStore } from '../../stores/cortexEnergyStore';
import { CortexKeyModal } from '../../components/ai/CortexKeyModal';
import { useShadowArmyStore } from '../../stores/shadowArmyStore';
import { ShadowArmyModal } from '../../components/workout/ShadowArmyModal';
import { RaidClearShareModal } from '../../components/workout/RaidClearShareModal';
import type { UserContext } from '../../services/gemini';

const WORKOUT_TYPES = [
  { id: 'full', label: 'Full Body', icon: 'barbell-outline', duration: 30, focus: 'Cuerpo Completo' },
  { id: 'upper', label: 'Tren Superior', icon: 'shield-outline', duration: 25, focus: 'Pecho, Espalda y Brazos' },
  { id: 'lower', label: 'Pierna & Glúteos', icon: 'walk-outline', duration: 25, focus: 'Cuádriceps y Cadera' },
  { id: 'cardio', label: 'Cardio Hunter', icon: 'flash-outline', duration: 20, focus: 'HIIT Metabólico' },
  { id: 'core', label: 'Fuerza de Core', icon: 'locate-outline', duration: 15, focus: 'Abdomen y Transverso' },
  { id: 'flexibility', label: 'Movilidad & Yoga', icon: 'body-outline', duration: 20, focus: 'Flexibilidad y Descanso' },
];

const RECALIBRATION_OPTIONS: { id: RecalibrationFocus; label: string; desc: string; icon: any; emoji: string }[] = [
  { id: 'push', label: 'Sobrecarga de Empuje', desc: 'Pectorales, Deltoides Anterior y Tríceps', icon: 'shield-outline', emoji: '🛡️' },
  { id: 'pull', label: 'Tracción & Espalda', desc: 'Dorsales, Romboides y Bíceps', icon: 'barbell-outline', emoji: '🦅' },
  { id: 'legs', label: 'Cimientos & Piernas', desc: 'Cuádriceps, Glúteos y Gemelos', icon: 'walk-outline', emoji: '🦵' },
  { id: 'core', label: 'Blindaje Central', desc: 'Abdomen 360°, Transverso y Oblicuos', icon: 'locate-outline', emoji: '🛡️' },
  { id: 'fullbody', label: 'Combate Full Body', desc: 'Estímulo global multiarticular', icon: 'flash-outline', emoji: '⚔️' },
  { id: 'hiit', label: 'Incinerador Metabólico', desc: 'HIIT de alta cadencia y quema grasa', icon: 'flame-outline', emoji: '🔥' },
  { id: 'calisthenics', label: 'Calistenia Pura', desc: 'Dominio de peso corporal sin equipamiento', icon: 'fitness-outline', emoji: '🤸' },
  { id: 'express', label: 'Incursión Exprés (15 min)', desc: 'Máxima densidad en tiempo reducido', icon: 'time-outline', emoji: '⏱️' },
  { id: 'joint_safe', label: 'Regeneración & Cero Impacto', desc: 'Articulaciones seguras y descompresión', icon: 'body-outline', emoji: '🧘' },
  { id: 'auto', label: 'Restablecer a Cálculo CORTEX', desc: 'El Sistema decide según el día de la semana', icon: 'hardware-chip-outline', emoji: '🤖' },
];

export default function WorkoutsScreen() {
  const { user, addXP } = useUserStore();
  const { unlockAchievement } = useAchievementStore();
  const {
    defeatedBossIds,
    getActiveBoss,
    isBossDefeated,
    isAllBossesDefeated,
    recordBossDefeat,
    initialize: initBossStore,
    resetBossProgress,
  } = useBossStore();

  useEffect(() => {
    if (user?.uid) {
      initBossStore(user.uid);
    }
  }, [user?.uid, initBossStore]);

  const currentBoss = getActiveBoss();
  const isBossDefeatedThisWeek = isBossDefeated(currentBoss.id);
  const bossStepNumber = Math.min(
    WEEKLY_BOSSES.length,
    WEEKLY_BOSSES.findIndex((b) => b.id === currentBoss.id) + 1
  );
  const {
    activePlanId,
    completedDayNumbers,
    setActivePlan,
    completePlanDay,
    alarmSettings,
    getActivePlan,
    isCurrentPlanCompleted,
    getRecommendedNextPlan,
    resetCurrentPlanProgress,
  } = usePlanStore();

  const mainScrollRef = useRef<any>(null);
  const [showPlanCompletedModal, setShowPlanCompletedModal] = useState(false);
  const [completedModalPlan, setCompletedModalPlan] = useState<TrainingPlan | null>(null);
  const [showRestAdvisoryModal, setShowRestAdvisoryModal] = useState(false);
  const [pendingRestDayNumber, setPendingRestDayNumber] = useState<number>(1);
  const [pendingRestPlan, setPendingRestPlan] = useState<TrainingPlan | null>(null);

  const [activeTab, setActiveTab] = useState<'plans' | 'custom'>('plans');
  const [selectedPlanCategory, setSelectedPlanCategory] = useState<PlanType | 'all'>('all');
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const [showCircuitModal, setShowCircuitModal] = useState(false);
  const [circuitDayNumber, setCircuitDayNumber] = useState(1);

  // Directivas de CORTEX & Recalibración
  const [cortexDirectives, setCortexDirectives] = useState<CortexDirectiveResult | null>(null);
  const [showRecalibrateModal, setShowRecalibrateModal] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    CortexDirective.getCortexDirectives(user).then((res) => {
      if (isMounted) {
        setCortexDirectives(res);
        const current = getActivePlan();
        if ((!current || current.type === 'daily') && res.dailyPlan && activePlanId !== res.dailyPlan.id) {
          setActivePlan(res.dailyPlan.id);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Custom AI Dungeon state
  const [selectedType, setSelectedType] = useState<string | null>('full');
  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState<any>(null);
  const [dungeonCircuit, setDungeonCircuit] = useState<CustomCircuitData | null>(null);
  const [showDungeonModal, setShowDungeonModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [bossCountdown, setBossCountdown] = useState<BossCountdown>(getBossCountdown());
  const currentWeekKey = getCurrentWeekKey();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showShadowArmyModal, setShowShadowArmyModal] = useState(false);
  const [showBossVictoryShareModal, setShowBossVictoryShareModal] = useState(false);
  const [lastDefeatedBossInfo, setLastDefeatedBossInfo] = useState<any>(null);
  const { soldiers, initialize: initShadowArmy, extractShadow } = useShadowArmyStore();
  const { dailyManaRemaining, isUnlimited, initialize: initEnergy } = useCortexEnergyStore();

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initEnergy();
    if (user?.uid) {
      initShadowArmy(user.uid);
    }
  }, [initEnergy, initShadowArmy, user?.uid]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const {
    brand: watchBrand,
    isConnected: isWatchConnected,
    metrics: watchMetrics,
    adaptiveWorkout,
  } = useSmartwatchStore();
  const watchBrandConfig = watchBrand ? SMARTWATCH_BRANDS[watchBrand] : null;

  const handleLaunchSmartwatchCircuit = () => {
    if (!adaptiveWorkout) return;
    const customData: CustomCircuitData = {
      title: adaptiveWorkout.title,
      subtitle: adaptiveWorkout.subtitle,
      duration: adaptiveWorkout.estimatedMinutes,
      xpReward: adaptiveWorkout.xpReward,
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
      emoji: '⌚',
    };
    setDungeonCircuit(customData);
    setShowDungeonModal(true);
    Haptics.medium();
  };

  useEffect(() => {
    usePlanStore.getState().initialize();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setBossCountdown(getBossCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activePlan = getActivePlan();

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
      }
    : null;

  const generateWorkout = async () => {
    if (!selectedType || !userContext) return;
    const type = WORKOUT_TYPES.find((t) => t.id === selectedType);
    if (!type) return;

    setLoading(true);
    setWorkout(null);
    setDungeonCircuit(null);
    try {
      const raw = await generateWorkoutPlan(userContext, type.duration, type.label);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        const rawMain = parsed.main || [];
        const rawCircuitExercises: CircuitExercise[] = rawMain.map((ex: any) => {
          const guide = resolveExerciseGuide(ex.exercise || '');
          const repMatch = String(ex.reps || '').match(/\d+/);
          const targetCount = repMatch ? parseInt(repMatch[0], 10) : guide.targetCount;

          return {
            id: guide.imageKey,
            name: ex.exercise || guide.name,
            targetCount: Math.min(Math.max(targetCount, 6), 25),
            repsLabel: `${targetCount} reps lentas`,
            imageKey: guide.imageKey,
            muscles: guide.muscles,
            sets: ex.sets || 3,
            restTimeSeconds: 20, // 20s como solicitado
            xpReward: ex.xp || 30,
          };
        });

        const userProfile = {
          fitnessLevel: user?.fitnessLevel || 'beginner',
          level: user?.level || 1,
          equipment: user?.equipment || ['none'],
          weight: user?.weight,
          height: user?.height,
          kneeFriendly: user?.kneeFriendly,
        };
        const validatedCircuit = adaptCircuitForUser(
          rawCircuitExercises.length > 0
            ? rawCircuitExercises
            : getPlanDayCircuit(TRAINING_PLANS[0], 1, userProfile),
          userProfile
        );

        // Sincronizar la vista de estaciones de la pantalla con los ejercicios adaptados
        parsed.main = validatedCircuit.map((c) => ({
          exercise: c.name,
          sets: c.sets,
          reps: c.repsLabel,
          xp: c.xpReward,
        }));
        setWorkout(parsed);

        const customData: CustomCircuitData = {
          title: parsed.title || `Mazmorra: ${type.label}`,
          subtitle: type.focus,
          duration: type.duration,
          xpReward: parsed.totalXP || 150,
          circuit: validatedCircuit,
          emoji: '⚡',
        };

        setDungeonCircuit(customData);
        // Abrir y ejecutar de inmediato el circuito al ser generado
        setShowDungeonModal(true);
      } else {
        Alert.alert('Aviso', 'CORTEX no devolvió un formato válido. Reintenta.');
      }
    } catch (err: any) {
      if (err?.message === 'MANA_DEPLETED') {
        Alert.alert(
          '⚡ Maná Neural Agotado',
          'Has utilizado tus 5 consultas diarias gratuitas de CORTEX. ¿Deseas vincular tu propia clave gratuita de Google Gemini para invocar mazmorras sin límite diario?',
          [
            { text: 'Más tarde', style: 'cancel' },
            { text: '👑 Activar Ilimitado', onPress: () => setShowKeyModal(true) },
          ]
        );
      } else if (err?.message === 'INVALID_PERSONAL_KEY') {
        Alert.alert(
          '⚠️ Clave Inválida',
          'Tu clave personal de Gemini no fue aceptada o ha expirado. Revísala en el gestor de claves CORTEX.',
          [
            { text: 'Cerrar', style: 'cancel' },
            { text: 'Gestionar Clave', onPress: () => setShowKeyModal(true) },
          ]
        );
      } else {
        Alert.alert('Error', 'No se pudo conectar con CORTEX para generar la rutina.');
      }
    } finally {
      setLoading(false);
    }
  };

  const completeCustomWorkout = async () => {
    if (!workout) return;
    const xp = workout.totalXP || 150;
    await addXP(xp, 'strength');
    Alert.alert('¡Mazmorra Conquistada! 🏆', `Has obtenido +${xp} XP del Sistema CORTEX.`, [
      {
        text: '¡Excelente!',
        onPress: () => {
          setWorkout(null);
          setDungeonCircuit(null);
        },
      },
    ]);
  };

  const handleCompleteDungeonCircuit = async (_: number, xpReward: number) => {
    await addXP(xpReward, 'strength');
    const isBossRaid = dungeonCircuit?.title.includes('Asalto Semanal');
    setShowDungeonModal(false);
    setWorkout(null);
    setDungeonCircuit(null);

    if (isBossRaid && user?.uid) {
      const routineSnapshot = (dungeonCircuit?.circuit || currentBoss.circuit).map((ex) => ({
        id: ex.id,
        name: ex.name,
        targetCount: ex.targetCount,
        repsLabel: ex.repsLabel,
        muscles: ex.muscles,
        sets: ex.sets,
        xpReward: ex.xpReward,
      }));

      const result = await recordBossDefeat(
        currentBoss.id,
        user.uid,
        routineSnapshot,
        user?.level || 1
      );

      // ⚔️ SURGE: Extraer el alma del Jefe derrotado para el Ejército de Sombras
      await extractShadow(currentBoss.id, user.uid);

      setLastDefeatedBossInfo({
        name: currentBoss.name,
        title: currentBoss.title,
        rank: 'RANGO S',
        xpReward: xpReward,
      });

      Haptics.triumph();
      SoundEffects.playLevelUp();

      // Abrir modal de victoria compartible y extracción de sombras
      setShowBossVictoryShareModal(true);
    } else {
      Haptics.triumph();
      Alert.alert('¡Mazmorra Conquistada! 🏆', `Has obtenido +${xpReward} XP del Sistema CORTEX.`);
    }
  };

  const handleStartBossRaid = () => {
    if (!bossCountdown.isAvailable) {
      Haptics.warning();
      Alert.alert(
        'Portal de Asalto Sellado ⏳',
        `El combate contra ${currentBoss.name} sólo se desbloquea los sábados y domingos.\n\n${bossCountdown.label}: ${bossCountdown.formatted}.\n\n¡Nueva semana, nueva oportunidad! Calibra tu fuerza en las directivas diarias de lunes a viernes y prepárate.`
      );
      return;
    }
    const userProfile = {
      fitnessLevel: user?.fitnessLevel || 'beginner',
      level: user?.level || 1,
      equipment: user?.equipment || ['none'],
      weight: user?.weight,
      height: user?.height,
      kneeFriendly: user?.kneeFriendly,
    };
    const validatedCircuit = adaptCircuitForUser(currentBoss.circuit, userProfile);
    const bossData: CustomCircuitData = {
      title: `Asalto Semanal: ${currentBoss.name}`,
      subtitle: `${currentBoss.title} • HP: ${currentBoss.totalHP}`,
      duration: 30,
      xpReward: currentBoss.xpReward,
      circuit: validatedCircuit,
      emoji: currentBoss.emoji,
    };
    setDungeonCircuit(bossData);
    setShowDungeonModal(true);
    Haptics.heavy();
  };

  const handleSelectPlan = async (plan: TrainingPlan) => {
    await setActivePlan(plan.id);
    const isRoutineDoneToday = usePlanStore.getState().isTodayRoutineCompleted();

    if (isRoutineDoneToday) {
      // El usuario ya entrenó hoy y activó otro plan
      setPendingRestPlan(plan);
      setPendingRestDayNumber(1);
      setShowRestAdvisoryModal(true);
    } else {
      Alert.alert(
        'Directiva Asignada ⚡',
        `CORTEX ha establecido "${plan.title}" como tu protocolo de combate activo.`
      );
    }
  };

  const handleSelectPlanAndStart = async (plan: TrainingPlan) => {
    await setActivePlan(plan.id);
    handleOpenCircuit(1, true);
  };

  const handleRecalibrate = async (focus: RecalibrationFocus) => {
    setIsRecalibrating(true);
    Haptics.medium();
    SoundEffects.playLevelUp();
    try {
      const updated =
        focus === 'auto'
          ? await CortexDirective.resetToAutonomous(user)
          : await CortexDirective.recalibrateDailyDirective(user, focus);
      setCortexDirectives(updated);
      await setActivePlan(updated.dailyPlan.id);
      setShowRecalibrateModal(false);
      Alert.alert(
        'Directiva CORTEX Recalibrada ⚡',
        `El Sistema ha establecido: "${updated.dailyPlan.title}".`
      );
    } catch (e) {
      console.warn('Error recalibrando directiva:', e);
    } finally {
      setIsRecalibrating(false);
    }
  };

  const handleToggleDayComplete = async (dayNumber: number, xpReward: number) => {
    if (completedDayNumbers.includes(dayNumber)) return;
    const res = await completePlanDay(dayNumber);
    if (res.isPlanFullyCompleted && activePlan) {
      setCompletedModalPlan(activePlan);
      setShowPlanCompletedModal(true);
    } else {
      Alert.alert('¡Día Conquistado! ⚔️', `Sumaste +${xpReward} XP a tu progreso.`);
    }
  };

  const filteredPlans =
    selectedPlanCategory === 'all'
      ? TRAINING_PLANS
      : TRAINING_PLANS.filter((p) => p.type === selectedPlanCategory);

  const formatAlarmTime = (h: number, m: number) =>
    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  // Próximo día pendiente en el plan activo
  const nextPendingDay = activePlan
    ? activePlan.daysSchedule.find((d) => !completedDayNumbers.includes(d.dayNumber)) ||
      activePlan.daysSchedule[0]
    : null;

  const isCurrentDayDone = nextPendingDay
    ? completedDayNumbers.includes(nextPendingDay.dayNumber)
    : false;

  const handleOpenCircuit = (dayNum?: number, forceStart?: boolean) => {
    const targetDay = dayNum ?? (nextPendingDay?.dayNumber || 1);
    const isDayAlreadyDone = completedDayNumbers.includes(targetDay);
    const isRoutineDoneToday = usePlanStore.getState().isTodayRoutineCompleted();

    // Si ya completó una rutina hoy y este circuito aún no está completado,
    // advertir sobre la importancia del descanso fisiológico salvo que el usuario fuerce el inicio
    if (!forceStart && isRoutineDoneToday && !isDayAlreadyDone) {
      setPendingRestDayNumber(targetDay);
      setPendingRestPlan(activePlan || null);
      setShowRestAdvisoryModal(true);
      return;
    }

    setCircuitDayNumber(targetDay);
    setShowCircuitModal(true);
  };

  const handleStartTomorrow = () => {
    setShowRestAdvisoryModal(false);
    Alert.alert(
      'Descanso y Asimilación 🛡️',
      `Sabia decisión. Tu cuerpo asimilará el estímulo de hoy y mañana tendrás la energía al 100% para iniciar el Día ${pendingRestDayNumber} de "${pendingRestPlan?.title || activePlan?.title}".`
    );
  };

  const handleStartAnyway = () => {
    setShowRestAdvisoryModal(false);
    handleOpenCircuit(pendingRestDayNumber, true);
  };

  const cyanGlow = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 240, 255, 0.25)', 'rgba(0, 240, 255, 0.8)'],
  });

  const bossGlow = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(239, 68, 68, 0.35)', 'rgba(239, 68, 68, 0.95)'],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <SafeScreen style={styles.safe}>
      {/* Header Estilo Solo Leveling / Sistema */}
      <View style={styles.header}>
        <View style={styles.headerSystemBadgeRow}>
          <Animated.View style={[styles.headerLiveDot, { transform: [{ scale: pulseScale }] }]} />
          <Text style={styles.headerSystemTag}>[ SISTEMA: CALABOZOS & DIRECTIVAS ]</Text>
          <Text style={styles.headerRankSubTag}>CORTEX V1.0</Text>
        </View>
        <Text style={styles.headerTitle}>Entrenamiento Táctico</Text>
        <Text style={styles.headerSubtitle}>
          Elige un programa estructurado o forja una mazmorra instantánea
        </Text>
      </View>

      {/* Switcher Táctico de 2 Pestañas: CORTEX Directivas y Asalto a la Mazmorra */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'plans' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('plans')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={16}
            color={activeTab === 'plans' ? '#0A0A0F' : '#94A3B8'}
          />
          <Text style={[styles.topTabText, activeTab === 'plans' && styles.topTabTextActive]}>
            [ 🤖 CORTEX Directivas ]
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'custom' && styles.topTabBtnActiveBoss]}
          onPress={() => setActiveTab('custom')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="skull-outline"
            size={16}
            color={activeTab === 'custom' ? '#FFFFFF' : '#94A3B8'}
          />
          <Text style={[styles.topTabText, activeTab === 'custom' && styles.topTabTextActiveBoss]}>
            [ 👑 Asalto / Torre ]
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={mainScrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Banner de Calibración Smartwatch */}
        {isWatchConnected && watchBrandConfig && (
          <View style={[styles.smartwatchWorkoutBanner, { borderColor: watchBrandConfig.accentColor + '55' }]}>
            <View style={styles.smartwatchWorkoutBannerHeader}>
              <View style={styles.smartwatchWorkoutBadgeRow}>
                <Ionicons name="watch" size={14} color={watchBrandConfig.accentColor} />
                <Text style={[styles.smartwatchWorkoutBadgeText, { color: watchBrandConfig.accentColor }]}>
                  TELEMETRÍA {watchBrandConfig.name.toUpperCase()} ACTIVA
                </Text>
              </View>
              <Text style={styles.smartwatchWorkoutMetricsTag}>
                {watchMetrics.currentHeartRate} BPM • {watchMetrics.steps.toLocaleString()} pasos
              </Text>
            </View>

            <Text style={styles.smartwatchWorkoutTitle}>{adaptiveWorkout.title}</Text>
            <Text style={styles.smartwatchWorkoutDiagnosis} numberOfLines={2}>
              {adaptiveWorkout.cortexDiagnosis}
            </Text>

            <TouchableOpacity
              style={[styles.smartwatchWorkoutLaunchBtn, { backgroundColor: watchBrandConfig.accentColor }]}
              onPress={handleLaunchSmartwatchCircuit}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={14} color="#07090E" />
              <Text style={styles.smartwatchWorkoutLaunchBtnText}>ENTRENAR RUTINA ASIGNADA</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= PESTAÑA 1: PLANES CORTEX ================= */}
        {activeTab === 'plans' && (
          <>
            {/* HERO CARD HOLOGRÁFICO: DIRECTIVA CORTEX DEL DÍA */}
            {cortexDirectives && (
              <View style={styles.cortexHeroBanner}>
                {/* Cabecera del Sistema */}
                <View style={styles.cortexHeroHeader}>
                  <View style={styles.cortexSystemBadge}>
                    <Animated.View style={[styles.headerLiveDot, { transform: [{ scale: pulseScale }] }]} />
                    <Text style={styles.cortexSystemTag}>
                      {cortexDirectives.systemTag}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cortexRecalibratePill}
                    onPress={() => setShowRecalibrateModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="options-outline" size={13} color="#00F0FF" />
                    <Text style={styles.cortexRecalibratePillText}>Re-calibrar</Text>
                  </TouchableOpacity>
                </View>

                {/* Título de la Directiva Prescrita */}
                <View style={styles.cortexHeroTitleRow}>
                  <View style={styles.cortexPlanEmojiBox}>
                    <Text style={{ fontSize: 24 }}>{cortexDirectives.dailyPlan.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cortexHeroTitle}>{cortexDirectives.dailyPlan.title}</Text>
                    <Text style={styles.cortexHeroSubtitle}>
                      {cortexDirectives.dailyPlan.subtitle} • {cortexDirectives.dailyPlan.durationLabel}
                    </Text>
                  </View>
                  <View style={styles.questRewardPill}>
                    <Text style={styles.questRewardPillText}>+{cortexDirectives.dailyPlan.totalXPReward} XP</Text>
                  </View>
                </View>

                {/* Cuadro de Diagnóstico CORTEX (Speech Bubble del Sistema IA) */}
                <View style={styles.cortexSpeechBox}>
                  <View style={styles.cortexSpeechHeader}>
                    <Ionicons name="hardware-chip" size={14} color="#00F0FF" />
                    <Text style={styles.cortexSpeechSender}>CORTEX // DIAGNÓSTICO BIOMÉTRICO</Text>
                    {cortexDirectives.isCustomRecalibrated && (
                      <View style={styles.cortexOverriddenBadge}>
                        <Text style={styles.cortexOverriddenText}>CALIBRACIÓN MANUAL</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cortexSpeechText}>
                    "{cortexDirectives.cortexDiagnosis}"
                  </Text>
                </View>

                {/* Cadena de Prescripción CORTEX: Diaria, Semanal, Mensual */}
                <View style={styles.cortexPrescriptionChain}>
                  <View style={styles.prescriptionStep}>
                    <Text style={styles.prescriptionStepLabel}>HOY (DIARIA)</Text>
                    <Text style={styles.prescriptionStepVal} numberOfLines={1}>
                      {cortexDirectives.dailyPlan.title.replace('Directiva Diaria: ', '')}
                    </Text>
                  </View>
                  <View style={styles.prescriptionDivider} />
                  <TouchableOpacity
                    style={styles.prescriptionStep}
                    onPress={() => handleSelectPlan(cortexDirectives.weeklyPlan)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.prescriptionStepLabel}>SEMANA (PPL)</Text>
                    <Text style={[styles.prescriptionStepVal, { color: '#C084FC' }]} numberOfLines={1}>
                      {cortexDirectives.weeklyPlan.title.replace('Protocolo Semanal: ', '')}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.prescriptionDivider} />
                  <TouchableOpacity
                    style={styles.prescriptionStep}
                    onPress={() => handleSelectPlan(cortexDirectives.monthlyPlan)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.prescriptionStepLabel}>MES (MESOCICLO)</Text>
                    <Text style={[styles.prescriptionStepVal, { color: '#F59E0B' }]} numberOfLines={1}>
                      {cortexDirectives.monthlyPlan.title.replace('Mesociclo: ', '')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Botón de Lanzamiento de la Directiva */}
                <TouchableOpacity
                  style={styles.cortexLaunchBtn}
                  onPress={() => {
                    handleSelectPlanAndStart(cortexDirectives.dailyPlan);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="flash" size={16} color="#07090E" />
                  <Text style={styles.cortexLaunchBtnText}>EJECUTAR DIRECTIVA DE HOY ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tarjeta Hero: Plan Activo Multi-Día o Plan Conquistado */}
            {activePlan && (activePlan.daysSchedule.length > 1 || isCurrentPlanCompleted()) && (
              isCurrentPlanCompleted() ? (
                <View style={styles.conqueredPlanCard}>
                  {/* Header Conquistado */}
                  <View style={styles.conqueredHeaderRow}>
                    <View style={styles.conqueredTrophyBox}>
                      <Ionicons name="trophy" size={24} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <View style={styles.conqueredPill}>
                          <Text style={styles.conqueredPillText}>PROGRAMA CONQUISTADO (100%)</Text>
                        </View>
                        <Text style={styles.conqueredDaysCount}>
                          {completedDayNumbers.length}/{activePlan.daysSchedule.length} DÍAS
                        </Text>
                      </View>
                      <Text style={styles.activePlanTitle}>{activePlan.emoji} {activePlan.title}</Text>
                    </View>
                  </View>

                  <Text style={styles.conqueredDesc}>
                    ¡Enhorabuena, Cazador! Has completado todos los ciclos de este plan táctico. Tu disciplina física y neuromuscular han evolucionado. CORTEX te recomienda seleccionar tu siguiente programa de entrenamiento para continuar tu ascenso.
                  </Text>

                  {/* Recomendación CORTEX del siguiente nivel */}
                  {getRecommendedNextPlan() && getRecommendedNextPlan()?.id !== activePlan.id && (
                    <View style={styles.cortexNextPlanBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="compass" size={14} color="#10B981" />
                        <Text style={styles.cortexNextPlanLabel}>SIGUIENTE NIVEL RECOMENDADO:</Text>
                      </View>
                      <Text style={styles.cortexNextPlanTitle}>
                        {getRecommendedNextPlan()?.emoji} {getRecommendedNextPlan()?.title} • {getRecommendedNextPlan()?.difficulty}
                      </Text>
                      <TouchableOpacity
                        style={styles.selectNewPlanBtn}
                        onPress={() => handleSelectPlan(getRecommendedNextPlan()!)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="play" size={15} color="#0A0A0F" />
                        <Text style={styles.selectNewPlanBtnText}>
                          Comenzar Siguiente Programa ›
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Acciones del Plan Conquistado */}
                  <View style={styles.conqueredActionsRow}>
                    <TouchableOpacity
                      style={styles.browseCatalogBtn}
                      onPress={() => {
                        mainScrollRef.current?.scrollTo({ y: 380, animated: true });
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="list" size={16} color="#00F0FF" />
                      <Text style={styles.browseCatalogBtnText}>Ver Catálogo de Planes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.repeatCycleBtn}
                      onPress={async () => {
                        await resetCurrentPlanProgress();
                        Alert.alert('Ciclo Reiniciado 🔄', `Puedes volver a realizar los días de "${activePlan.title}".`);
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="refresh" size={15} color="#94A3B8" />
                      <Text style={styles.repeatCycleBtnText}>Repetir Ciclo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
              <Animated.View style={[styles.activePlanCard, { borderColor: cyanGlow }]}>
                {/* Header de la Tarjeta del Plan */}
                <View style={styles.activePlanTopRow}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => handleOpenCircuit()}
                    activeOpacity={0.75}
                  >
                    <View style={styles.activePlanBadgeRow}>
                      <View style={styles.planTitleIconBox}>
                        <Ionicons name="shield-checkmark" size={17} color="#00F0FF" />
                      </View>
                      <View style={styles.activeStatusPill}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.activeStatusText}>PLAN EN CURSO</Text>
                      </View>
                      <View style={styles.questProgressBadge}>
                        <Text style={styles.questProgressText}>
                          {completedDayNumbers.length}/{activePlan.daysSchedule.length} DÍAS
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.activePlanTitle}>{activePlan.emoji} {activePlan.title}</Text>
                    <Text style={styles.activePlanTapHint}>
                      Toca para abrir circuito de combate ›
                    </Text>
                  </TouchableOpacity>

                  {/* Acceso Rápido a Alarma */}
                  <TouchableOpacity
                    style={styles.alarmPillBtn}
                    onPress={() => setShowAlarmModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="alarm-outline" size={15} color="#00F0FF" />
                    <Text style={styles.alarmPillText}>
                      {alarmSettings.enabled
                        ? formatAlarmTime(alarmSettings.hour, alarmSettings.minute)
                        : 'Alarma'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Barra de Progreso Segmentada (Estilo Misiones Diarias) */}
                <View style={styles.segmentedProgressBar}>
                  {activePlan.daysSchedule.map((d, idx) => {
                    const isDone = completedDayNumbers.includes(d.dayNumber);
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.progressSegment,
                          isDone && styles.progressSegmentDone,
                        ]}
                      />
                    );
                  })}
                </View>

                {/* Siguiente Día de Entrenamiento (Circuito) */}
                {nextPendingDay && (
                  <View style={styles.nextDayBox}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => handleOpenCircuit(nextPendingDay.dayNumber)}
                      activeOpacity={0.75}
                    >
                      {/* Badges de Calibración de Cazador */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        <View style={styles.hunterTelemetryPillCyan}>
                          <Text style={styles.hunterTelemetryTextCyan}>
                            {user?.fitnessLevel === 'beginner' ? '🔰 PRINCIPIANTE' : user?.fitnessLevel === 'advanced' ? '👑 AVANZADO' : '⚡ INTERMEDIO'}
                          </Text>
                        </View>
                        <View style={styles.hunterTelemetryPillPurple}>
                          <Text style={styles.hunterTelemetryTextPurple}>
                            {user?.equipment?.includes('gym') ? '🏟️ GIMNASIO' : user?.equipment?.includes('dumbbells') || user?.equipment?.includes('barbell') ? '🏋️ MANCUERNAS' : '🏠 PESO CORPORAL'}
                          </Text>
                        </View>
                        <View style={styles.hunterTelemetryPillGreen}>
                          <Text style={styles.hunterTelemetryTextGreen}>
                            NIVEL {user?.level || 1}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.nextDayHeaderRow}>
                        <Text style={styles.nextDayHeader}>
                          [ CÁMARA ACTUAL: DÍA {nextPendingDay.dayNumber} ]
                        </Text>
                        <Text style={styles.stationsBadge}>
                          {nextPendingDay.exercisesCount} Estaciones
                        </Text>
                      </View>
                      <Text style={styles.nextDayTitle}>{nextPendingDay.title}</Text>
                      <Text style={styles.nextDayFocus}>
                        {nextPendingDay.focus} • {nextPendingDay.duration} min
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.nextDayActionsRow}>
                      <TouchableOpacity
                        style={styles.startCircuitBtn}
                        onPress={() => handleOpenCircuit(nextPendingDay.dayNumber)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="play" size={15} color="#0A0A0F" />
                        <Text style={styles.startCircuitBtnText}>
                          {isCurrentDayDone ? 'Ver Circuito' : 'Entrenar Circuito'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.completeDayBtn,
                          isCurrentDayDone && styles.completeDayBtnDone,
                        ]}
                        onPress={() =>
                          handleToggleDayComplete(nextPendingDay.dayNumber, nextPendingDay.xpReward)
                        }
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isCurrentDayDone ? 'checkmark-circle' : 'checkmark'}
                          size={16}
                          color={isCurrentDayDone ? '#10B981' : '#FFFFFF'}
                        />
                        <Text
                          style={[
                            styles.completeDayBtnText,
                            isCurrentDayDone && styles.completeDayBtnTextDone,
                          ]}
                        >
                          {isCurrentDayDone ? '✓' : `+${nextPendingDay.xpReward} XP`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Botón desplegable para ver lista de días si se desea */}
                <TouchableOpacity
                  style={styles.toggleDaysBtn}
                  onPress={() => setShowAllDays(!showAllDays)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleDaysText}>
                    {showAllDays ? 'Ocultar Calendario Completo ▲' : `Ver los ${activePlan.daysSchedule.length} Días del Plan ▼`}
                  </Text>
                </TouchableOpacity>

                {showAllDays && (
                  <View style={styles.allDaysList}>
                    {activePlan.daysSchedule.map((d) => {
                      const done = completedDayNumbers.includes(d.dayNumber);
                      return (
                        <TouchableOpacity
                          key={d.dayNumber}
                          style={[styles.miniDayCard, done && styles.miniDayCardDone]}
                          onPress={() => handleOpenCircuit(d.dayNumber)}
                          activeOpacity={0.75}
                        >
                          {/* Botón Indicador de Check idéntico a Misiones Diarias */}
                          <TouchableOpacity
                            style={[styles.miniCheckButton, done && styles.miniCheckButtonDone]}
                            onPress={() => handleToggleDayComplete(d.dayNumber, d.xpReward)}
                            activeOpacity={0.7}
                          >
                            {done ? (
                              <Ionicons name="checkmark" size={16} color="#0A0A0F" />
                            ) : (
                              <View style={styles.miniCheckInnerRing} />
                            )}
                          </TouchableOpacity>

                          {/* Icono Táctico del Día */}
                          <View style={styles.miniDayIconBox}>
                            <Text style={styles.miniDayIconText}>D{d.dayNumber}</Text>
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text
                              style={[styles.miniDayName, done && styles.miniDayNameDone]}
                              numberOfLines={1}
                            >
                              {d.title}
                            </Text>
                            <Text style={styles.miniDaySub} numberOfLines={1}>
                              {d.focus} • {d.duration} min • {d.exercisesCount} Est.
                            </Text>
                          </View>

                          {/* Píldora de Recompensa de EXP idéntica a Misiones Diarias */}
                          <View style={[styles.questRewardPill, done && styles.questRewardPillDone]}>
                            <Text style={[styles.questRewardPillText, done && styles.questRewardPillTextDone]}>
                              {done ? `✓ +${d.xpReward} XP` : `+${d.xpReward} XP`}
                            </Text>
                          </View>

                          <Ionicons name="chevron-forward" size={14} color="#64748B" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </Animated.View>
            )
          )}

            {/* Banner Teaser Asalto Semanal */}
            <TouchableOpacity
              style={[
                styles.bossTeaserBanner,
                {
                  borderColor: bossCountdown.isAvailable
                    ? currentBoss.color + '88'
                    : 'rgba(245, 158, 11, 0.4)',
                },
              ]}
              onPress={() => {
                setActiveTab('custom');
                Haptics.medium();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.bossTeaserRow}>
                <View
                  style={[
                    styles.bossTeaserIconCircle,
                    {
                      backgroundColor: bossCountdown.isAvailable
                        ? currentBoss.color + '22'
                        : 'rgba(245, 158, 11, 0.15)',
                    },
                  ]}
                >
                  <Text style={styles.bossTeaserEmoji}>{currentBoss.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.bossTeaserTagRow}>
                    <Text
                      style={[
                        styles.bossTeaserTag,
                        {
                          color: bossCountdown.isAvailable ? currentBoss.color : '#F59E0B',
                        },
                      ]}
                    >
                      {bossCountdown.isAvailable
                        ? '🚨 ASALTO DE FIN DE SEMANA ACTIVO'
                        : '⏳ DESBLOQUEO EN FIN DE SEMANA'}
                    </Text>
                    <View style={styles.bossXpMiniBadge}>
                      <Ionicons name="trophy" size={10} color="#F59E0B" />
                      <Text style={styles.bossXpMiniText}>+{currentBoss.xpReward} XP</Text>
                    </View>
                  </View>
                  <Text style={styles.bossTeaserName}>{currentBoss.name}</Text>
                  <Text style={styles.bossTeaserSub}>
                    {bossCountdown.isAvailable
                      ? '¡El portal está abierto! Toca para desafiar al Monarca ›'
                      : `${bossCountdown.formatted} para combatir ›`}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={bossCountdown.isAvailable ? currentBoss.color : '#F59E0B'}
                />
              </View>
            </TouchableOpacity>

            {/* Cabecera de Biblioteca de Protocolos CORTEX */}
            <View style={styles.catalogSectionHeader}>
              <View style={styles.catalogTitleRow}>
                <Ionicons name="layers" size={17} color="#00F0FF" />
                <Text style={styles.catalogTitleText}>[ BIBLIOTECA DE PROTOCOLOS CORTEX ]</Text>
                <View style={styles.catalogCountBadge}>
                  <Text style={styles.catalogCountBadgeText}>30 RUTINAS</Text>
                </View>
              </View>
              <Text style={styles.catalogSubtitleText}>
                Protocolos tácticos autónomos: diarios, semanales y mesociclos mensuales
              </Text>
            </View>

            {/* Categorías de Filtro Rápidas con Estilo Anime */}
            <View style={styles.categoryPillsRow}>
              {[
                { id: 'all', label: `Todos (${TRAINING_PLANS.length})` },
                { id: 'daily', label: `Diarios ⚡ (${TRAINING_PLANS.filter((p) => p.type === 'daily').length})` },
                { id: 'weekly', label: `Semanales 🛡️ (${TRAINING_PLANS.filter((p) => p.type === 'weekly').length})` },
                { id: 'monthly', label: `Mensuales 👑 (${TRAINING_PLANS.filter((p) => p.type === 'monthly').length})` },
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catPill,
                    selectedPlanCategory === cat.id && styles.catPillActive,
                  ]}
                  onPress={() => setSelectedPlanCategory(cat.id as any)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      selectedPlanCategory === cat.id && styles.catPillTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Catálogo de Programas Tácticos (Estilo Dungeon Gates) */}
            <View style={styles.plansList}>
              {filteredPlans.map((plan) => {
                const isActive = activePlanId === plan.id;

                return (
                  <View key={plan.id} style={[styles.planCardItem, isActive && styles.planCardItemActive]}>
                    <View style={styles.planCardHeaderRow}>
                      <View style={styles.planItemEmojiBox}>
                        <Text style={styles.planEmoji}>{plan.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planTitle}>{plan.title}</Text>
                        <Text style={styles.planSub}>{plan.subtitle}</Text>
                      </View>
                      <View style={[styles.attrBadge, { borderColor: plan.attributeColor, backgroundColor: plan.attributeColor + '18' }]}>
                        <Text style={[styles.attrBadgeText, { color: plan.attributeColor }]}>
                          {plan.targetAttribute}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.planDesc} numberOfLines={2}>
                      {plan.description}
                    </Text>

                    <View style={styles.planFooterRow}>
                      <View style={styles.metaBadge}>
                        <Ionicons name="time-outline" size={13} color="#94A3B8" />
                        <Text style={styles.metaBadgeText}>{plan.durationLabel}</Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>{plan.difficulty}</Text>
                      </View>
                      <View style={styles.questRewardPill}>
                        <Text style={styles.questRewardPillText}>+{plan.totalXPReward} XP</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.selectBtn, isActive && styles.selectBtnActive]}
                        onPress={() => handleSelectPlan(plan)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.selectBtnText, isActive && styles.selectBtnTextActive]}>
                          {isActive ? '✓ En Curso' : 'Activar Plan'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Acceso a Recuperación Táctica */}
            <TouchableOpacity
              style={styles.recoveryCardBtn}
              onPress={() => {
                Haptics.light();
                setShowRecoveryModal(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.recoveryCardIconBox}>
                <Ionicons name="body-outline" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recoveryCardTitle}>[ PROTOCOLO DE RECUPERACIÓN TÁCTICA ]</Text>
                <Text style={styles.recoveryCardSub}>
                  6 estaciones de estiramiento y calma neural • +25 XP Vitalidad
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#10B981" />
            </TouchableOpacity>
          </>
        )}

        {/* ================= PESTAÑA 2: MAZMORRA IA & ASALTO SEMANAL ================= */}
        {activeTab === 'custom' && (
          <View style={styles.dungeonContainer}>
            {/* Acceso Rápido al Ejército de Sombras */}
            <TouchableOpacity
              style={styles.shadowArmyBanner}
              onPress={() => {
                Haptics.medium();
                setShowShadowArmyModal(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.shadowArmyBannerIcon}>
                <Ionicons name="skull" size={20} color="#C084FC" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shadowArmyBannerTitle}>⚔️ EJÉRCITO DE SOMBRAS EXTRAÍDO</Text>
                <Text style={styles.shadowArmyBannerSub}>
                  {soldiers.length > 0
                    ? `${soldiers.length} Monarcas reclutados • Pulsa para equipar Comandante`
                    : 'Vence jefes de mazmorra para extraer sus almas y activar buffs pasivos'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C084FC" />
            </TouchableOpacity>

            {/* Tarjeta Hero: Asalto de Mazmorra Semanal (Modo Red Gate / Monarca) */}
            <Animated.View
              style={[
                styles.bossCard,
                {
                  borderColor: bossCountdown.isAvailable ? bossGlow : 'rgba(245, 158, 11, 0.4)',
                },
              ]}
            >
              <View style={styles.bossBadgeRow}>
                <View
                  style={[
                    styles.bossTag,
                    {
                      backgroundColor: isBossDefeatedThisWeek
                        ? 'rgba(16, 185, 129, 0.2)'
                        : bossCountdown.isAvailable
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bossTagText,
                      {
                        color: isBossDefeatedThisWeek
                          ? '#10B981'
                          : bossCountdown.isAvailable
                          ? '#EF4444'
                          : '#F59E0B',
                      },
                    ]}
                  >
                    {isAllBossesDefeated()
                      ? '👑 TODOS LOS MONARCAS DERROTADOS'
                      : isBossDefeatedThisWeek
                      ? `👑 JEFE DERROTADO • ESCALÓN ${bossStepNumber}/${WEEKLY_BOSSES.length}`
                      : bossCountdown.isAvailable
                      ? `🚨 PUERTA ROJA: ESCALÓN ${bossStepNumber}/${WEEKLY_BOSSES.length}`
                      : `🔒 ESCALÓN ${bossStepNumber}/${WEEKLY_BOSSES.length} (FIN DE SEMANA)`}
                  </Text>
                </View>
                <View style={styles.bossRewardBadge}>
                  <Ionicons name="trophy" size={13} color="#F59E0B" />
                  <Text style={styles.bossRewardText}>+{currentBoss.xpReward} XP</Text>
                </View>
              </View>

              <View style={styles.bossHeader}>
                <View
                  style={[
                    styles.bossAvatarCircle,
                    {
                      borderColor: bossCountdown.isAvailable ? currentBoss.color : '#F59E0B',
                    },
                  ]}
                >
                  <Text style={styles.bossEmoji}>{currentBoss.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bossName}>{currentBoss.name}</Text>
                  <Text style={styles.bossTitle}>{currentBoss.title}</Text>
                </View>
              </View>

              {/* Caja de Contador en Tiempo Real */}
              <View style={styles.bossCountdownBox}>
                <View style={styles.bossCountdownHeader}>
                  <Ionicons
                    name={bossCountdown.isAvailable ? 'flash' : 'hourglass-outline'}
                    size={14}
                    color={bossCountdown.isAvailable ? currentBoss.color : '#F59E0B'}
                  />
                  <Text style={styles.bossCountdownLabel}>{bossCountdown.label}</Text>
                </View>
                <Text
                  style={[
                    styles.bossCountdownClock,
                    { color: bossCountdown.isAvailable ? '#FFFFFF' : '#F59E0B' },
                  ]}
                >
                  {bossCountdown.formatted}
                </Text>
                <Text style={styles.bossCountdownSub}>
                  {bossCountdown.isAvailable
                    ? '⚡ Portal abierto hasta el Domingo 23:59:59'
                    : '🛡️ Disponible exclusivamente Sábado y Domingo'}
                </Text>
              </View>

              {/* Barra de Vida del Jefe */}
              <View style={styles.bossHpContainer}>
                <View style={styles.bossHpRow}>
                  <Text style={styles.bossHpLabel}>PUNTOS DE ARMADURA / VIDA</Text>
                  <Text
                    style={[
                      styles.bossHpValue,
                      { color: bossCountdown.isAvailable ? currentBoss.color : '#94A3B8' },
                    ]}
                  >
                    {isBossDefeatedThisWeek ? '0' : currentBoss.totalHP} / {currentBoss.totalHP} HP
                  </Text>
                </View>
                <View style={styles.bossHpTrack}>
                  <View
                    style={[
                      styles.bossHpFill,
                      {
                        backgroundColor: isBossDefeatedThisWeek
                          ? '#10B981'
                          : bossCountdown.isAvailable
                          ? currentBoss.color
                          : '#475569',
                        width: isBossDefeatedThisWeek ? '0%' : '100%',
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.bossLoreBox}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#64748B" style={{ marginBottom: 2 }} />
                <Text style={styles.bossLore}>{currentBoss.lore}</Text>
              </View>

              {/* Mensaje motivacional */}
              {!bossCountdown.isAvailable && (
                <View style={styles.newWeekOpportunityCard}>
                  <Ionicons name="sparkles" size={16} color="#00F0FF" />
                  <Text style={styles.newWeekOpportunityText}>
                    <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>
                      Nueva semana, nueva oportunidad ⚔️.{' '}
                    </Text>
                    El portal de asalto se regenera de lunes a viernes. Calibra tu fuerza completando tus directivas diarias para estar en óptimas condiciones cuando el Monarca emerja este sábado.
                  </Text>
                </View>
              )}

              {isBossDefeatedThisWeek && (
                <View style={styles.bossDefeatedBanner}>
                  <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                  <Text style={styles.bossDefeatedBannerText}>
                    ¡Asalto de fin de semana superado con honores! Recompensa de +{currentBoss.xpReward} XP y título asegurados.
                  </Text>
                </View>
              )}

              <View style={styles.bossStationsRow}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#00F0FF" />
                <Text style={styles.bossStationsText}>
                  5 Estaciones de Asalto • Cadencia Biomecánica Estricta
                </Text>
              </View>

              {/* Botón de Asalto Dinámico */}
              {isAllBossesDefeated() ? (
                <View style={{ gap: 8 }}>
                  <View style={styles.bossDefeatedButton}>
                    <Ionicons name="trophy" size={18} color="#FFD700" />
                    <Text style={[styles.bossDefeatedButtonText, { color: '#FFD700' }]}>
                      ¡TODOS LOS MONARCAS DERROTADOS!
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.bossBattleBtn, { backgroundColor: '#8B5CF6' }]}
                    onPress={() => {
                      Alert.alert(
                        'Reiniciar Escalera de Monarcas',
                        '¿Deseas reiniciar la progresión para volver a desafiar a Igris y toda la escalera en Modo Prestigio?',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Reiniciar Escalera',
                            style: 'destructive',
                            onPress: () => {
                              if (user?.uid) resetBossProgress(user.uid);
                            },
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="refresh" size={18} color="#0A0A0F" />
                    <Text style={styles.bossBattleBtnText}>REINICIAR ESCALERA (MODO PRESTIGIO)</Text>
                  </TouchableOpacity>
                </View>
              ) : isBossDefeatedThisWeek ? (
                <View style={styles.bossDefeatedButton}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.bossDefeatedButtonText}>MONARCA DERROTADO • ACCESO AL SIGUIENTE NIVEL</Text>
                </View>
              ) : bossCountdown.isAvailable ? (
                <TouchableOpacity
                  style={[styles.bossBattleBtn, { backgroundColor: currentBoss.color }]}
                  onPress={handleStartBossRaid}
                  activeOpacity={0.85}
                >
                  <Ionicons name="skull" size={18} color="#0A0A0F" />
                  <Text style={styles.bossBattleBtnText}>DESAFIAR AL MONARCA DE MAZMORRA</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.bossLockedBtn}
                  onPress={handleStartBossRaid}
                  activeOpacity={0.8}
                >
                  <Ionicons name="lock-closed" size={16} color="#94A3B8" />
                  <Text style={styles.bossLockedBtnText}>
                    DESBLOQUEO EN {bossCountdown.formatted}
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Separador de Sección Estilo Anime */}
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>[ O FORJA UNA MAZMORRA INSTANTÁNEA ]</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.dungeonIntroCard}>
              <View style={styles.dungeonTitleRow}>
                <View style={styles.dungeonTitleWrapper}>
                  <View style={styles.questsTitleIconBox}>
                    <Ionicons name="flash" size={16} color="#00F0FF" />
                  </View>
                  <Text style={styles.dungeonTitle}>Mazmorra Instantánea</Text>
                </View>
                <TouchableOpacity
                  style={isUnlimited ? styles.dungeonManaBadgeUnlimited : styles.dungeonManaBadgeStandard}
                  onPress={() => setShowKeyModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isUnlimited ? 'key' : 'flash'}
                    size={11}
                    color={isUnlimited ? '#F59E0B' : '#00F0FF'}
                  />
                  <Text
                    style={
                      isUnlimited
                        ? styles.dungeonManaBadgeUnlimitedText
                        : styles.dungeonManaBadgeStandardText
                    }
                  >
                    {isUnlimited ? 'ILIMITADO' : `${dailyManaRemaining}/5 MANÁ`}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.dungeonSubtitle}>
                Elige tu enfoque y la IA formulará una sesión única adaptada a tu nivel
              </Text>

              {/* Selector de Enfoque en Cuadrícula 2x3 */}
              <View style={styles.focusGrid}>
                {WORKOUT_TYPES.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.focusCard, isSelected && styles.focusCardSelected]}
                      onPress={() => {
                        setSelectedType(type.id);
                        setWorkout(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={22}
                        color={isSelected ? '#00F0FF' : '#64748B'}
                      />
                      <Text style={[styles.focusLabel, isSelected && styles.focusLabelSelected]}>
                        {type.label}
                      </Text>
                      <Text style={styles.focusDuration}>{type.duration} min • {type.focus}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Botón de Invocación con CORTEX */}
              {!workout && (
                <TouchableOpacity
                  style={styles.invokeBtn}
                  onPress={generateWorkout}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#0A0A0F" size="small" />
                      <Text style={styles.invokeBtnText}>CORTEX forjando mazmorra instantánea...</Text>
                    </View>
                  ) : (
                    <View style={styles.loadingRow}>
                      <Ionicons name="sparkles" size={18} color="#0A0A0F" />
                      <Text style={styles.invokeBtnText}>Invocar Mazmorra con CORTEX</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Rutina Generada Simplificada */}
            {workout && (
              <View style={styles.generatedWorkoutBox}>
                <View style={styles.workoutHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workoutMainTitle}>{workout.title}</Text>
                    <Text style={styles.workoutRewardText}>
                      Recompensa del Sistema: +{workout.totalXP || 150} XP
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.reRollBtn}
                    onPress={() => setWorkout(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={16} color="#00F0FF" />
                  </TouchableOpacity>
                </View>

                {/* Ejercicios Principales en Formato Circuito */}
                {workout.main?.length > 0 && (
                  <View style={styles.exerciseSection}>
                    <Text style={styles.phaseHeader}>[ ESTACIONES DEL CIRCUITO ]</Text>
                    {workout.main.map((ex: any, i: number) => {
                      const exGuide = resolveExerciseGuide(ex.exercise || '');

                      return (
                        <View key={i} style={styles.exerciseCard}>
                          <View style={styles.exIndexCircle}>
                            <Text style={styles.exIndexText}>{i + 1}</Text>
                          </View>
                          <ExerciseMedia
                            gifUrl={exGuide.cdnGifUrl}
                            rawGifUrl={exGuide.rawGifUrl}
                            thumbnailUrl={exGuide.thumbnailUrl}
                            style={styles.exThumbMini}
                            resizeMode="cover"
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.exName}>{ex.exercise || exGuide.name}</Text>
                            <Text style={styles.exDetails}>
                              {ex.sets || 3} series × {ex.reps || '12 reps'} | Descanso: 20s
                            </Text>
                          </View>
                          <View style={styles.questRewardPill}>
                            <Text style={styles.questRewardPillText}>+{ex.xp || 30} XP</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Directivas CORTEX */}
                {workout.tips?.length > 0 && (
                  <View style={styles.cortexTipCard}>
                    <Ionicons name="hardware-chip-outline" size={18} color="#00F0FF" />
                    <Text style={styles.cortexTipText}>
                      {workout.tips[0]}
                    </Text>
                  </View>
                )}

                {/* Botón Iniciar Circuito de Mazmorra */}
                <TouchableOpacity
                  style={styles.startDungeonCircuitBtn}
                  onPress={() => setShowDungeonModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="play" size={18} color="#0A0A0F" />
                  <Text style={styles.startDungeonCircuitText}>
                    ENTRENAR CIRCUITO DE MAZMORRA
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}


      </ScrollView>

      {/* Modal de Alarma y Recordatorios */}
      <PlanAlarmModal
        visible={showAlarmModal}
        onClose={() => setShowAlarmModal(false)}
      />

      {/* Modal de Circuito de Entrenamiento (Planes CORTEX) */}
      <PlanCircuitModal
        visible={showCircuitModal}
        plan={activePlan || null}
        dayNumber={circuitDayNumber}
        onClose={() => setShowCircuitModal(false)}
        onCompleteDay={handleToggleDayComplete}
      />

      {/* Modal de Circuito de Mazmorra IA */}
      <PlanCircuitModal
        visible={showDungeonModal}
        customCircuit={dungeonCircuit}
        autoStart={false}
        onClose={() => setShowDungeonModal(false)}
        onCompleteDay={handleCompleteDungeonCircuit}
      />

      {/* Modal de Recuperación Táctica On-Demand */}
      <RecoveryModal
        visible={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
      />

      {/* Modal de Configuración Clave CORTEX (BYOK) */}
      <CortexKeyModal
        visible={showKeyModal}
        onClose={() => setShowKeyModal(false)}
      />

      {/* Modal de Celebración de Plan Conquistado al 100% */}
      <PlanCompletedModal
        visible={showPlanCompletedModal}
        plan={completedModalPlan}
        recommendedNextPlan={getRecommendedNextPlan()}
        onClose={() => setShowPlanCompletedModal(false)}
        onSelectPlan={(newPlan) => handleSelectPlan(newPlan)}
        onRepeatPlan={async () => {
          await resetCurrentPlanProgress();
          Alert.alert('Ciclo Reiniciado 🔄', `Puedes volver a realizar los días de este plan.`);
        }}
      />

      {/* Modal de Advertencia Biomédica: Importancia del Descanso */}
      <RestAdvisoryModal
        visible={showRestAdvisoryModal}
        planTitle={pendingRestPlan?.title || activePlan?.title}
        planEmoji={pendingRestPlan?.emoji || activePlan?.emoji}
        dayNumber={pendingRestDayNumber}
        sessionTitle={
          pendingRestPlan?.daysSchedule?.find((d) => d.dayNumber === pendingRestDayNumber)?.title ||
          activePlan?.daysSchedule?.find((d) => d.dayNumber === pendingRestDayNumber)?.title ||
          'Circuito Táctico'
        }
        onStartTomorrow={handleStartTomorrow}
        onStartAnyway={handleStartAnyway}
        onClose={() => setShowRestAdvisoryModal(false)}
      />

      {/* Modal de Re-Calibración de Directiva CORTEX */}
      <Modal
        visible={showRecalibrateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecalibrateModal(false)}
      >
        <View style={styles.recalibrateModalOverlay}>
          <View style={styles.recalibrateModalContent}>
            <View style={styles.recalibrateModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="hardware-chip" size={20} color="#00F0FF" />
                <Text style={styles.recalibrateModalTitle}>[ RE-CALIBRAR DIRECTIVA CORTEX ]</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRecalibrateModal(false)}
                style={styles.recalibrateCloseBtn}
              >
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.recalibrateModalDesc}>
              ¿Deseas enfocar un estímulo biomecánico específico hoy? CORTEX reconfigurará la directiva diaria según tu selección.
            </Text>

            <ScrollView style={styles.recalibrateList} showsVerticalScrollIndicator={false}>
              {RECALIBRATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.recalibrateOptionCard}
                  onPress={() => handleRecalibrate(opt.id)}
                  disabled={isRecalibrating}
                  activeOpacity={0.8}
                >
                  <Text style={styles.recalibrateOptionEmoji}>{opt.emoji}</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.recalibrateOptionLabel}>{opt.label}</Text>
                    <Text style={styles.recalibrateOptionDesc}>{opt.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#00F0FF" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Modal del Ejército de Sombras */}
      <ShadowArmyModal
        visible={showShadowArmyModal}
        onClose={() => setShowShadowArmyModal(false)}
        uid={user?.uid || 'guest'}
      />

      {/* Modal de Asalto y Tarjeta de Victoria de Jefe de Mazmorra */}
      <RaidClearShareModal
        visible={showBossVictoryShareModal}
        onClose={() => setShowBossVictoryShareModal(false)}
        bossName={lastDefeatedBossInfo?.name || currentBoss.name}
        bossTitle={lastDefeatedBossInfo?.title || currentBoss.title}
        rankBadge={lastDefeatedBossInfo?.rank || 'RANGO S'}
        hunterName={user?.name || 'Cazador del Sistema'}
        hunterLevel={user?.level || 1}
        xpEarned={lastDefeatedBossInfo?.xpReward || currentBoss.xpReward}
        totalTimeMinutes={30}
        streakDays={user?.streak || 1}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  shadowArmyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.35)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  shadowArmyBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowArmyBannerTitle: {
    color: '#C084FC',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shadowArmyBannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 4,
  },
  headerSystemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  headerLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00F0FF',
  },
  headerSystemTag: {
    color: '#00F0FF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerRankSubTag: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: '#0F121E',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  topTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
  },
  topTabBtnActive: {
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  topTabBtnActiveBoss: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  topTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  topTabTextActive: {
    color: '#07090E',
    fontWeight: '900',
  },
  topTabTextActiveBoss: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 16,
  },

  // Plan Conquistado (100% Completado)
  conqueredPlanCard: {
    backgroundColor: '#0F121E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    gap: 12,
  },
  conqueredHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  conqueredTrophyBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conqueredPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  conqueredPillText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  conqueredDaysCount: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  conqueredDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  cortexNextPlanBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 12,
    gap: 6,
  },
  cortexNextPlanLabel: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cortexNextPlanTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  selectNewPlanBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  selectNewPlanBtnText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: '800',
  },
  conqueredActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  browseCatalogBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  browseCatalogBtnText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  repeatCycleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },
  repeatCycleBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },

  // Plan Activo (Estética idéntica a Misiones Diarias)
  activePlanCard: {
    backgroundColor: '#0F121E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    gap: 12,
  },
  activePlanTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  activePlanBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  planTitleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeStatusText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  questProgressBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  questProgressText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activePlanTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: 'bold',
  },
  activePlanTapHint: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  alarmPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  alarmPillText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
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
  nextDayBox: {
    backgroundColor: 'rgba(0, 240, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    gap: 8,
  },
  hunterTelemetryPillCyan: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  hunterTelemetryTextCyan: {
    color: '#00F0FF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  hunterTelemetryPillPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  hunterTelemetryTextPurple: {
    color: '#A78BFA',
    fontSize: 9.5,
    fontWeight: '700',
  },
  hunterTelemetryPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  hunterTelemetryTextGreen: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '700',
  },
  nextDayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextDayHeader: {
    color: '#00F0FF',
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  stationsBadge: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  nextDayTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  nextDayFocus: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 1,
  },
  nextDayActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  startCircuitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00F0FF',
    borderRadius: 12,
    paddingVertical: 10,
  },
  startCircuitBtnText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completeDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  completeDayBtnDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  completeDayBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completeDayBtnTextDone: {
    color: '#10B981',
  },
  toggleDaysBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleDaysText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  allDaysList: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  miniDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  miniDayCardDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  miniCheckButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCheckButtonDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  miniCheckInnerRing: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 240, 255, 0.5)',
  },
  miniDayIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDayIconText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  miniDayName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold',
  },
  miniDayNameDone: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  miniDaySub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  questRewardPill: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
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
    fontSize: 10,
    fontWeight: 'bold',
  },
  questRewardPillTextDone: {
    color: '#10B981',
  },
  noPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0F121E',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  noPlanIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPlanTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noPlanDesc: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },

  // Filtros
  categoryPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  catPill: {
    backgroundColor: '#0F121E',
    borderRadius: Radius.full,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catPillActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: '#00F0FF',
  },
  catPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },

  // Catálogo de Planes
  plansList: {
    gap: 10,
  },
  planCardItem: {
    backgroundColor: '#0F121E',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 8,
  },
  planCardItemActive: {
    borderColor: 'rgba(0, 240, 255, 0.45)',
    backgroundColor: 'rgba(0, 240, 255, 0.03)',
  },
  planCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planItemEmojiBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planEmoji: {
    fontSize: 20,
  },
  planTitle: {
    color: '#F8FAFC',
    fontSize: 14.5,
    fontWeight: 'bold',
  },
  planSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  attrBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  attrBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  planDesc: {
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 17,
  },
  planFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  metaBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  selectBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    marginLeft: 'auto',
  },
  selectBtnActive: {
    backgroundColor: '#00F0FF',
    borderColor: '#00F0FF',
  },
  selectBtnText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectBtnTextActive: {
    color: '#0A0A0F',
  },

  // Mazmorra IA & Asalto Semanal
  dungeonContainer: {
    gap: 16,
  },
  dungeonIntroCard: {
    backgroundColor: '#0F121E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    gap: 12,
  },
  dungeonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dungeonTitleWrapper: {
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
  dungeonManaBadgeUnlimited: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  dungeonManaBadgeUnlimitedText: {
    color: '#F59E0B',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dungeonManaBadgeStandard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  dungeonManaBadgeStandardText: {
    color: '#00F0FF',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dungeonTitle: {
    color: '#F8FAFC',
    fontSize: 15.5,
    fontWeight: 'bold',
  },
  dungeonSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusCard: {
    width: '48.5%',
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  focusCardSelected: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  focusLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 'bold',
  },
  focusLabelSelected: {
    color: '#00F0FF',
  },
  focusDuration: {
    color: '#64748B',
    fontSize: 10,
  },
  invokeBtn: {
    backgroundColor: '#00F0FF',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invokeBtnText: {
    color: '#0A0A0F',
    fontSize: 13,
    fontWeight: 'bold',
  },
  generatedWorkoutBox: {
    backgroundColor: '#0F121E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    gap: 12,
  },
  workoutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutMainTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  workoutRewardText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  reRollBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  exerciseSection: {
    gap: 8,
  },
  phaseHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  exIndexCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exIndexText: {
    color: '#00F0FF',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  exThumbMini: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  exName: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  exDetails: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 2,
  },
  cortexTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  cortexTipText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
  },
  startDungeonCircuitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00F0FF',
    borderRadius: 14,
    paddingVertical: 12,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  startDungeonCircuitText: {
    color: '#0A0A0F',
    fontSize: 12.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Boss Raid / Puerta Roja (Estilo Anime Solo Leveling)
  bossTeaserBanner: {
    backgroundColor: '#0F121E',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    marginBottom: 4,
  },
  bossTeaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bossTeaserIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bossTeaserEmoji: {
    fontSize: 22,
  },
  bossTeaserTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  bossTeaserTag: {
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  bossXpMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bossXpMiniText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  bossTeaserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  bossTeaserSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  bossCard: {
    backgroundColor: '#0D0E17',
    borderWidth: 2,
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  bossBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bossTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bossTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  bossRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  bossRewardText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bossHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bossAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#161824',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  bossEmoji: {
    fontSize: 26,
  },
  bossName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bossTitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 2,
  },
  bossHpContainer: {
    gap: 4,
  },
  bossHpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bossHpLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  bossHpValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  bossHpTrack: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  bossHpFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  bossLoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#EF4444',
    gap: 2,
  },
  bossLore: {
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  bossStationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bossStationsText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  bossBattleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  bossBattleBtnText: {
    color: '#0A0A0F',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  bossCountdownBox: {
    backgroundColor: '#121422',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  bossCountdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  bossCountdownLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  bossCountdownClock: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginVertical: 2,
  },
  bossCountdownSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 1,
  },
  newWeekOpportunityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  newWeekOpportunityText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
  },
  bossDefeatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  bossDefeatedBannerText: {
    flex: 1,
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  bossDefeatedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  bossDefeatedButtonText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  bossLockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E2433',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bossLockedBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  recoveryCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0F121E',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 18,
    padding: 14,
  },
  recoveryCardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryCardTitle: {
    color: '#10B981',
    fontSize: 13.5,
    fontWeight: 'bold',
  },
  recoveryCardSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },

  smartwatchWorkoutBanner: {
    backgroundColor: '#0F121E',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  smartwatchWorkoutBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smartwatchWorkoutBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  smartwatchWorkoutBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  smartwatchWorkoutMetricsTag: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  smartwatchWorkoutTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  smartwatchWorkoutDiagnosis: {
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 16,
  },
  smartwatchWorkoutLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 4,
  },
  smartwatchWorkoutLaunchBtnText: {
    color: '#07090E',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // ================= CORTEX HERO BANNER & PRESCRIPCIÓN =================
  cortexHeroBanner: {
    backgroundColor: '#0A0F1D',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    gap: 12,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cortexHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cortexSystemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cortexSystemTag: {
    color: '#00F0FF',
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  cortexRecalibratePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  cortexRecalibratePillText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cortexHeroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cortexPlanEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  cortexHeroTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cortexHeroSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  cortexSpeechBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#00F0FF',
    gap: 4,
  },
  cortexSpeechHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cortexSpeechSender: {
    color: '#00F0FF',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  cortexOverriddenBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  cortexOverriddenText: {
    color: '#F59E0B',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cortexSpeechText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  cortexPrescriptionChain: {
    flexDirection: 'row',
    backgroundColor: '#070A14',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  prescriptionStep: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  prescriptionStepLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  prescriptionStepVal: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  prescriptionDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cortexLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00F0FF',
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  cortexLaunchBtnText: {
    color: '#07090E',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // Cabecera Catálogo de Protocolos
  catalogSectionHeader: {
    marginTop: 6,
    gap: 2,
  },
  catalogTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  catalogTitleText: {
    color: '#00F0FF',
    fontSize: 12.5,
    fontWeight: 'bold',
    letterSpacing: 0.7,
  },
  catalogCountBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  catalogCountBadgeText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  catalogSubtitleText: {
    color: '#94A3B8',
    fontSize: 10.5,
  },

  // Modal de Re-Calibración
  recalibrateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  recalibrateModalContent: {
    backgroundColor: '#0B0E17',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderTopColor: '#00F0FF',
    maxHeight: '80%',
    padding: 18,
    gap: 12,
  },
  recalibrateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recalibrateModalTitle: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  recalibrateCloseBtn: {
    padding: 4,
  },
  recalibrateModalDesc: {
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 16,
  },
  recalibrateList: {
    maxHeight: 400,
  },
  recalibrateOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F1322',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  recalibrateOptionEmoji: {
    fontSize: 22,
  },
  recalibrateOptionLabel: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  recalibrateOptionDesc: {
    color: '#64748B',
    fontSize: 10.5,
  },
});
