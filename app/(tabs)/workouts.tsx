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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import {
  resolveExerciseGuide,
  validateAndAdaptCircuit,
  adaptCircuitForUser,
  searchExercises,
  type DatasetExercise,
} from '../../constants/exercises';
import { ExerciseMedia } from '../../components/ui/ExerciseMedia';
import { QuestDetailModal } from '../../components/gamification/QuestDetailModal';
import type { Quest } from '../../components/gamification/QuestCard';
import { type CircuitExercise, getPlanDayCircuit } from '../../constants/plans';
import {
  getCurrentWeeklyBoss,
  isBossRaidAvailable,
  getBossCountdown,
  getCurrentWeekKey,
  type BossCountdown,
} from '../../constants/bosses';
import { useAchievementStore } from '../../stores/achievementStore';
import { Haptics } from '../../services/haptics';
import { RecoveryModal } from '../../components/recovery/RecoveryModal';
import { useSmartwatchStore } from '../../stores/smartwatchStore';
import { SMARTWATCH_BRANDS } from '../../constants/smartwatch';
import { useCortexEnergyStore } from '../../stores/cortexEnergyStore';
import { CortexKeyModal } from '../../components/ai/CortexKeyModal';
import type { UserContext } from '../../services/gemini';

const WORKOUT_TYPES = [
  { id: 'full', label: 'Full Body', icon: 'barbell-outline', duration: 30, focus: 'Cuerpo Completo' },
  { id: 'upper', label: 'Tren Superior', icon: 'shield-outline', duration: 25, focus: 'Pecho, Espalda y Brazos' },
  { id: 'lower', label: 'Pierna & Glúteos', icon: 'walk-outline', duration: 25, focus: 'Cuádriceps y Cadera' },
  { id: 'cardio', label: 'Cardio Hunter', icon: 'flash-outline', duration: 20, focus: 'HIIT Metabólico' },
  { id: 'core', label: 'Fuerza de Core', icon: 'locate-outline', duration: 15, focus: 'Abdomen y Transverso' },
  { id: 'flexibility', label: 'Movilidad & Yoga', icon: 'body-outline', duration: 20, focus: 'Flexibilidad y Descanso' },
];

const BODY_PARTS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'chest', label: 'Pecho' },
  { id: 'back', label: 'Espalda' },
  { id: 'upper arms', label: 'Brazos' },
  { id: 'upper legs', label: 'Piernas' },
  { id: 'shoulders', label: 'Hombros' },
  { id: 'waist', label: 'Core / Abdomen' },
  { id: 'cardio', label: 'Cardio' },
];

const EQUIPMENT_FILTERS = [
  { id: 'all', label: 'Todo el Equipo' },
  { id: 'none', label: 'Sin Equipo' },
  { id: 'dumbbells', label: 'Mancuernas' },
  { id: 'barbell', label: 'Barra' },
  { id: 'resistance_band', label: 'Bandas' },
  { id: 'gym', label: 'Gimnasio' },
];

export default function WorkoutsScreen() {
  const { user, addXP } = useUserStore();
  const { unlockAchievement } = useAchievementStore();
  const currentBoss = getCurrentWeeklyBoss();
  const {
    activePlanId,
    completedDayNumbers,
    setActivePlan,
    completePlanDay,
    alarmSettings,
    getActivePlan,
  } = usePlanStore();

  const [activeTab, setActiveTab] = useState<'plans' | 'custom' | 'arsenal'>('plans');
  const [selectedPlanCategory, setSelectedPlanCategory] = useState<PlanType | 'all'>('all');
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);
  const [showCircuitModal, setShowCircuitModal] = useState(false);
  const [circuitDayNumber, setCircuitDayNumber] = useState(1);

  // Arsenal / Catálogo de 1,324 Ejercicios
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBodyPart, setFilterBodyPart] = useState('all');
  const [filterEquipment, setFilterEquipment] = useState('all');
  const [selectedCatalogExercise, setSelectedCatalogExercise] = useState<DatasetExercise | null>(null);

  const filteredExercises = searchExercises(searchQuery, {
    bodyPart: filterBodyPart !== 'all' ? filterBodyPart : undefined,
    equipment: filterEquipment !== 'all' ? (filterEquipment as any) : undefined,
  });

  // Custom AI Dungeon state
  const [selectedType, setSelectedType] = useState<string | null>('full');
  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState<any>(null);
  const [dungeonCircuit, setDungeonCircuit] = useState<CustomCircuitData | null>(null);
  const [showDungeonModal, setShowDungeonModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [bossCountdown, setBossCountdown] = useState<BossCountdown>(getBossCountdown());
  const [isBossDefeatedThisWeek, setIsBossDefeatedThisWeek] = useState(false);
  const currentWeekKey = getCurrentWeekKey();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const { dailyManaRemaining, isUnlimited, initialize: initEnergy } = useCortexEnergyStore();

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initEnergy();
  }, [initEnergy]);

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
    const timer = setInterval(() => {
      setBossCountdown(getBossCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      AsyncStorage.getItem(`@fitrise_boss_defeated_${user.uid}_${currentWeekKey}`).then((val) => {
        setIsBossDefeatedThisWeek(val === 'true');
      });
    }
  }, [user?.uid, currentWeekKey]);

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
    if (isBossRaid && user?.uid) {
      await unlockAchievement('boss_weekly_slayer', user.uid);
      await AsyncStorage.setItem(`@fitrise_boss_defeated_${user.uid}_${currentWeekKey}`, 'true');
      setIsBossDefeatedThisWeek(true);
    }
    Haptics.triumph();
    setShowDungeonModal(false);
    setWorkout(null);
    setDungeonCircuit(null);
    Alert.alert(
      isBossRaid ? '¡Jefe de Mazmorra Derrotado! 👑' : '¡Mazmorra Conquistada! 🏆',
      isBossRaid
        ? `Has derrotado a ${currentBoss.name} en el fin de semana de asalto. El Sistema CORTEX te otorga +${xpReward} XP y el logro "Cazador de Jefes".`
        : `Has obtenido +${xpReward} XP del Sistema CORTEX.`
    );
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
    Alert.alert('Plan Activado ⚡', `Has seleccionado "${plan.title}". CORTEX coordinará tu telemetría y alarmas.`);
  };

  const handleToggleDayComplete = async (dayNumber: number, xpReward: number) => {
    if (completedDayNumbers.includes(dayNumber)) return;
    await completePlanDay(dayNumber);
    Alert.alert('¡Día Conquistado! ⚔️', `Sumaste +${xpReward} XP a tu progreso.`);
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

  const handleOpenCircuit = (dayNum?: number) => {
    const targetDay = dayNum ?? (nextPendingDay?.dayNumber || 1);
    setCircuitDayNumber(targetDay);
    setShowCircuitModal(true);
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
    <SafeAreaView style={styles.safe}>
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

      {/* Switcher Táctico de 3 Pestañas con Estética Anime */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'plans' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('plans')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="layers-outline"
            size={15}
            color={activeTab === 'plans' ? '#0A0A0F' : '#94A3B8'}
          />
          <Text style={[styles.topTabText, activeTab === 'plans' && styles.topTabTextActive]}>
            [ ⚔️ Programas ]
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'custom' && styles.topTabBtnActiveBoss]}
          onPress={() => setActiveTab('custom')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="skull-outline"
            size={15}
            color={activeTab === 'custom' ? '#FFFFFF' : '#94A3B8'}
          />
          <Text style={[styles.topTabText, activeTab === 'custom' && styles.topTabTextActiveBoss]}>
            [ 👑 Asalto / Mazmorra ]
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'arsenal' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('arsenal')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="book-outline"
            size={15}
            color={activeTab === 'arsenal' ? '#0A0A0F' : '#94A3B8'}
          />
          <Text style={[styles.topTabText, activeTab === 'arsenal' && styles.topTabTextActive]}>
            [ 📜 Arsenal (1,324) ]
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
            {/* Tarjeta Hero: Plan Activo (Estética idéntica a Misiones Diarias) */}
            {activePlan ? (
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
            ) : (
              <View style={styles.noPlanCard}>
                <View style={styles.noPlanIconBox}>
                  <Ionicons name="compass-outline" size={26} color="#00F0FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noPlanTitle}>[ SIN PROGRAMA ACTIVO ]</Text>
                  <Text style={styles.noPlanDesc}>
                    Elige un programa táctico abajo para calibrar tus entrenamientos y ganar XP de cazador.
                  </Text>
                </View>
              </View>
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

            {/* Categorías de Filtro Rápidas con Estilo Anime */}
            <View style={styles.categoryPillsRow}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'daily', label: 'Diarios ⚡' },
                { id: 'weekly', label: 'Semanales 🛡️' },
                { id: 'monthly', label: 'Mensuales 👑' },
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
                  4 estaciones de estiramiento y calma neural • +25 XP Vitalidad
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#10B981" />
            </TouchableOpacity>
          </>
        )}

        {/* ================= PESTAÑA 2: MAZMORRA IA & ASALTO SEMANAL ================= */}
        {activeTab === 'custom' && (
          <View style={styles.dungeonContainer}>
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
                    {isBossDefeatedThisWeek
                      ? '👑 ASALTO SEMANAL CONQUISTADO'
                      : bossCountdown.isAvailable
                      ? '🚨 PUERTA ROJA: ASALTO AL MONARCA'
                      : '🔒 ASALTO BLOQUEADO (FIN DE SEMANA)'}
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
              {isBossDefeatedThisWeek ? (
                <View style={styles.bossDefeatedButton}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.bossDefeatedButtonText}>MONARCA DERROTADO ESTA SEMANA</Text>
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

        {/* ================= PESTAÑA 3: ARSENAL CORTEX (1,324 EJERCICIOS) ================= */}
        {activeTab === 'arsenal' && (
          <View style={styles.arsenalContainer}>
            {/* Buscador en Vivo */}
            <View style={styles.arsenalSearchBox}>
              <Ionicons name="search" size={18} color="#00F0FF" />
              <TextInput
                style={styles.arsenalSearchInput}
                placeholder="Buscar técnica, músculo o ejercicio..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filtros por Grupo Muscular */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
              {BODY_PARTS_FILTERS.map((f) => {
                const isSelected = filterBodyPart === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.arsenalFilterChip, isSelected && styles.arsenalFilterChipActive]}
                    onPress={() => setFilterBodyPart(f.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.arsenalFilterChipText, isSelected && styles.arsenalFilterChipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Filtros por Equipamiento */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
              {EQUIPMENT_FILTERS.map((f) => {
                const isSelected = filterEquipment === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.arsenalFilterChip, isSelected && styles.arsenalFilterChipActive]}
                    onPress={() => setFilterEquipment(f.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.arsenalFilterChipText, isSelected && styles.arsenalFilterChipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Banner de Contador del Arsenal */}
            <View style={styles.arsenalCountCard}>
              <View style={styles.arsenalCountHeader}>
                <Ionicons name="hardware-chip" size={16} color="#00F0FF" />
                <Text style={styles.arsenalCountTitle}>
                  [ {filteredExercises.length} TÉCNICAS BIOMECÁNICAS DISPONIBLES ]
                </Text>
              </View>
              <Text style={styles.arsenalCountSubtitle}>
                Streaming CDN con Caché Local en Disco • Animaciones GIF HD
              </Text>
            </View>

            {/* Grid / Lista de Ejercicios en Formato QuestItem */}
            <View style={styles.arsenalGrid}>
              {filteredExercises.slice(0, 40).map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.arsenalCard}
                  onPress={() => setSelectedCatalogExercise(ex)}
                  activeOpacity={0.75}
                >
                  <ExerciseMedia
                    gifUrl={ex.cdnGifUrl}
                    rawGifUrl={ex.rawGifUrl}
                    thumbnailUrl={ex.thumbnailUrl}
                    style={styles.arsenalThumb}
                    resizeMode="contain"
                  />
                  <View style={styles.arsenalCardContent}>
                    <Text style={styles.arsenalCardTitle} numberOfLines={1}>
                      {ex.name.charAt(0).toUpperCase() + ex.name.slice(1)}
                    </Text>
                    <Text style={styles.arsenalCardMuscle} numberOfLines={1}>
                      🎯 {ex.target.toUpperCase()} • {ex.body_part}
                    </Text>
                    <View style={styles.arsenalBadgesRow}>
                      <View style={styles.arsenalBadgeEq}>
                        <Text style={styles.arsenalBadgeEqText}>{ex.equipment}</Text>
                      </View>
                      <View style={styles.arsenalBadgeRank}>
                        <Text style={styles.arsenalBadgeRankText}>{ex.rank}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.questRewardPill}>
                    <Text style={styles.questRewardPillText}>+{ex.xpReward} XP</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>
              ))}
            </View>
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

      {/* Modal Táctico para Explorar Ejercicio del Arsenal */}
      {selectedCatalogExercise && (
        <QuestDetailModal
          quest={{
            id: selectedCatalogExercise.id,
            title: selectedCatalogExercise.name.charAt(0).toUpperCase() + selectedCatalogExercise.name.slice(1),
            description: selectedCatalogExercise.steps[0] || 'Protocolo biomecánico CORTEX',
            category: 'exercise',
            icon: '⚔️',
            xpReward: selectedCatalogExercise.xpReward,
            completed: false,
            exerciseName: selectedCatalogExercise.name,
            targetMuscles: [selectedCatalogExercise.target, ...selectedCatalogExercise.secondary_muscles],
            sets: selectedCatalogExercise.baseSets,
            reps: selectedCatalogExercise.baseReps,
            difficulty: selectedCatalogExercise.rank,
            instructions: selectedCatalogExercise.steps,
            cortexAdvice: `Directriz CORTEX: concéntrate en el control excéntrico y la técnica estricta de ${selectedCatalogExercise.target}.`,
          }}
          visible={!!selectedCatalogExercise}
          onClose={() => setSelectedCatalogExercise(null)}
          onComplete={async () => {
            await addXP(selectedCatalogExercise.xpReward);
            setSelectedCatalogExercise(null);
            Alert.alert(
              '¡Técnica Asimilada!',
              `Has recibido +${selectedCatalogExercise.xpReward} XP por dominar este ejercicio biomecánico.`
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

  // Arsenal (1,324 Ejercicios)
  arsenalContainer: {
    gap: 12,
  },
  arsenalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F121E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  arsenalSearchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
  },
  filterChipScroll: {
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 2,
  },
  arsenalFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#0F121E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  arsenalFilterChipActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: '#00F0FF',
  },
  arsenalFilterChipText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  arsenalFilterChipTextActive: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  arsenalCountCard: {
    backgroundColor: '#0F121E',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    gap: 2,
  },
  arsenalCountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arsenalCountTitle: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  arsenalCountSubtitle: {
    color: '#64748B',
    fontSize: 10,
  },
  arsenalGrid: {
    gap: 8,
  },
  arsenalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F121E',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  arsenalThumb: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#050711',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  arsenalCardContent: {
    flex: 1,
    gap: 2,
  },
  arsenalCardTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold',
  },
  arsenalCardMuscle: {
    color: '#94A3B8',
    fontSize: 10.5,
  },
  arsenalBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  arsenalBadgeEq: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  arsenalBadgeEqText: {
    color: '#CBD5E1',
    fontSize: 9,
    textTransform: 'capitalize',
  },
  arsenalBadgeRank: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  arsenalBadgeRankText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
