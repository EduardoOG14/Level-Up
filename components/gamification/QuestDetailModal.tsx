import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CortexVoice } from '../../services/cortexVoice';
import { CortexAvatar } from '../ai/CortexAvatar';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { Haptics } from '../../services/haptics';
import { SoundEffects } from '../../services/soundEffects';
import type { Quest } from './QuestCard';

interface QuestDetailModalProps {
  quest: Quest | null;
  visible: boolean;
  onClose: () => void;
  onComplete: (questId: string) => void;
}

import {
  EXERCISE_GUIDES,
  resolveExerciseGuide,
  ALIAS_MAP,
  EXERCISES_BY_ID,
  type ExerciseGuide,
} from '../../constants/exercises';
import { ExerciseMedia } from '../ui/ExerciseMedia';

export { EXERCISE_GUIDES };

export function QuestDetailModal({
  quest,
  visible,
  onClose,
  onComplete,
}: QuestDetailModalProps) {
  if (!quest || !visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <QuestDetailContent
        quest={quest}
        onClose={onClose}
        onComplete={onComplete}
      />
    </Modal>
  );
}

function QuestDetailContent({
  quest,
  onClose,
  onComplete,
}: {
  quest: Quest;
  onClose: () => void;
  onComplete: (questId: string) => void;
}) {
  // Determinar los datos del ejercicio según el id o título de la misión (memorizado para evitar re-creación en cada render)
  const guide = useMemo(() => {
    const key = quest.exerciseKey || quest.id;
    if (key && (key.length === 4 || ALIAS_MAP[key] || EXERCISES_BY_ID.has(key))) {
      return resolveExerciseGuide(key);
    }
    const titleLower = `${quest.exerciseName || ''} ${quest.title}`.toLowerCase();
    return resolveExerciseGuide(key || titleLower);
  }, [quest.id, quest.exerciseKey, quest.title, quest.exerciseName]);

  const exerciseTitle = quest.exerciseName || guide.name;
  const muscles = quest.targetMuscles || guide.muscles;
  const sets = quest.sets || guide.sets;
  const reps = quest.reps || guide.reps;
  const targetReps = guide.targetCount || 10;
  const steps = quest.instructions || guide.steps;
  const cortexTip = quest.cortexAdvice || guide.cortexAdvice;

  // Animación suave del escáner láser holográfico
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Estado del Entrenador de Cadencia / Ritmo
  const [isCadenceActive, setIsCadenceActive] = useState(false);
  const [isBriefing, setIsBriefing] = useState(false);
  const [cadencePhase, setCadencePhase] = useState<'down' | 'hold' | 'up'>('down');
  const [secondsLeft, setSecondsLeft] = useState<number>(guide.cadence.down);
  const [currentReps, setCurrentReps] = useState(0);

  // Módulo de Voz CORTEX
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpokenStep, setActiveSpokenStep] = useState<number | null>(null);

  // Referencias mutables para mantener el timer desacoplado de cierres asíncronos y re-renders
  const cadencePhaseRef = useRef<'down' | 'hold' | 'up'>('down');
  const secondsLeftRef = useRef<number>(guide.cadence.down);
  const currentRepsRef = useRef<number>(0);
  const tourActiveRef = useRef(false);

  // Cuenta atrás táctica de 3 segundos previa al inicio del ejercicio
  const [preCountdown, setPreCountdown] = useState<number | null>(null);
  const preCountdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownScaleAnim = useRef(new Animated.Value(1)).current;

  // Iniciar la cuenta atrás de 3 segundos con señales audiovisuales y hápticas
  const startPreWorkoutCountdown = () => {
    stopStepTour();
    if (preCountdownTimerRef.current) {
      clearInterval(preCountdownTimerRef.current);
      preCountdownTimerRef.current = null;
    }
    CortexVoice.stop();
    setIsCadenceActive(false);

    setPreCountdown(3);
    countdownScaleAnim.setValue(1.4);
    Animated.spring(countdownScaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();

    Haptics.medium();
    SoundEffects.playTick();
    if (isVoiceEnabled) {
      speakRobot('Tres');
    }

    let count = 3;
    preCountdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setPreCountdown(count);
        countdownScaleAnim.setValue(1.4);
        Animated.spring(countdownScaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();

        if (count === 2) {
          Haptics.medium();
          SoundEffects.playTick();
          if (isVoiceEnabled) speakRobot('Dos');
        } else if (count === 1) {
          Haptics.heavy();
          SoundEffects.playTick();
          if (isVoiceEnabled) speakRobot('Uno');
        }
      } else {
        if (preCountdownTimerRef.current) {
          clearInterval(preCountdownTimerRef.current);
          preCountdownTimerRef.current = null;
        }
        setPreCountdown(null);
        executeStartCadence();
      }
    }, 1000);
  };

  const executeStartCadence = () => {
    if (preCountdownTimerRef.current) {
      clearInterval(preCountdownTimerRef.current);
      preCountdownTimerRef.current = null;
    }
    setPreCountdown(null);
    cadencePhaseRef.current = 'down';
    secondsLeftRef.current = guide.cadence.down;
    currentRepsRef.current = 0;
    setCadencePhase('down');
    setSecondsLeft(guide.cadence.down);
    setCurrentReps(0);
    setIsCadenceActive(true);
    Haptics.triumph();
    SoundEffects.playChime();
    if (isVoiceEnabled) {
      speakRobot('¡Iniciamos el ritmo! Sigue la cadencia.');
    }
  };

  // Iniciar el entrenamiento de cadencia
  const startCadenceWorkout = () => {
    startPreWorkoutCountdown();
  };

  // Explicación guiada secuencial: recorre todos los pasos en orden natural sin saltarse ninguno
  const startStepTour = (startIndex = 0) => {
    if (!steps || steps.length === 0) return;
    tourActiveRef.current = true;
    setIsBriefing(true);

    const playStep = (idx: number) => {
      if (!tourActiveRef.current) return;
      if (idx >= steps.length) {
        // Al terminar todos los pasos:
        setActiveSpokenStep(null);
        tourActiveRef.current = false;
        setIsBriefing(false);
        speakRobot('¡Técnica explicada! Prepárate para entrenar.', () => {
          startPreWorkoutCountdown();
        });
        return;
      }

      setActiveSpokenStep(idx);
      const stepText = `Paso ${idx + 1}: ${steps[idx]}`;
      speakRobot(stepText, () => {
        if (!tourActiveRef.current) return;
        // Pausa natural de 700ms entre pasos para que la explicación sea fluida
        setTimeout(() => {
          if (!tourActiveRef.current) return;
          playStep(idx + 1);
        }, 700);
      });
    };

    playStep(startIndex);
  };

  const stopStepTour = () => {
    tourActiveRef.current = false;
    setIsBriefing(false);
    setActiveSpokenStep(null);
    if (preCountdownTimerRef.current) {
      clearInterval(preCountdownTimerRef.current);
      preCountdownTimerRef.current = null;
    }
    setPreCountdown(null);
    CortexVoice.stop();
  };

  const handleSpeakStep = (index: number) => {
    if (!steps[index]) return;
    // Si estaba corriendo el tour automático, lo detenemos y explicamos solo este paso
    stopStepTour();
    setActiveSpokenStep(index);
    speakRobot(`Paso ${index + 1}: ${steps[index]}`, () => {
      setActiveSpokenStep(null);
    });
  };

  // Locución clara y rítmica al completar repeticiones (sin saturar durante las fases de movimiento)
  const announceRep = (rep: number, target: number) => {
    if (rep === 1) {
      speakRobot('Repetición 1');
    } else if (rep === Math.floor(target / 2)) {
      speakRobot(`${rep}. Mitad del objetivo.`);
    } else if (rep === target - 2) {
      speakRobot(`${rep}. Dos más.`);
    } else if (rep === target - 1) {
      speakRobot('¡Última repetición!');
    } else {
      speakRobot(`${rep}`);
    }
  };

  // Función para sintetizar voz humana y natural de CORTEX
  const speakRobot = (text: string, onDone?: () => void) => {
    if (!isVoiceEnabled) {
      onDone?.();
      return;
    }
    CortexVoice.speak(text, {
      onStart: () => setIsSpeaking(true),
      onDone: () => {
        setIsSpeaking(false);
        onDone?.();
      },
      onError: () => setIsSpeaking(false),
    });
  };

  // Limpieza al desmontar el componente (detener voz y timers inmediatamente)
  useEffect(() => {
    return () => {
      if (preCountdownTimerRef.current) {
        clearInterval(preCountdownTimerRef.current);
        preCountdownTimerRef.current = null;
      }
      tourActiveRef.current = false;
      CortexVoice.stop();
    };
  }, []);

  useEffect(() => {
    // Láser de escaneo holográfico continuo y majestuoso (3500ms para mayor calma visual)
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

    // Pulso de los nodos biomecánicos
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

  // Intervalo de segundo a segundo para la cuenta regresiva de cadencia (100% fluido y libre de bloqueos)
  useEffect(() => {
    if (!isCadenceActive) return;

    if (secondsLeftRef.current <= 0) {
      secondsLeftRef.current = guide.cadence.down;
      setSecondsLeft(guide.cadence.down);
    }

    const interval = setInterval(() => {
      secondsLeftRef.current -= 1;

      if (secondsLeftRef.current <= 0) {
        // Transición de fase precisa
        if (cadencePhaseRef.current === 'down') {
          cadencePhaseRef.current = 'hold';
          secondsLeftRef.current = guide.cadence.hold;
          setCadencePhase('hold');
          setSecondsLeft(guide.cadence.hold);
          Haptics.medium();
        } else if (cadencePhaseRef.current === 'hold') {
          cadencePhaseRef.current = 'up';
          secondsLeftRef.current = guide.cadence.up;
          setCadencePhase('up');
          setSecondsLeft(guide.cadence.up);
          Haptics.medium();
        } else {
          // Fase 'up' finalizada -> Repetición completada con éxito
          const nextRep = currentRepsRef.current + 1;
          currentRepsRef.current = nextRep;
          setCurrentReps(nextRep);
          Haptics.heavy();

          if (nextRep >= targetReps) {
            setIsCadenceActive(false);
            cadencePhaseRef.current = 'down';
            secondsLeftRef.current = guide.cadence.down;
            setCadencePhase('down');
            setSecondsLeft(guide.cadence.down);
            SoundEffects.playLevelUp();
            speakRobot(`¡Objetivo completado! ${targetReps} repeticiones logradas. Misión cumplida, Cazador.`);
          } else {
            cadencePhaseRef.current = 'down';
            secondsLeftRef.current = guide.cadence.down;
            setCadencePhase('down');
            setSecondsLeft(guide.cadence.down);
            announceRep(nextRep, targetReps);
          }
        }
      } else {
        setSecondsLeft(secondsLeftRef.current);
        Haptics.light();
        if (secondsLeftRef.current <= 3) {
          SoundEffects.playTick();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCadenceActive, targetReps, guide.cadence]);

  const toggleCadence = () => {
    if (preCountdown !== null) {
      if (preCountdownTimerRef.current) {
        clearInterval(preCountdownTimerRef.current);
        preCountdownTimerRef.current = null;
      }
      setPreCountdown(null);
      CortexVoice.stop();
      speakRobot('Preparación cancelada.');
      return;
    }
    if (isCadenceActive) {
      setIsCadenceActive(false);
      CortexVoice.stop();
      speakRobot('Ritmo pausado.');
    } else {
      startCadenceWorkout();
    }
  };

  const handleCloseModal = () => {
    if (preCountdownTimerRef.current) {
      clearInterval(preCountdownTimerRef.current);
      preCountdownTimerRef.current = null;
    }
    setPreCountdown(null);
    CortexVoice.stop();
    setIsBriefing(false);
    setIsCadenceActive(false);
    onClose();
  };

  const handleMarkComplete = () => {
    CortexVoice.stop();
    Haptics.success();
    SoundEffects.playChime();
    speakRobot('Misión completada. Experiencia otorgada por el Sistema.');
    onComplete(quest.id);
    onClose();
  };

  const handleMarkUncomplete = () => {
    CortexVoice.stop();
    Haptics.light();
    speakRobot('Misión desmarcada. Experiencia recalculada.');
    onComplete(quest.id);
    onClose();
  };

  const handleAddRep = () => {
    const next = Math.min(targetReps, currentRepsRef.current + 1);
    currentRepsRef.current = next;
    setCurrentReps(next);
    cadencePhaseRef.current = 'down';
    secondsLeftRef.current = guide.cadence.down;
    setCadencePhase('down');
    setSecondsLeft(guide.cadence.down);
    Haptics.medium();
    if (next >= targetReps) {
      setIsCadenceActive(false);
      SoundEffects.playLevelUp();
      speakRobot(`¡Objetivo completado! ${targetReps} repeticiones logradas.`);
    } else {
      announceRep(next, targetReps);
    }
  };

  const handleRemoveRep = () => {
    const prev = Math.max(0, currentRepsRef.current - 1);
    currentRepsRef.current = prev;
    setCurrentReps(prev);
  };

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 305],
  });

  const totalCycleSeconds = guide.cadence.down + guide.cadence.hold + guide.cadence.up;

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.topTitleBox}>
          <Text style={styles.topSubtitle}>MISIÓN DEL SISTEMA • CORTEX IA</Text>
          <Text style={styles.topTitle} numberOfLines={1}>
            {quest.title}
          </Text>
        </View>
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>{quest.category.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Video / GIF Biomecánico del Ejercicio (CDN + Caché Local) */}
        <View style={styles.robotCard}>
          <ExerciseMedia
            gifUrl={guide.cdnGifUrl}
            rawGifUrl={guide.rawGifUrl}
            thumbnailUrl={guide.thumbnailUrl}
            style={styles.robotImage}
            resizeMode="contain"
          />

          {/* Hologram Grid Overlay */}
          <View style={styles.gridOverlay} />

          {/* Animated Scanning Laser Line */}
          <Animated.View
            style={[
              styles.scanLaser,
              {
                transform: [{ translateY: scanTranslateY }],
              },
            ]}
          >
            <View style={styles.laserCore} />
          </Animated.View>

          {/* Top Status Badges */}
          <View style={styles.holoTopBar}>
            <View style={styles.holoPill}>
              <Animated.View style={[styles.statusDot, { opacity: pulseAnim }]} />
              <Text style={styles.holoPillText}>BIOMECÁNICA HD • 1,324 EJERCICIOS</Text>
            </View>
            <View style={[styles.modelPill, (isSpeaking || isBriefing) && styles.modelPillSpeaking]}>
              <Ionicons
                name={isBriefing ? 'book-outline' : isSpeaking ? 'radio' : 'hardware-chip-outline'}
                size={12}
                color={(isSpeaking || isBriefing) ? '#10B981' : Colors.brand.accent}
              />
              <Text style={[styles.modelPillText, (isSpeaking || isBriefing) && { color: '#10B981' }]}>
                {isBriefing ? 'LEYENDO GUÍA TÁCTICA' : isSpeaking ? 'VOZ TRANSMITIENDO' : 'VOZ ANDROIDE v2.4'}
              </Text>
            </View>
          </View>

          {/* Biomechanical Calibration Overlay Tags */}
          <View style={styles.metricsOverlay}>
            {guide.jointMetrics.map((metric, idx) => (
              <View key={idx} style={styles.metricTag}>
                <Ionicons name="git-commit-outline" size={11} color={Colors.brand.accent} />
                <Text style={styles.metricTagLabel}>{metric.label}:</Text>
                <Text style={styles.metricTagValue}>{metric.target}</Text>
              </View>
            ))}
          </View>

          {/* Bottom Holographic Watermark */}
          <View style={styles.holoFooter}>
            <Ionicons name="shield-checkmark" size={13} color="#10B981" />
            <Text style={styles.holoFooterText}>Postura Biométrica Certificada • Ritmo Lento ({totalCycleSeconds}s)</Text>
          </View>
        </View>

        {/* Banner de Certificación Ortopédica y Protección Articular */}
        <View style={[styles.orthoBanner, guide.isKneeSafe ? styles.orthoBannerSafe : styles.orthoBannerHighImpact]}>
          <Ionicons
            name={guide.isKneeSafe ? 'shield-checkmark' : 'alert-circle'}
            size={18}
            color={guide.isKneeSafe ? '#10B981' : '#F59E0B'}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.orthoBannerTitle, { color: guide.isKneeSafe ? '#10B981' : '#F59E0B' }]}>
              {guide.isKneeSafe ? 'PROTOCOLO ARTICULAR: RODILLAS SEGURAS' : 'ALERTA BIOMECÁNICA: ALTO IMPACTO'}
            </Text>
            <Text style={styles.orthoBannerDesc}>
              {guide.orthopedicNote}
            </Text>
          </View>
        </View>

        {/* Interactive Cadence & Tempo Coach with Robotic Voice */}
        <View style={styles.cadenceCard}>
          <View style={styles.cadenceHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.cadenceBadgeRow}>
                <Text style={styles.cadenceTitle}>ENTRENADOR DE RITMO Y TEMPO</Text>
                <View style={styles.tempoSpeedBadge}>
                  <Text style={styles.tempoSpeedBadgeText}>RITMO LENTO ⏱️</Text>
                </View>
              </View>
              <Text style={styles.cadenceSubtitle}>
                Cadencia {guide.cadence.down}-{guide.cadence.hold}-{guide.cadence.up} ({totalCycleSeconds}s por repetición) • Máxima tensión muscular
              </Text>
            </View>

            {/* Action Buttons: Voice Mute Toggle + Cadence Start/Pause */}
            <View style={styles.cadenceActionsRow}>
              <TouchableOpacity
                style={[styles.voiceBtn, isVoiceEnabled && styles.voiceBtnActive]}
                onPress={() => {
                  if (isVoiceEnabled) {
                    CortexVoice.stop();
                    setIsVoiceEnabled(false);
                  } else {
                    setIsVoiceEnabled(true);
                    CortexVoice.stop();
                    CortexVoice.speak('Voz de CORTEX activada.');
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isVoiceEnabled ? 'volume-high' : 'volume-mute'}
                  size={16}
                  color={isVoiceEnabled ? Colors.brand.accent : Colors.text.muted}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cadenceToggleBtn,
                  isCadenceActive && styles.cadenceToggleBtnActive,
                ]}
                onPress={toggleCadence}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isCadenceActive ? 'pause' : 'play'}
                  size={15}
                  color={isCadenceActive ? '#FFFFFF' : Colors.brand.accent}
                />
                <Text
                  style={[
                    styles.cadenceToggleText,
                    isCadenceActive && styles.cadenceToggleTextActive,
                  ]}
                >
                  {preCountdown !== null ? 'Preparando...' : isCadenceActive ? 'Pausar Ritmo' : 'Iniciar Ritmo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Si está en cuenta atrás de 3 segundos, mostrar panel holográfico de preparación */}
          {preCountdown !== null ? (
            <View style={styles.countdownBox}>
              <View style={styles.countdownHeaderRow}>
                <View style={styles.countdownSystemBadge}>
                  <Animated.View style={[styles.statusDot, { opacity: pulseAnim }]} />
                  <Text style={styles.countdownSystemText}>SISTEMA: PREPARACIÓN</Text>
                </View>
                <Text style={styles.countdownCadenceHint}>OBJETIVO: {targetReps} REPS</Text>
              </View>

              <View style={styles.countdownCircleWrapper}>
                <View
                  style={[
                    styles.countdownOuterRing,
                    preCountdown === 3 && styles.countdownRingCyan,
                    preCountdown === 2 && styles.countdownRingViolet,
                    preCountdown === 1 && styles.countdownRingEmerald,
                  ]}
                >
                  <Animated.Text
                    style={[
                      styles.countdownBigNumber,
                      {
                        transform: [{ scale: countdownScaleAnim }],
                        color:
                          preCountdown === 3
                            ? '#00F0FF'
                            : preCountdown === 2
                            ? '#A855F7'
                            : '#10B981',
                      },
                    ]}
                  >
                    {preCountdown}
                  </Animated.Text>
                </View>
              </View>

              <Text style={styles.countdownPostureAdvice}>
                {preCountdown === 3
                  ? 'COLÓCATE EN POSICIÓN'
                  : preCountdown === 2
                  ? 'AJUSTA TU POSTURA Y AGARRE'
                  : '¡TODO LISTO! INICIAMOS'}
              </Text>
              <Text style={styles.countdownSubtext}>
                Iniciando ritmo en {preCountdown} segundo{preCountdown === 1 ? '' : 's'}...
              </Text>

              <TouchableOpacity
                style={styles.countdownSkipBtn}
                onPress={executeStartCadence}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={13} color="#0A0A0F" />
                <Text style={styles.countdownSkipBtnText}>Comenzar de Inmediato</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* 3 Phases Visualizer with Live Second-by-Second Countdown */
            <View style={styles.phaseStepsRow}>
            {/* FASE 1: DESCENSO */}
            <View
              style={[
                styles.phaseStepBox,
                cadencePhase === 'down' && isCadenceActive && styles.phaseStepBoxActive,
              ]}
            >
              <Text style={styles.phaseStepNum}>FASE 1 ({guide.cadence.down}s)</Text>
              <Text
                style={[
                  styles.phaseStepName,
                  cadencePhase === 'down' && isCadenceActive && styles.phaseStepNameActive,
                ]}
              >
                Descenso Lento
              </Text>
              {cadencePhase === 'down' && isCadenceActive ? (
                <View style={styles.countdownBadge}>
                  <Ionicons name="timer-outline" size={11} color={Colors.brand.accent} />
                  <Text style={styles.countdownBadgeText}>{secondsLeft}s</Text>
                </View>
              ) : (
                <Text style={styles.phaseStepSub}>Control total</Text>
              )}
            </View>

            {/* FASE 2: PAUSA ISOMÉTRICA */}
            <View
              style={[
                styles.phaseStepBox,
                cadencePhase === 'hold' && isCadenceActive && styles.phaseStepBoxActiveHold,
              ]}
            >
              <Text style={styles.phaseStepNum}>FASE 2 ({guide.cadence.hold}s)</Text>
              <Text
                style={[
                  styles.phaseStepName,
                  cadencePhase === 'hold' && isCadenceActive && styles.phaseStepNameActiveHold,
                ]}
              >
                Pausa Isométrica
              </Text>
              {cadencePhase === 'hold' && isCadenceActive ? (
                <View style={[styles.countdownBadge, styles.countdownBadgeHold]}>
                  <Ionicons name="timer-outline" size={11} color={Colors.brand.primary} />
                  <Text style={[styles.countdownBadgeText, { color: Colors.brand.primary }]}>{secondsLeft}s</Text>
                </View>
              ) : (
                <Text style={styles.phaseStepSub}>Sostén tensión</Text>
              )}
            </View>

            {/* FASE 3: SUBIDA */}
            <View
              style={[
                styles.phaseStepBox,
                cadencePhase === 'up' && isCadenceActive && styles.phaseStepBoxActiveUp,
              ]}
            >
              <Text style={styles.phaseStepNum}>FASE 3 ({guide.cadence.up}s)</Text>
              <Text
                style={[
                  styles.phaseStepName,
                  cadencePhase === 'up' && isCadenceActive && styles.phaseStepNameActiveUp,
                ]}
              >
                Subida Controlada
              </Text>
              {cadencePhase === 'up' && isCadenceActive ? (
                <View style={[styles.countdownBadge, styles.countdownBadgeUp]}>
                  <Ionicons name="timer-outline" size={11} color="#10B981" />
                  <Text style={[styles.countdownBadgeText, { color: '#10B981' }]}>{secondsLeft}s</Text>
                </View>
              ) : (
                <Text style={styles.phaseStepSub}>Fuerza pura</Text>
              )}
            </View>
          </View>
        )}

          {/* Live Rep Tracker */}
          <View style={styles.repTrackerRow}>
            <View style={styles.repCounterBox}>
              <Text style={styles.repCounterLabel}>Reps Ejecutadas:</Text>
              <Text style={styles.repCounterValue}>
                {currentReps}{' '}
                <Text style={styles.repCounterTarget}>/ {guide.targetCount}</Text>
              </Text>
            </View>

            <View style={styles.repButtonsGroup}>
              <TouchableOpacity
                style={styles.repAdjustBtn}
                onPress={handleRemoveRep}
              >
                <Ionicons name="remove" size={18} color={Colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.repAdjustBtn, styles.repAdjustBtnAdd]}
                onPress={handleAddRep}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Exercise Overview */}
        <View style={styles.sectionCard}>
          <Text style={styles.exerciseName}>{exerciseTitle}</Text>
          <Text style={styles.questDescription}>{quest.description}</Text>

          {/* Target Muscle Badges */}
          <View style={styles.musclesContainer}>
            {muscles.map((muscle, idx) => (
              <View key={idx} style={styles.muscleBadge}>
                <Text style={styles.muscleText}>{muscle}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Parameters & Rewards Grid */}
        <View style={styles.paramGrid}>
          <View style={styles.paramCard}>
            <Text style={styles.paramLabel}>Series</Text>
            <Text style={styles.paramValue}>{sets} Sets</Text>
          </View>
          <View style={styles.paramCard}>
            <Text style={styles.paramLabel}>Objetivo</Text>
            <Text style={styles.paramValue}>{reps}</Text>
          </View>
          <View style={[styles.paramCard, styles.xpParamCard]}>
            <Text style={styles.paramLabel}>Recompensa</Text>
            <Text style={styles.xpParamValue}>+{quest.xpReward} XP</Text>
          </View>
        </View>

        {/* Step-by-Step Instructions */}
        <View style={[styles.sectionCard, isBriefing && styles.sectionCardBriefing]}>
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="list" size={18} color={isBriefing ? '#00F0FF' : Colors.brand.primary} />
              <Text style={styles.sectionTitle}>Guía de Ejecución Táctica</Text>
              {isBriefing && (
                <View style={styles.briefingActiveBadge}>
                  <Animated.View style={[styles.statusDot, { opacity: pulseAnim }]} />
                  <Text style={styles.briefingActiveText}>
                    PASO {(activeSpokenStep ?? 0) + 1}/{steps.length}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.tourBtn, isBriefing && styles.tourBtnActive]}
              onPress={isBriefing ? stopStepTour : () => startStepTour(0)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isBriefing ? 'stop-circle' : 'volume-high'}
                size={14}
                color={isBriefing ? '#EF4444' : '#00F0FF'}
              />
              <Text style={[styles.tourBtnText, isBriefing && styles.tourBtnTextActive]}>
                {isBriefing ? 'Detener' : 'Explicar Técnica'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stepsList}>
            {steps.map((step, index) => {
              const isStepActive = activeSpokenStep === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.stepItem, isStepActive && styles.stepItemActive]}
                  onPress={() => handleSpeakStep(index)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.stepNumberBadge, isStepActive && styles.stepNumberBadgeActive]}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, isStepActive && styles.stepTextActive]}>{step}</Text>
                  <Ionicons
                    name={isStepActive ? 'volume-high' : 'volume-medium-outline'}
                    size={16}
                    color={isStepActive ? '#00F0FF' : '#475569'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CORTEX Holographic Advice */}
        <View style={styles.cortexCard}>
          <View style={styles.cortexHeader}>
            <CortexAvatar size="sm" showPulse={false} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.cortexName}>CORTEX</Text>
              <Text style={styles.cortexRole}>IA Táctica del Sistema</Text>
            </View>
            <Ionicons name="shield-checkmark" size={20} color={Colors.brand.accent} />
          </View>
          <Text style={styles.cortexMessage}>{cortexTip}</Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Button */}
      <View style={styles.bottomBar}>
        {quest.completed ? (
          <TouchableOpacity
            style={styles.completedBtn}
            onPress={handleMarkUncomplete}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            <Text style={styles.completedBtnText}>
              Misión Realizada • Toca para Desmarcar (-{quest.xpReward} XP)
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={handleMarkComplete}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={20} color="#FFFFFF" />
            <Text style={styles.completeBtnText}>
              Completar Misión (+{quest.xpReward} XP)
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 16 : Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg.secondary,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleBox: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  topSubtitle: {
    color: Colors.brand.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  topTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  rankBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
  },
  rankBadgeText: {
    color: Colors.brand.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: 100,
  },
  orthoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  orthoBannerSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  orthoBannerHighImpact: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  orthoBannerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  orthoBannerDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  robotCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: '#0a0d16',
    height: 315,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    shadowColor: Colors.brand.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  robotImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 15, 0.25)',
  },
  scanLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
  },
  laserCore: {
    height: 3,
    backgroundColor: Colors.brand.accent,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  holoTopBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 15, 30, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  holoPillText: {
    color: '#E0F2FE',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 15, 30, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  modelPillSpeaking: {
    borderColor: 'rgba(16, 185, 129, 0.6)',
    backgroundColor: 'rgba(6, 78, 59, 0.6)',
  },
  modelPillText: {
    color: Colors.brand.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  metricsOverlay: {
    position: 'absolute',
    bottom: 38,
    left: 12,
    gap: 4,
  },
  metricTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10, 15, 25, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.brand.accent,
  },
  metricTagLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  metricTagValue: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  holoFooter: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 12, 20, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  holoFooterText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '600',
  },
  cadenceCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    gap: Spacing.md,
  },
  cadenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cadenceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cadenceTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tempoSpeedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  tempoSpeedBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cadenceSubtitle: {
    color: Colors.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  cadenceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  voiceBtnActive: {
    borderColor: Colors.brand.accent,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  cadenceToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.brand.accent,
  },
  cadenceToggleBtnActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  cadenceToggleBtnBriefing: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  cadenceToggleText: {
    color: Colors.brand.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cadenceToggleTextActive: {
    color: '#FFFFFF',
  },
  cadenceToggleTextBriefing: {
    color: '#F59E0B',
  },
  phaseStepsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },

  // Panel Holográfico de Cuenta Atrás Táctica de 3 Segundos
  countdownBox: {
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  countdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  countdownSystemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  countdownSystemText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  countdownCadenceHint: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  countdownCircleWrapper: {
    marginVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownOuterRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  countdownRingCyan: {
    borderColor: '#00F0FF',
    shadowColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  countdownRingViolet: {
    borderColor: '#A855F7',
    shadowColor: '#A855F7',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  countdownRingEmerald: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  countdownBigNumber: {
    fontSize: 58,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  countdownPostureAdvice: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  countdownSubtext: {
    color: Colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  countdownSkipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  countdownSkipBtnText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  phaseStepBox: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 76,
    justifyContent: 'center',
  },
  phaseStepBoxActive: {
    borderColor: Colors.brand.accent,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  phaseStepBoxActiveHold: {
    borderColor: Colors.brand.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  phaseStepBoxActiveUp: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  phaseStepNum: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  phaseStepName: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  phaseStepSub: {
    color: Colors.text.muted,
    fontSize: 9,
    marginTop: 3,
  },
  phaseStepNameActive: {
    color: Colors.brand.accent,
  },
  phaseStepNameActiveHold: {
    color: Colors.brand.primary,
  },
  phaseStepNameActiveUp: {
    color: '#10B981',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.brand.accent,
  },
  countdownBadgeHold: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    borderColor: Colors.brand.primary,
  },
  countdownBadgeUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: '#10B981',
  },
  countdownBadgeText: {
    color: Colors.brand.accent,
    fontSize: 11,
    fontWeight: 'bold',
  },
  repTrackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  repCounterBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  repCounterLabel: {
    color: Colors.text.muted,
    fontSize: 12,
  },
  repCounterValue: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
  },
  repCounterTarget: {
    color: Colors.text.muted,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'normal',
  },
  repButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  repAdjustBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  repAdjustBtnAdd: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  sectionCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  sectionCardBriefing: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1.5,
  },
  briefingActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  briefingActiveText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tourBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  tourBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  tourBtnText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tourBtnTextActive: {
    color: '#EF4444',
  },
  exerciseName: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
  },
  questDescription: {
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
  },
  musclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  muscleBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  muscleText: {
    color: Colors.brand.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  paramGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  paramCard: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  xpParamCard: {
    borderColor: 'rgba(124, 58, 237, 0.4)',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  paramLabel: {
    color: Colors.text.muted,
    fontSize: Fonts.sizes.xs,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  paramValue: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  xpParamValue: {
    color: Colors.brand.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  stepsList: {
    gap: Spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
  },
  stepItemActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderRadius: Radius.md,
    padding: 6,
    marginHorizontal: -6,
  },
  stepNumberBadgeActive: {
    backgroundColor: '#00F0FF',
  },
  stepTextActive: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  cortexCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    gap: Spacing.sm,
  },
  cortexHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cortexName: {
    color: Colors.brand.accent,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cortexRole: {
    color: Colors.text.muted,
    fontSize: 10,
  },
  cortexMessage: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg.secondary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  completedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  completedBtnText: {
    color: '#10B981',
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
});
