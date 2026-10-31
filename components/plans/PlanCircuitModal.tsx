import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CortexVoice } from '../../services/cortexVoice';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import {
  EXERCISE_GUIDES,
  resolveExerciseGuide,
  validateAndAdaptCircuit,
  adaptCircuitForUser,
  type ExerciseGuide,
} from '../../constants/exercises';
import { ExerciseMedia } from '../ui/ExerciseMedia';
import {
  type TrainingPlan,
  type CircuitExercise,
  getPlanDayCircuit,
} from '../../constants/plans';
import { useProgressStore } from '../../stores/progressStore';
import { useUserStore } from '../../stores/userStore';
import { Haptics } from '../../services/haptics';
import { SoundEffects } from '../../services/soundEffects';
import { RecoveryModal } from '../recovery/RecoveryModal';

export interface CustomCircuitData {
  title: string;
  subtitle?: string;
  duration: number;
  xpReward: number;
  circuit: CircuitExercise[];
  emoji?: string;
}

export interface PlanCircuitModalProps {
  visible: boolean;
  plan?: TrainingPlan | null;
  dayNumber?: number;
  customCircuit?: CustomCircuitData | null;
  autoStart?: boolean;
  onClose: () => void;
  onCompleteDay: (dayNumber: number, xpReward: number) => void;
}

type ModalView = 'overview' | 'workout' | 'rest' | 'celebration';

export function PlanCircuitModal({
  visible,
  plan,
  dayNumber = 1,
  customCircuit,
  autoStart = false,
  onClose,
  onCompleteDay,
}: PlanCircuitModalProps) {
  if (!visible || (!plan && !customCircuit)) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <PlanCircuitContent
        plan={plan}
        dayNumber={dayNumber}
        customCircuit={customCircuit}
        autoStart={autoStart}
        onClose={onClose}
        onCompleteDay={onCompleteDay}
      />
    </Modal>
  );
}

function PlanCircuitContent({
  plan,
  dayNumber,
  customCircuit,
  autoStart,
  onClose,
  onCompleteDay,
}: {
  plan?: TrainingPlan | null;
  dayNumber: number;
  customCircuit?: CustomCircuitData | null;
  autoStart?: boolean;
  onClose: () => void;
  onCompleteDay: (dayNumber: number, xpReward: number) => void;
}) {
  const isCustom = !!customCircuit;
  const daySchedule = !isCustom && plan
    ? plan.daysSchedule.find((d) => d.dayNumber === dayNumber) || plan.daysSchedule[0]
    : null;

  const circuitTitle = isCustom
    ? customCircuit.title
    : `Día ${dayNumber}: ${daySchedule?.title || ''}`;
  const badgeTitle = isCustom
    ? `${customCircuit.emoji || '⚡'} MAZMORRA IA CORTEX`
    : `${plan?.emoji || '⚔️'} ${plan?.title.toUpperCase() || ''}`;
  const planName = isCustom ? 'Mazmorra IA' : plan?.title || 'Plan Táctico';
  const duration = isCustom ? customCircuit.duration : daySchedule?.duration || 25;
  const xpReward = isCustom ? customCircuit.xpReward : daySchedule?.xpReward || 150;

  const { user } = useUserStore();
  const userProfile = {
    fitnessLevel: user?.fitnessLevel || 'beginner',
    level: user?.level || 1,
    equipment: user?.equipment || ['none'],
  };

  const rawCircuit = isCustom
    ? customCircuit.circuit
    : plan
    ? getPlanDayCircuit(plan, dayNumber, userProfile)
    : [];

  // Adaptación integral: filtra equipo, aplica regresiones/asistencias para principiantes y escala series/reps por nivel
  const circuit = adaptCircuitForUser(rawCircuit, userProfile);

  // Estados de navegación
  const [view, setView] = useState<ModalView>('overview');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);

  // Estado del ejercicio activo (memorizado para evitar re-creación continua de objetos)
  const activeExercise: CircuitExercise | undefined = circuit[currentExerciseIndex] || circuit[0];
  const guide: ExerciseGuide = useMemo(() => {
    return resolveExerciseGuide(activeExercise?.id || activeExercise?.name || 'pushups');
  }, [activeExercise?.id, activeExercise?.name]);

  // Entrenador de cadencia y briefing
  const [isCadenceActive, setIsCadenceActive] = useState(false);
  const [isBriefing, setIsBriefing] = useState(false);
  const [activeBriefingStep, setActiveBriefingStep] = useState<number | null>(null);
  const circuitTourActiveRef = useRef(false);
  const [cadencePhase, setCadencePhase] = useState<'down' | 'hold' | 'up'>('down');
  const [secondsLeft, setSecondsLeft] = useState<number>(guide.cadence.down);
  const [currentReps, setCurrentReps] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Referencias mutables para el motor de cadencia continuo libre de bloqueos
  const circuitPhaseRef = useRef<'down' | 'hold' | 'up'>('down');
  const circuitSecondsRef = useRef<number>(guide.cadence.down);
  const circuitRepsRef = useRef<number>(0);

  // Estado de la pausa de descanso de 20 segundos
  const [restSecondsLeft, setRestSecondsLeft] = useState(20);
  const [showRecovery, setShowRecovery] = useState(false);

  // Animaciones
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const restPulseAnim = useRef(new Animated.Value(1)).current;

  // Síntesis de voz natural humana CORTEX
  const speakRobot = (text: string, onDone?: () => void) => {
    if (!isVoiceEnabled) {
      if (onDone) onDone();
      return;
    }
    CortexVoice.speak(text, {
      onDone,
      onError: onDone,
    });
  };

  // Detener voz al desmontar
  useEffect(() => {
    return () => {
      CortexVoice.stop();
    };
  }, []);

  // Animación del escáner láser holográfico
  useEffect(() => {
    const scanner = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    scanner.start();
    pulse.start();
    return () => {
      scanner.stop();
      pulse.stop();
    };
  }, []);

  // Iniciar el ejercicio con la locución de briefing guiada paso a paso
  const startExercise = (index: number) => {
    circuitTourActiveRef.current = false;
    CortexVoice.stop();
    setCurrentExerciseIndex(index);
    setCurrentReps(0);
    circuitRepsRef.current = 0;
    circuitPhaseRef.current = 'down';
    setCadencePhase('down');

    const targetEx = circuit[index];
    const targetGuide = resolveExerciseGuide(targetEx.id);
    circuitSecondsRef.current = targetGuide.cadence.down;
    setSecondsLeft(targetGuide.cadence.down);

    setView('workout');
    setIsCadenceActive(false);
    setIsBriefing(true);
    setActiveBriefingStep(0);

    const steps = targetGuide.steps && targetGuide.steps.length > 0 ? targetGuide.steps : ['Mantén la postura firme y alineada'];

    if (!isVoiceEnabled) return;

    circuitTourActiveRef.current = true;
    const playStep = (stepIdx: number) => {
      if (!circuitTourActiveRef.current) return;
      if (stepIdx >= steps.length) {
        setActiveBriefingStep(null);
        circuitTourActiveRef.current = false;
        speakRobot('¡Técnica explicada! Iniciamos el protocolo de ritmo.', () => {
          skipBriefingAndStart();
        });
        return;
      }

      setActiveBriefingStep(stepIdx);
      const textToSpeak = `Paso ${stepIdx + 1}: ${steps[stepIdx]}`;
      speakRobot(textToSpeak, () => {
        if (!circuitTourActiveRef.current) return;
        setTimeout(() => {
          if (!circuitTourActiveRef.current) return;
          playStep(stepIdx + 1);
        }, 700);
      });
    };

    playStep(0);
  };

  const skipBriefingAndStart = () => {
    circuitTourActiveRef.current = false;
    CortexVoice.stop();
    setIsBriefing(false);
    setActiveBriefingStep(null);
    circuitPhaseRef.current = 'down';
    circuitSecondsRef.current = guide.cadence.down;
    circuitRepsRef.current = 0;
    setCadencePhase('down');
    setSecondsLeft(guide.cadence.down);
    setCurrentReps(0);
    setIsCadenceActive(true);
    if (isVoiceEnabled) {
      speakRobot('¡Iniciamos el ritmo! Sigue la cadencia.');
    }
  };

  const handleSpeakCircuitStep = (stepIndex: number) => {
    circuitTourActiveRef.current = false;
    setActiveBriefingStep(stepIndex);
    CortexVoice.stop();
    const steps = guide.steps && guide.steps.length > 0 ? guide.steps : ['Mantén la postura'];
    if (steps[stepIndex]) {
      speakRobot(`Paso ${stepIndex + 1}: ${steps[stepIndex]}`, () => {
        setActiveBriefingStep(null);
      });
    }
  };

  const toggleCircuitCadencePause = () => {
    if (isCadenceActive) {
      setIsCadenceActive(false);
      CortexVoice.stop();
      speakRobot('Ritmo pausado.');
    } else {
      setIsCadenceActive(true);
      speakRobot('Reanudando ritmo.');
    }
  };

  // Locución clara y espaciada al completar cada repetición
  const announceCircuitRep = (rep: number, target: number) => {
    if (rep === 1) {
      speakRobot('Repetición 1');
    } else if (rep === Math.floor(target / 2)) {
      speakRobot(`${rep}. Mitad del objetivo.`);
    } else if (rep === target - 2) {
      speakRobot(`${rep}. ¡Dos más!`);
    } else if (rep === target - 1) {
      speakRobot('¡Última repetición!');
    } else {
      speakRobot(`${rep}`);
    }
  };

  // Motor de Cadencia (segundo a segundo) - Continuo y libre de bloqueos
  useEffect(() => {
    if (view !== 'workout' || !isCadenceActive) return;

    if (circuitSecondsRef.current <= 0) {
      circuitSecondsRef.current = guide.cadence.down;
      setSecondsLeft(guide.cadence.down);
    }

    const interval = setInterval(() => {
      circuitSecondsRef.current -= 1;

      if (circuitSecondsRef.current <= 0) {
        if (circuitPhaseRef.current === 'down') {
          circuitPhaseRef.current = 'hold';
          circuitSecondsRef.current = guide.cadence.hold;
          setCadencePhase('hold');
          setSecondsLeft(guide.cadence.hold);
          Haptics.medium();
        } else if (circuitPhaseRef.current === 'hold') {
          circuitPhaseRef.current = 'up';
          circuitSecondsRef.current = guide.cadence.up;
          setCadencePhase('up');
          setSecondsLeft(guide.cadence.up);
          Haptics.medium();
        } else {
          // Fase 'up' completada -> repetición terminada
          const nextRep = circuitRepsRef.current + 1;
          circuitRepsRef.current = nextRep;
          setCurrentReps(nextRep);
          Haptics.heavy();

          if (nextRep >= activeExercise.targetCount) {
            setIsCadenceActive(false);
            circuitPhaseRef.current = 'down';
            circuitSecondsRef.current = guide.cadence.down;
            handleExerciseCompleted();
          } else {
            circuitPhaseRef.current = 'down';
            circuitSecondsRef.current = guide.cadence.down;
            setCadencePhase('down');
            setSecondsLeft(guide.cadence.down);
            announceCircuitRep(nextRep, activeExercise.targetCount);
          }
        }
      } else {
        setSecondsLeft(circuitSecondsRef.current);
        Haptics.light();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [view, isCadenceActive, activeExercise.targetCount, guide.cadence]);

  // Al completar un ejercicio -> iniciar la pausa de descanso de 20 segundos
  const handleExerciseCompleted = () => {
    CortexVoice.stop();
    setIsCadenceActive(false);
    setIsBriefing(false);

    const newCompleted = Array.from(new Set([...completedExercises, currentExerciseIndex]));
    setCompletedExercises(newCompleted);

    const isLastExercise = currentExerciseIndex >= circuit.length - 1;

    if (isLastExercise) {
      // Todo el circuito completado
      Haptics.triumph();
      SoundEffects.playLevelUp();
      setView('celebration');
      speakRobot(
        `¡Circuito Conquistado! Has superado los ${circuit.length} ejercicios con éxito absoluto. Sumas ${xpReward} puntos de experiencia.`
      );
    } else {
      // Entrar en pausa de descanso adaptada antes del siguiente ejercicio
      Haptics.success();
      SoundEffects.playChime();
      setView('rest');
      const restTime = activeExercise?.restTimeSeconds || 20;
      setRestSecondsLeft(restTime);
      speakRobot(`¡Ejercicio completado! Tómate ${restTime} segundos de descanso antes del siguiente.`);
    }
  };

  // Temporizador de descanso de 20 segundos
  useEffect(() => {
    if (view !== 'rest') return;

    const interval = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          advanceToNextExercise();
          return 0;
        }

        // Avisos vocales y hápticos en el descanso
        if (prev === 11) {
          speakRobot('10 segundos de descanso restantes. Prepárate.');
        } else if (prev === 4) {
          speakRobot('3... 2... 1...');
        }

        if (prev <= 4) {
          Haptics.medium();
          SoundEffects.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [view, currentExerciseIndex]);

  // Avanzar al siguiente ejercicio tras el descanso
  const advanceToNextExercise = () => {
    CortexVoice.stop();
    const nextIndex = currentExerciseIndex + 1;
    if (nextIndex < circuit.length) {
      startExercise(nextIndex);
    } else {
      setView('celebration');
    }
  };

  // Auto-iniciar ejercicio 1 si autoStart es true
  useEffect(() => {
    if (autoStart && circuit.length > 0) {
      startExercise(0);
    }
  }, []);

  // Reclamar recompensa y cerrar
  const handleClaimAndClose = () => {
    CortexVoice.stop();
    Haptics.triumph();
    const currentUser = useUserStore.getState().user;
    if (currentUser) {
      useProgressStore.getState().logCircuit(circuitTitle, isCustom ? 'dungeon' : 'plan', xpReward, currentUser.uid);
    }
    onCompleteDay(dayNumber, xpReward);
    onClose();
  };



  return (
    <SafeAreaView style={styles.safe}>
      {/* ================= VISTA 1: OVERVIEW DEL CIRCUITO ================= */}
      {view === 'overview' && (
        <View style={styles.viewContainer}>
          {/* Header Superior */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                CortexVoice.stop();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={Colors.text.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1, paddingHorizontal: 8 }}>
              <Text style={styles.planBadge}>{badgeTitle}</Text>
              <Text style={styles.dayTitle} numberOfLines={1}>
                {circuitTitle}
              </Text>
            </View>

            <View style={styles.xpBadge}>
              <Ionicons name="sparkles" size={13} color={Colors.brand.accent} />
              <Text style={styles.xpBadgeText}>+{xpReward} XP</Text>
            </View>
          </View>

          {/* Resumen del Circuito */}
          <View style={styles.circuitSummaryCard}>
            <View style={styles.summaryItem}>
              <Ionicons name="flash-outline" size={18} color={Colors.brand.accent} />
              <Text style={styles.summaryValue}>{circuit.length} Ejercicios</Text>
              <Text style={styles.summaryLabel}>Circuito Táctico</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={18} color="#10B981" />
              <Text style={styles.summaryValue}>{duration} min</Text>
              <Text style={styles.summaryLabel}>Tiempo Estimado</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="pause-circle-outline" size={18} color="#F59E0B" />
              <Text style={styles.summaryValue}>{activeExercise?.restTimeSeconds || 20} seg</Text>
              <Text style={styles.summaryLabel}>Descanso entre c/u</Text>
            </View>
          </View>

          {/* Badges de Calibración Táctica */}
          <View style={styles.calibrationTagsRow}>
            <View style={styles.calibTagCyan}>
              <Text style={styles.calibTagCyanText}>
                {user?.fitnessLevel === 'beginner'
                  ? '🔰 PRINCIPIANTE (ASISTIDO)'
                  : user?.fitnessLevel === 'advanced'
                  ? '👑 AVANZADO'
                  : '⚡ INTERMEDIO'}
              </Text>
            </View>
            <View style={styles.calibTagPurple}>
              <Text style={styles.calibTagPurpleText}>
                {user?.equipment?.includes('gym')
                  ? '🏟️ GIMNASIO COMPLETO'
                  : user?.equipment?.includes('dumbbells') || user?.equipment?.includes('barbell')
                  ? '🏋️ MANCUERNAS / BARRA'
                  : '🏠 PESO CORPORAL'}
              </Text>
            </View>
            <View style={styles.calibTagGreen}>
              <Text style={styles.calibTagGreenText}>
                NIVEL {user?.level || 1} • {activeExercise?.sets || 3} SERIES
              </Text>
            </View>
          </View>

          {/* Lista de Ejercicios del Circuito */}
          <Text style={styles.sectionHeader}>ESTACIONES DEL CIRCUITO</Text>

          <ScrollView style={styles.circuitList} showsVerticalScrollIndicator={false}>
            {circuit.map((ex, idx) => {
              const isDone = completedExercises.includes(idx);
              const isNext = !isDone && (idx === 0 || completedExercises.includes(idx - 1));
              const exGuide = resolveExerciseGuide(ex.id || ex.imageKey);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.circuitItemCard,
                    isDone && styles.circuitItemCardDone,
                    isNext && styles.circuitItemCardNext,
                  ]}
                  onPress={() => startExercise(idx)}
                  activeOpacity={0.8}
                >
                  {/* Badge de Número */}
                  <View
                    style={[
                      styles.circuitIndexBadge,
                      isDone && styles.circuitIndexBadgeDone,
                      isNext && styles.circuitIndexBadgeNext,
                    ]}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.circuitIndexText,
                          isNext && styles.circuitIndexTextNext,
                        ]}
                      >
                        {idx + 1}
                      </Text>
                    )}
                  </View>

                  {/* Miniatura Biomecánica del Ejercicio */}
                  <ExerciseMedia
                    gifUrl={exGuide.cdnGifUrl}
                    rawGifUrl={exGuide.rawGifUrl}
                    thumbnailUrl={exGuide.thumbnailUrl}
                    style={styles.circuitThumb}
                    resizeMode="cover"
                  />

                  {/* Datos del Ejercicio */}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[
                        styles.circuitExName,
                        isDone && styles.circuitExNameDone,
                      ]}
                      numberOfLines={1}
                    >
                      {ex.name}
                    </Text>
                    <Text style={styles.circuitExReps}>{ex.repsLabel} • Descanso: 20s</Text>
                    <Text style={styles.circuitExMuscles}>
                      {ex.muscles.join(' • ')}
                    </Text>
                  </View>

                  {/* Estado / Acción */}
                  <View style={styles.circuitExAction}>
                    {isDone ? (
                      <Text style={styles.doneText}>✓ Listo</Text>
                    ) : (
                      <Ionicons
                        name={isNext ? 'play-circle' : 'chevron-forward'}
                        size={22}
                        color={isNext ? Colors.brand.accent : Colors.text.muted}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Botón Principal de Inicio de Circuito */}
          <View style={styles.footerAction}>
            <TouchableOpacity
              style={styles.mainStartBtn}
              onPress={() => {
                // Iniciar en el primer ejercicio pendiente
                const firstPending = circuit.findIndex((_, idx) => !completedExercises.includes(idx));
                startExercise(firstPending !== -1 ? firstPending : 0);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={20} color="#0A0A0F" />
              <Text style={styles.mainStartBtnText}>
                {completedExercises.length === 0
                  ? 'INICIAR CIRCUITO'
                  : `CONTINUAR CIRCUITO (${completedExercises.length}/${circuit.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================= VISTA 2: EJERCICIO ACTIVO EN CIRCUITO ================= */}
      {view === 'workout' && (
        <View style={styles.viewContainer}>
          {/* Barra Superior con Progreso del Circuito */}
          <View style={styles.workoutHeaderRow}>
            <TouchableOpacity
              style={styles.smallBackBtn}
              onPress={() => {
                CortexVoice.stop();
                setIsCadenceActive(false);
                setIsBriefing(false);
                setView('overview');
              }}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.stationCounterText}>
                ESTACIÓN {currentExerciseIndex + 1} DE {circuit.length}
              </Text>
              <Text style={styles.workoutExTitle} numberOfLines={1}>
                {activeExercise.name}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.voiceToggleBtn}
              onPress={() => {
                if (isVoiceEnabled) {
                  CortexVoice.stop();
                  setIsVoiceEnabled(false);
                } else {
                  setIsVoiceEnabled(true);
                  speakRobot('Voz activada.');
                }
              }}
            >
              <Ionicons
                name={isVoiceEnabled ? 'volume-high' : 'volume-mute'}
                size={18}
                color={isVoiceEnabled ? Colors.brand.accent : Colors.text.muted}
              />
            </TouchableOpacity>
          </View>

          {/* Barra de progreso de estaciones */}
          <View style={styles.circuitProgressBarTrack}>
            <View
              style={[
                styles.circuitProgressBarFill,
                {
                  width: `${((currentExerciseIndex + 1) / circuit.length) * 100}%`,
                },
              ]}
            />
          </View>

          <ScrollView contentContainerStyle={styles.workoutScrollContent} showsVerticalScrollIndicator={false}>
            {/* Video / GIF Biomecánico del Ejercicio con Escáner Láser */}
            <View style={styles.robotImageWrapper}>
              <ExerciseMedia
                gifUrl={guide.cdnGifUrl}
                rawGifUrl={guide.rawGifUrl}
                thumbnailUrl={guide.thumbnailUrl}
                style={styles.robotImage}
                resizeMode="contain"
              />

              {/* Escáner Láser Animado */}
              <Animated.View
                style={[
                  styles.laserScannerLine,
                  {
                    transform: [
                      {
                        translateY: scanAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 265],
                        }),
                      },
                    ],
                  },
                ]}
              />

              {/* HUD Superior */}
              <View style={styles.hologramHeaderOverlay}>
                <View style={styles.hologramLivePill}>
                  <Animated.View style={[styles.hologramLiveDot, { opacity: pulseAnim }]} />
                  <Text style={styles.hologramLiveText}>ANDROIDE BIOMECÁNICO</Text>
                </View>
                <Text style={styles.hologramAngleText}>
                  CADENCIA: {guide.cadence.down}-{guide.cadence.hold}-{guide.cadence.up}s
                </Text>
              </View>

              {/* HUD Inferior con Métricas */}
              <View style={styles.hologramMetricsRow}>
                {guide.jointMetrics.slice(0, 2).map((m, i) => (
                  <View key={i} style={styles.jointMetricItem}>
                    <Text style={styles.jointMetricLabel}>{m.label}</Text>
                    <Text style={styles.jointMetricTarget}>{m.target}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Banner de Briefing o Panel de Cadencia */}
            {isBriefing ? (
              <View style={styles.briefingContainer}>
                <View style={styles.briefingNoticeCard}>
                  <View style={styles.briefingTop}>
                    <Ionicons name="sparkles" size={18} color={Colors.brand.accent} />
                    <Text style={styles.briefingNoticeTitle}>
                      CORTEX explicando técnica ({((activeBriefingStep ?? 0) + 1)}/{guide.steps.length})
                    </Text>
                  </View>
                  <Text style={styles.briefingNoticeSub}>
                    Escucha los pasos o presiona cualquiera para escucharlo individualmente.
                  </Text>
                  <TouchableOpacity
                    style={styles.skipBriefingBtn}
                    onPress={skipBriefingAndStart}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flash" size={13} color="#0A0A0F" />
                    <Text style={styles.skipBriefingBtnText}>Saltar e Iniciar Ritmo</Text>
                  </TouchableOpacity>
                </View>

                {/* Lista de Pasos Guiados Tácticos */}
                <View style={styles.circuitBriefingStepsList}>
                  {guide.steps.map((step, idx) => {
                    const isStepActive = activeBriefingStep === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.circuitBriefingStepItem,
                          isStepActive && styles.circuitBriefingStepItemActive,
                        ]}
                        onPress={() => handleSpeakCircuitStep(idx)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.circuitBriefingStepBadge,
                            isStepActive && styles.circuitBriefingStepBadgeActive,
                          ]}
                        >
                          <Text style={styles.circuitBriefingStepNum}>{idx + 1}</Text>
                        </View>
                        <Text
                          style={[
                            styles.circuitBriefingStepText,
                            isStepActive && styles.circuitBriefingStepTextActive,
                          ]}
                        >
                          {step}
                        </Text>
                        <Ionicons
                          name={isStepActive ? 'volume-high' : 'volume-medium-outline'}
                          size={15}
                          color={isStepActive ? '#00F0FF' : '#475569'}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* Panel del Entrenador de Cadencia */
              <View style={styles.cadenceCoachBox}>
                <View style={styles.cadencePhaseRow}>
                  {/* Fase 1: Bajada */}
                  <View
                    style={[
                      styles.phasePill,
                      cadencePhase === 'down' && styles.phasePillActiveDown,
                    ]}
                  >
                    <Text style={styles.phasePillName}>BAJADA</Text>
                    <Text style={styles.phasePillSecs}>{guide.cadence.down}s</Text>
                  </View>

                  {/* Fase 2: Pausa Isométrica */}
                  <View
                    style={[
                      styles.phasePill,
                      cadencePhase === 'hold' && styles.phasePillActiveHold,
                    ]}
                  >
                    <Text style={styles.phasePillName}>SOSTÉN</Text>
                    <Text style={styles.phasePillSecs}>{guide.cadence.hold}s</Text>
                  </View>

                  {/* Fase 3: Subida */}
                  <View
                    style={[
                      styles.phasePill,
                      cadencePhase === 'up' && styles.phasePillActiveUp,
                    ]}
                  >
                    <Text style={styles.phasePillName}>SUBIDA</Text>
                    <Text style={styles.phasePillSecs}>{guide.cadence.up}s</Text>
                  </View>
                </View>

                {/* Gran Cuenta Regresiva de Segundos de la Fase */}
                <View style={styles.cadenceCountdownRow}>
                  <View style={styles.cadenceCountdownCircle}>
                    <Text style={styles.cadenceSecondsNumber}>{secondsLeft}</Text>
                    <Text style={styles.cadencePhaseLabel}>
                      {cadencePhase === 'down'
                        ? 'DESCENSO'
                        : cadencePhase === 'hold'
                        ? 'ISOMETRÍA'
                        : 'SUBIDA'}
                    </Text>
                  </View>

                  {/* Contador de Repeticiones */}
                  <View style={styles.repsCounterCard}>
                    <Text style={styles.repsDoneLabel}>REPETICIONES</Text>
                    <Text style={styles.repsCountText}>
                      <Text style={{ color: Colors.brand.accent }}>{currentReps}</Text> /{' '}
                      {activeExercise.targetCount}
                    </Text>
                    <Text style={styles.repsTargetSub}>
                      {activeExercise.repsLabel}
                    </Text>
                  </View>
                </View>

                {/* Botón para volver a ver los pasos técnicos */}
                <TouchableOpacity
                  style={styles.reviewGuideBtn}
                  onPress={() => {
                    setIsCadenceActive(false);
                    setIsBriefing(true);
                    CortexVoice.stop();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="book-outline" size={14} color={Colors.brand.accent} />
                  <Text style={styles.reviewGuideBtnText}>Repasar Guía de Técnica Paso a Paso</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Consejo Táctico CORTEX */}
            <View style={styles.cortexTipCard}>
              <Ionicons name="hardware-chip-outline" size={16} color={Colors.brand.accent} />
              <Text style={styles.cortexTipText}>{guide.cortexAdvice}</Text>
            </View>
          </ScrollView>

          {/* Botones de Acción del Ejercicio */}
          <View style={styles.workoutFooterActions}>
            {isBriefing ? (
              <TouchableOpacity
                style={styles.mainStartWorkoutBtn}
                onPress={skipBriefingAndStart}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={18} color="#0A0A0F" />
                <Text style={styles.mainStartWorkoutBtnText}>Iniciar Repeticiones</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.pauseResumeBtn}
                  onPress={toggleCircuitCadencePause}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isCadenceActive ? 'pause' : 'play'}
                    size={16}
                    color={Colors.text.primary}
                  />
                  <Text style={styles.pauseResumeText}>
                    {isCadenceActive ? 'Pausar' : 'Reanudar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.nextRepManualBtn}
                  onPress={() => {
                    const nextRep = circuitRepsRef.current + 1;
                    circuitRepsRef.current = nextRep;
                    setCurrentReps(nextRep);
                    circuitPhaseRef.current = 'down';
                    circuitSecondsRef.current = guide.cadence.down;
                    setCadencePhase('down');
                    setSecondsLeft(guide.cadence.down);

                    if (nextRep >= activeExercise.targetCount) {
                      handleExerciseCompleted();
                    } else {
                      announceCircuitRep(nextRep, activeExercise.targetCount);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextRepManualText}>+1 Repetición</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.finishExerciseBtn}
                  onPress={handleExerciseCompleted}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#0A0A0F" />
                  <Text style={styles.finishExerciseText}>Completar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* ================= VISTA 3: PAUSA DE 20 SEGUNDOS ================= */}
      {view === 'rest' && (
        <View style={[styles.viewContainer, styles.restCenterContainer]}>
          <View style={styles.restHeaderSection}>
            <View style={styles.restBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.restBadgeText}>ESTACIÓN SUPERADA</Text>
            </View>
            <Text style={styles.restTitle}>Recuperación Táctica</Text>
            <Text style={styles.restSubtitle}>
              Pausa de 20 segundos para reoxigenar y disipar ácido láctico
            </Text>
          </View>

          {/* Círculo Gigante de 20 Segundos */}
          <View style={styles.restTimerCircle}>
            <Text style={styles.restSecondsNumber}>{restSecondsLeft}</Text>
            <Text style={styles.restSecondsLabel}>SEGUNDOS</Text>
          </View>

          {/* Vista Previa del Próximo Ejercicio */}
          {currentExerciseIndex + 1 < circuit.length && (
            <View style={styles.nextExercisePreviewCard}>
              <Text style={styles.nextExerciseBadge}>A CONTINUACIÓN:</Text>
              <View style={styles.nextPreviewRow}>
                {(() => {
                  const nextExGuide = resolveExerciseGuide(
                    circuit[currentExerciseIndex + 1].id ||
                    circuit[currentExerciseIndex + 1].imageKey
                  );
                  return (
                    <ExerciseMedia
                      gifUrl={nextExGuide.cdnGifUrl}
                      rawGifUrl={nextExGuide.rawGifUrl}
                      thumbnailUrl={nextExGuide.thumbnailUrl}
                      style={styles.nextPreviewThumb}
                      resizeMode="cover"
                    />
                  );
                })()}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.nextPreviewName}>
                    {circuit[currentExerciseIndex + 1].name}
                  </Text>
                  <Text style={styles.nextPreviewReps}>
                    {circuit[currentExerciseIndex + 1].repsLabel}
                  </Text>
                  <Text style={styles.nextPreviewMuscles}>
                    {circuit[currentExerciseIndex + 1].muscles.join(', ')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Botón para Saltar Descanso */}
          <TouchableOpacity
            style={styles.skipRestBtn}
            onPress={advanceToNextExercise}
            activeOpacity={0.8}
          >
            <Ionicons name="play-skip-forward" size={18} color="#0A0A0F" />
            <Text style={styles.skipRestBtnText}>Saltar Descanso y Continuar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= VISTA 4: CELEBRACIÓN DE CIRCUITO ================= */}
      {view === 'celebration' && (
        <View style={[styles.viewContainer, styles.celebrationCenter]}>
          <View style={styles.trophyGlowCircle}>
            <Ionicons name="trophy" size={56} color="#F59E0B" />
          </View>

          <Text style={styles.victoryTitle}>¡CIRCUITO CONQUISTADO!</Text>
          <Text style={styles.victorySubtitle}>
            Completaste todas las estaciones en {planName}
          </Text>

          {/* Tarjeta de Recompensa */}
          <View style={styles.rewardCard}>
            <View style={styles.rewardXpRow}>
              <Ionicons name="sparkles" size={24} color={Colors.brand.accent} />
              <Text style={styles.rewardXpAmount}>+{xpReward} XP</Text>
            </View>
            <Text style={styles.rewardSubtext}>
              Experiencia añadida directamente a tus atributos de Cazador
            </Text>
          </View>

          {/* Resumen de Estaciones */}
          <View style={styles.conqueredStatsRow}>
            <View style={styles.conqueredStatItem}>
              <Text style={styles.conqueredStatVal}>{circuit.length}</Text>
              <Text style={styles.conqueredStatLabel}>Ejercicios</Text>
            </View>
            <View style={styles.conqueredDivider} />
            <View style={styles.conqueredStatItem}>
              <Text style={styles.conqueredStatVal}>100%</Text>
              <Text style={styles.conqueredStatLabel}>Completado</Text>
            </View>
            <View style={styles.conqueredDivider} />
            <View style={styles.conqueredStatItem}>
              <Text style={styles.conqueredStatVal}>Día {dayNumber}</Text>
              <Text style={styles.conqueredStatLabel}>Superado</Text>
            </View>
          </View>

          {/* Botón de Enfriamiento y Recuperación Táctica */}
          <TouchableOpacity
            style={styles.recoveryCoolDownBtn}
            onPress={() => {
              Haptics.light();
              setShowRecovery(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="body-outline" size={18} color="#10B981" />
            <Text style={styles.recoveryCoolDownBtnText}>
              Protocolo de Recuperación Táctica (3 min) ›
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.claimVictoryBtn}
            onPress={handleClaimAndClose}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done" size={22} color="#0A0A0F" />
            <Text style={styles.claimVictoryBtnText}>RECLAMAR RECOMPENSA</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Recuperación Táctica */}
      <RecoveryModal
        visible={showRecovery}
        onClose={() => setShowRecovery(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#07080D',
  },
  viewContainer: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },

  // Overview Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBadge: {
    color: Colors.brand.accent,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  dayTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  xpBadgeText: {
    color: Colors.brand.accent,
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Circuit Summary Card
  circuitSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
    marginTop: 2,
  },
  summaryLabel: {
    color: Colors.text.muted,
    fontSize: 9,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },

  // Calibration Tags
  calibrationTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  calibTagCyan: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  calibTagCyanText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  calibTagPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  calibTagPurpleText: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  calibTagGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  calibTagGreenText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  sectionHeader: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  circuitList: {
    flex: 1,
  },
  circuitItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  circuitItemCardDone: {
    opacity: 0.65,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  circuitItemCardNext: {
    borderColor: 'rgba(6, 182, 212, 0.5)',
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  circuitIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuitIndexBadgeDone: {
    backgroundColor: '#10B981',
  },
  circuitIndexBadgeNext: {
    backgroundColor: Colors.brand.accent,
  },
  circuitIndexText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  circuitIndexTextNext: {
    color: '#0A0A0F',
  },
  circuitThumb: {
    width: 62,
    height: 62,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  circuitExName: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },
  circuitExNameDone: {
    textDecorationLine: 'line-through',
    color: Colors.text.muted,
  },
  circuitExReps: {
    color: Colors.brand.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  circuitExMuscles: {
    color: Colors.text.muted,
    fontSize: 9,
  },
  circuitExAction: {
    paddingLeft: 4,
  },
  doneText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: 'bold',
  },

  footerAction: {
    paddingVertical: Spacing.sm,
  },
  mainStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    shadowColor: Colors.brand.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainStartBtnText: {
    color: '#0A0A0F',
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Workout Screen
  workoutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  smallBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationCounterText: {
    color: Colors.brand.accent,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  workoutExTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
  },
  voiceToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuitProgressBarTrack: {
    height: 4,
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginVertical: Spacing.xs,
  },
  circuitProgressBarFill: {
    height: '100%',
    backgroundColor: Colors.brand.accent,
  },

  workoutScrollContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },

  // Robot Image & Laser Scanner
  robotImageWrapper: {
    position: 'relative',
    height: 265,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    backgroundColor: '#040711',
  },
  robotImage: {
    width: '100%',
    height: '100%',
  },
  laserScannerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  hologramHeaderOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hologramLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  hologramLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F0FF',
  },
  hologramLiveText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  hologramAngleText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  hologramMetricsRow: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  jointMetricItem: {
    backgroundColor: 'rgba(4, 7, 17, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  jointMetricLabel: {
    color: Colors.text.muted,
    fontSize: 8,
  },
  jointMetricTarget: {
    color: Colors.brand.accent,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Briefing Box
  briefingNoticeCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    gap: 4,
  },
  briefingContainer: {
    gap: Spacing.sm,
  },
  circuitBriefingStepsList: {
    gap: 6,
    marginTop: 4,
  },
  circuitBriefingStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  circuitBriefingStepItemActive: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  circuitBriefingStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  circuitBriefingStepBadgeActive: {
    backgroundColor: '#00F0FF',
    borderColor: '#00F0FF',
  },
  circuitBriefingStepNum: {
    color: Colors.text.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  circuitBriefingStepText: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
  },
  circuitBriefingStepTextActive: {
    color: '#00F0FF',
    fontWeight: '600',
  },
  reviewGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  reviewGuideBtnText: {
    color: Colors.brand.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  briefingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  briefingNoticeTitle: {
    color: Colors.brand.accent,
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },
  briefingNoticeSub: {
    color: Colors.text.secondary,
    fontSize: 11,
  },
  skipBriefingBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.brand.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  skipBriefingBtnText: {
    color: '#0A0A0F',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Cadence Coach
  cadenceCoachBox: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cadencePhaseRow: {
    flexDirection: 'row',
    gap: 6,
  },
  phasePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  phasePillActiveDown: {
    borderColor: Colors.brand.accent,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  phasePillActiveHold: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  phasePillActiveUp: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  phasePillName: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: 'bold',
  },
  phasePillSecs: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  cadenceCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cadenceCountdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 2,
    borderColor: Colors.brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cadenceSecondsNumber: {
    color: Colors.brand.accent,
    fontSize: 32,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  cadencePhaseLabel: {
    color: Colors.text.muted,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  repsCounterCard: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 2,
  },
  repsDoneLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: 'bold',
  },
  repsCountText: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
  },
  repsTargetSub: {
    color: Colors.text.secondary,
    fontSize: 10,
  },

  cortexTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cortexTipText: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: 10,
    lineHeight: 14,
  },

  workoutFooterActions: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: Spacing.sm,
  },
  mainStartWorkoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand.accent,
    borderRadius: Radius.lg,
    paddingVertical: 12,
  },
  mainStartWorkoutBtnText: {
    color: '#0A0A0F',
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
  },
  pauseResumeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pauseResumeText: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },
  nextRepManualBtn: {
    flex: 1,
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextRepManualText: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },
  finishExerciseBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
  },
  finishExerciseText: {
    color: '#0A0A0F',
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },

  // Rest Screen
  restCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  restHeaderSection: {
    alignItems: 'center',
    gap: 4,
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  restBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  restTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
  },
  restSubtitle: {
    color: Colors.text.muted,
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 280,
  },
  restTimerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 3,
    borderColor: Colors.brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brand.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  restSecondsNumber: {
    color: Colors.brand.accent,
    fontSize: 48,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  restSecondsLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  nextExercisePreviewCard: {
    width: '100%',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  nextExerciseBadge: {
    color: Colors.brand.accent,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  nextPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nextPreviewThumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
  },
  nextPreviewName: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },
  nextPreviewReps: {
    color: Colors.brand.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  nextPreviewMuscles: {
    color: Colors.text.muted,
    fontSize: 9,
  },
  skipRestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    backgroundColor: Colors.brand.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  skipRestBtnText: {
    color: '#0A0A0F',
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
  },

  // Celebration Screen
  celebrationCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  trophyGlowCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  victoryTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  victorySubtitle: {
    color: Colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
  },
  rewardCard: {
    width: '100%',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    alignItems: 'center',
    gap: 4,
  },
  rewardXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardXpAmount: {
    color: Colors.brand.accent,
    fontSize: 28,
    fontWeight: 'bold',
  },
  rewardSubtext: {
    color: Colors.text.secondary,
    fontSize: 11,
    textAlign: 'center',
  },
  conqueredStatsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conqueredStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  conqueredStatVal: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
  },
  conqueredStatLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    marginTop: 2,
  },
  conqueredDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  recoveryCoolDownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  recoveryCoolDownBtnText: {
    color: '#10B981',
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },
  claimVictoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  claimVictoryBtnText: {
    color: '#0A0A0F',
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
