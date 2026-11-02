import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { SafeScreen } from '../ui/SafeScreen';
import { Ionicons } from '@expo/vector-icons';
import { CortexVoice } from '../../services/cortexVoice';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../stores/userStore';
import { Haptics } from '../../services/haptics';
import { SoundEffects } from '../../services/soundEffects';
import { resolveExerciseGuide } from '../../constants/exercises';
import { ExerciseMedia } from '../ui/ExerciseMedia';

interface RecoveryStation {
  id: string;
  name: string;
  durationSeconds: number;
  muscles: string;
  instructions: string;
  cortexTip: string;
  emoji: string;
  robotImageKey: string;
}

const RECOVERY_STATIONS: RecoveryStation[] = [
  {
    id: '1167',
    name: 'Descompresión Pectoral Dinámica',
    durationSeconds: 45,
    muscles: 'Pectorales, Deltoides Anterior y Bíceps',
    instructions: 'Ponte de pie con la espalda erguida. Abre los brazos en cruz expandiendo el pecho y crúzalos al frente alternando de forma rítmica y controlada.',
    cortexTip: 'Inhala al expandir la caja torácica y exhala al cruzar los brazos. La oscilación controlada libera la fascia pectoral y activa la circulación post-ejercicio.',
    emoji: '🧘‍♂️',
    robotImageKey: '1167',
  },
  {
    id: '1346',
    name: 'Alargamiento Dorsal & Espalda en Rodillas',
    durationSeconds: 45,
    muscles: 'Dorsal Ancho, Columna Vertebral y Redondo Mayor',
    instructions: 'Arrodíllate en el suelo con rodillas al ancho de caderas, extiende los brazos por encima de la cabeza y flexiona el torso lateralmente de manera suave sintiendo el estiramiento dorsal.',
    cortexTip: 'Permite que la columna se descomprima sin tensión. Disipa la compresión axial provocada por cargas pesadas.',
    emoji: '🙇‍♂️',
    robotImageKey: '1346',
  },
  {
    id: '1511',
    name: 'Elongación de Isquiotibiales & Cadena Posterior',
    durationSeconds: 45,
    muscles: 'Isquiotibiales, Glúteos y Zona Poplítea',
    instructions: 'De pie, da un paso corto al frente manteniendo el talón apoyado. Inclínate hacia adelante desde las caderas con la espalda neutra buscando la punta del pie.',
    cortexTip: 'Mantén un micro-bloqueo en la rodilla sin hiperextender. Respira profundamente sintiendo la liberación en la parte posterior del muslo.',
    emoji: '🦵',
    robotImageKey: '1511',
  },
  {
    id: '1494',
    name: 'Postura de Mariposa & Apertura Pélvica',
    durationSeconds: 45,
    muscles: 'Aductores, Fascia Pélvica y Flexores de Cadera',
    instructions: 'Siéntate en el suelo con la columna erguida, junta las plantas de los pies y deja caer las rodillas hacia los costados sujetando tus pies con ambas manos.',
    cortexTip: 'No realices rebotes bruscos. Permite que la gravedad y una respiración profunda relajen los aductores y la articulación coxofemoral.',
    emoji: '🦋',
    robotImageKey: '1494',
  },
  {
    id: '1424',
    name: 'Elongación Piriforme & Glúteos Sentado',
    durationSeconds: 45,
    muscles: 'Glúteo Mayor, Piriforme y Rotadores de Cadera',
    instructions: 'Siéntate en el suelo con piernas al frente, dobla una rodilla cruzando el tobillo sobre el muslo opuesto y presiona suavemente la rodilla hacia afuera mientras mantienes el torso recto.',
    cortexTip: 'Descomprime el trayecto del nervio ciático y alivia la tensión pélvica acumulada tras sentadillas o saltos.',
    emoji: '🤸‍♂️',
    robotImageKey: '1424',
  },
  {
    id: '1403',
    name: 'Liberación Cervical & Trapecios',
    durationSeconds: 45,
    muscles: 'Trapecio Superior, Elevador de la Escápula y Cuello',
    instructions: 'Siéntate o mantente de pie erguido con los hombros relajados. Inclina suavemente la cabeza llevando la oreja hacia el hombro lateral respirando con serenidad.',
    cortexTip: 'Mantén los hombros relajados y abajo. La musculatura del cuello responde mejor a la calma y el estiramiento progresivo sin forzar.',
    emoji: '🌿',
    robotImageKey: '1403',
  },
];

interface RecoveryModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function RecoveryModal({ visible, onClose, onComplete }: RecoveryModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <RecoveryContent onClose={onClose} onComplete={onComplete} />
    </Modal>
  );
}

function RecoveryContent({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete?: () => void;
}) {
  const { addXP } = useUserStore();
  const [stationIndex, setStationIndex] = useState(0);
  const [isBriefing, setIsBriefing] = useState(true);
  const [isCounting, setIsCounting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RECOVERY_STATIONS[0].durationSeconds);
  const [isActive, setIsActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const currentStation = RECOVERY_STATIONS[stationIndex] || RECOVERY_STATIONS[0];
  const pulseAnim = useRef(new Animated.Value(0.96)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const isBriefingRef = useRef(isBriefing);

  // Cuenta atrás táctica de 3 segundos post-explicación antes de iniciar el estiramiento
  const [preCountdown, setPreCountdown] = useState<number | null>(null);
  const preCountdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    isBriefingRef.current = isBriefing;
  }, [isBriefing]);

  // Detener voz y temporizador al desmontar
  useEffect(() => {
    return () => {
      if (preCountdownTimerRef.current) {
        clearInterval(preCountdownTimerRef.current);
        preCountdownTimerRef.current = null;
      }
      CortexVoice.stop();
    };
  }, []);

  // Animación continua de scanner láser holográfico sobre la imagen del robot
  useEffect(() => {
    const scanner = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    scanner.start();
    return () => scanner.stop();
  }, []);

  // Animación suave de respiración
  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, []);

  // Iniciar la cuenta atrás de 3 segundos con señales audiovisuales y hápticas
  const startPreStationCountdown = () => {
    if (preCountdownTimerRef.current) {
      clearInterval(preCountdownTimerRef.current);
      preCountdownTimerRef.current = null;
    }
    CortexVoice.stop();
    setIsBriefing(false);
    setIsCounting(false);

    setPreCountdown(3);
    countdownScaleAnim.setValue(1.4);
    Animated.spring(countdownScaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();

    Haptics.medium();
    SoundEffects.playTick();
    CortexVoice.speak('Tres');

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
          CortexVoice.speak('Dos');
        } else if (count === 1) {
          Haptics.heavy();
          SoundEffects.playTick();
          CortexVoice.speak('Uno');
        }
      } else {
        if (preCountdownTimerRef.current) {
          clearInterval(preCountdownTimerRef.current);
          preCountdownTimerRef.current = null;
        }
        setPreCountdown(null);
        executeStartStationTimer();
      }
    }, 1000);
  };

  // Iniciar efectivamente el temporizador de 45s de la estación tras la cuenta atrás
  const executeStartStationTimer = () => {
    if (preCountdownTimerRef.current) {
      clearInterval(preCountdownTimerRef.current);
      preCountdownTimerRef.current = null;
    }
    setPreCountdown(null);
    setIsBriefing(false);
    setIsCounting(true);
    SoundEffects.playChime();
    Haptics.triumph();
    CortexVoice.speak('¡Iniciamos estiramiento! Respira profundo.');
  };

  // Iniciar estación: 1° Fase de Explicación / Briefing de CORTEX
  useEffect(() => {
    setIsBriefing(true);
    setIsCounting(false);
    if (preCountdownTimerRef.current) {
      clearInterval(preCountdownTimerRef.current);
      preCountdownTimerRef.current = null;
    }
    setPreCountdown(null);
    setSecondsLeft(currentStation.durationSeconds);
    setIsActive(true);

    SoundEffects.playNotice();
    Haptics.light();

    // Síntesis vocal humana de la explicación completa antes de iniciar el conteo
    CortexVoice.stop();
    const briefingText = `Estación ${stationIndex + 1}: ${currentStation.name}. ${currentStation.instructions}. ${currentStation.cortexTip}. Prepárate para iniciar.`;

    CortexVoice.speak(briefingText, {
      onDone: () => {
        startPreStationCountdown();
      },
      onError: () => {
        startPreStationCountdown();
      },
    });

    // Fallback de seguridad: si TTS se congela o no dispara onDone en 16 segundos, inicia automáticamente
    const safetyTimer = setTimeout(() => {
      startPreStationCountdown();
    }, 16000);

    return () => {
      clearTimeout(safetyTimer);
      CortexVoice.stop();
    };
  }, [stationIndex]);

  // Intervalo de segundo a segundo (SOLO cuando isCounting es true y no está en briefing ni countdown)
  useEffect(() => {
    if (!isActive || isFinished || isBriefing || !isCounting || preCountdown !== null) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleNextStation();
          return 0;
        }
        if (prev <= 5) {
          SoundEffects.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, stationIndex, isFinished, isBriefing, isCounting, preCountdown]);

  const handleNextStation = () => {
    if (preCountdownTimerRef.current) {
      clearInterval(preCountdownTimerRef.current);
      preCountdownTimerRef.current = null;
    }
    setPreCountdown(null);
    CortexVoice.stop();
    if (stationIndex < RECOVERY_STATIONS.length - 1) {
      Haptics.medium();
      setStationIndex((idx) => idx + 1);
    } else {
      finishRecovery();
    }
  };

  const handleSkipBriefing = () => {
    CortexVoice.stop();
    startPreStationCountdown();
  };

  const finishRecovery = async () => {
    if (preCountdownTimerRef.current) {
      clearInterval(preCountdownTimerRef.current);
      preCountdownTimerRef.current = null;
    }
    setPreCountdown(null);
    setIsFinished(true);
    setIsActive(false);
    setIsCounting(false);
    setIsBriefing(false);
    CortexVoice.stop();
    await addXP(25, 'vitality');
    SoundEffects.playLevelUp();
    Haptics.triumph();

    CortexVoice.speak(
      'Protocolo de enfriamiento concluido. Fibras musculares oxigenadas y frecuencia cardíaca normalizada. Has sumado 25 puntos de Vitalidad a tu perfil de Cazador.'
    );
  };

  const handleExit = () => {
    if (preCountdownTimerRef.current) {
      clearInterval(preCountdownTimerRef.current);
      preCountdownTimerRef.current = null;
    }
    setPreCountdown(null);
    CortexVoice.stop();
    if (onComplete) onComplete();
    onClose();
  };

  const progressPercent = Math.round(
    ((currentStation.durationSeconds - secondsLeft) / currentStation.durationSeconds) * 100
  );

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 275],
  });

  const stationGuide = resolveExerciseGuide(currentStation.robotImageKey || currentStation.name);

  return (
    <SafeScreen style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>PROTOCOLO DE ENFRIAMIENTO BIOLÓGICO</Text>
        </View>
        <TouchableOpacity onPress={handleExit} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {!isFinished ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Indicador de estaciones */}
          <View style={styles.stationsTrackRow}>
            {RECOVERY_STATIONS.map((st, i) => (
              <View
                key={st.id}
                style={[
                  styles.stationStepPill,
                  i === stationIndex && styles.stationStepPillActive,
                  i < stationIndex && styles.stationStepPillDone,
                ]}
              />
            ))}
          </View>
          <View style={styles.stepInfoRow}>
            <Text style={styles.stepCounterText}>
              Estación {stationIndex + 1} de {RECOVERY_STATIONS.length}
            </Text>
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isBriefing ? '#00F0FF' : '#10B981' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isBriefing ? '#00F0FF' : '#10B981' },
                ]}
              >
                {isBriefing ? 'FASE 1: EXPLICACIÓN' : 'FASE 2: CONTEO ACTIVO'}
              </Text>
            </View>
          </View>

          {/* ================= CONTENEDOR DEMOSTRACIÓN BIOMECÁNICA ================= */}
          <View style={styles.robotContainer}>
            <ExerciseMedia
              gifUrl={stationGuide.cdnGifUrl}
              rawGifUrl={stationGuide.rawGifUrl}
              thumbnailUrl={stationGuide.thumbnailUrl}
              style={styles.robotImage}
              resizeMode="contain"
            />

            {/* Escáner láser holográfico */}
            <Animated.View
              style={[
                styles.laserLine,
                {
                  transform: [{ translateY: scanTranslateY }],
                  borderColor: isBriefing ? '#00F0FF' : '#10B981',
                  shadowColor: isBriefing ? '#00F0FF' : '#10B981',
                },
              ]}
            />

            {/* Badges de telemetría y postura sobre la imagen */}
            <View style={styles.robotTelemetryHeader}>
              <View style={styles.telemetryTag}>
                <Ionicons name="hardware-chip-outline" size={12} color="#00F0FF" />
                <Text style={styles.telemetryTagText}>POSTURA DEMOSTRATIVA IA</Text>
              </View>
              <View style={styles.stationBadgeOverlay}>
                <Text style={styles.stationBadgeOverlayText}>45s ENFRIAMIENTO</Text>
              </View>
            </View>

            <View style={styles.robotTelemetryFooter}>
              <Text style={styles.biomechanicalTargetLabel}>CADENA MUSCULAR OBJETIVO:</Text>
              <Text style={styles.biomechanicalTargetText}>{currentStation.muscles}</Text>
            </View>
          </View>

          {/* ================= BANNER FASE 1: BRIEFING VOCAL DE CORTEX ================= */}
          {isBriefing && (
            <View style={styles.briefingBanner}>
              <View style={styles.briefingHeaderRow}>
                <View style={styles.audioWaveIcon}>
                  <Ionicons name="volume-high" size={18} color="#00F0FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.briefingTitle}>CORTEX Dictando Directiva Biomecánica</Text>
                  <Text style={styles.briefingSub}>
                    Escucha las instrucciones de la postura. El conteo iniciará al finalizar la voz.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.skipBriefingBtn}
                onPress={handleSkipBriefing}
                activeOpacity={0.8}
              >
                <Ionicons name="play-forward" size={16} color="#07090E" />
                <Text style={styles.skipBriefingBtnText}>OMITIR EXPLICACIÓN E INICIAR CONTEO</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ================= CÍRCULO TEMPORIZADOR FASE 2: CONTEO ================= */}
          <Animated.View
            style={[
              styles.timerCircle,
              {
                borderColor:
                  preCountdown !== null
                    ? preCountdown === 3
                      ? '#00F0FF'
                      : preCountdown === 2
                      ? '#A855F7'
                      : '#10B981'
                    : isBriefing
                    ? '#00F0FF'
                    : '#10B981',
                shadowColor:
                  preCountdown !== null
                    ? preCountdown === 3
                      ? '#00F0FF'
                      : preCountdown === 2
                      ? '#A855F7'
                      : '#10B981'
                    : isBriefing
                    ? '#00F0FF'
                    : '#10B981',
                transform: [
                  {
                    scale:
                      preCountdown !== null
                        ? countdownScaleAnim
                        : isBriefing
                        ? 1
                        : pulseAnim,
                  },
                ],
              },
            ]}
          >
            <Text style={styles.stationEmoji}>
              {preCountdown !== null ? '⏱️' : currentStation.emoji}
            </Text>
            <Text
              style={[
                styles.timerNumber,
                preCountdown !== null && {
                  fontSize: 54,
                  fontWeight: '900',
                  color:
                    preCountdown === 3
                      ? '#00F0FF'
                      : preCountdown === 2
                      ? '#A855F7'
                      : '#10B981',
                },
              ]}
            >
              {preCountdown !== null ? preCountdown : `${secondsLeft}s`}
            </Text>
            <Text
              style={[
                styles.timerLabel,
                {
                  color:
                    preCountdown !== null
                      ? '#00F0FF'
                      : isBriefing
                      ? '#00F0FF'
                      : '#10B981',
                },
              ]}
            >
              {preCountdown !== null
                ? preCountdown === 3
                  ? 'COLÓCATE EN POSICIÓN'
                  : preCountdown === 2
                  ? 'AJUSTA TU POSTURA'
                  : '¡TODO LISTO!'
                : isBriefing
                ? 'EN ESPERA (EXPLICACIÓN)'
                : 'RESPIRACIÓN PROFUNDA'}
            </Text>
          </Animated.View>

          {/* Barra de Progreso de la Estación */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: isBriefing || preCountdown !== null ? '0%' : `${progressPercent}%`,
                  backgroundColor: isBriefing || preCountdown !== null ? '#00F0FF' : '#10B981',
                },
              ]}
            />
          </View>

          {/* Tarjeta de Instrucción Técnica */}
          <View style={styles.infoCard}>
            <Text style={styles.stationName}>{currentStation.name}</Text>
            <View style={styles.muscleRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#10B981" />
              <Text style={styles.muscleText}>{currentStation.muscles}</Text>
            </View>
            <Text style={styles.instructionText}>{currentStation.instructions}</Text>

            <View style={styles.tipBox}>
              <Ionicons name="hardware-chip-outline" size={16} color="#00F0FF" />
              <Text style={styles.tipText}>{currentStation.cortexTip}</Text>
            </View>
          </View>

          {/* Controles de avance */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.pauseBtn}
              onPress={() => {
                if (preCountdown !== null) {
                  executeStartStationTimer();
                } else if (isBriefing) {
                  handleSkipBriefing();
                } else {
                  setIsActive(!isActive);
                  Haptics.light();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive && !isBriefing && preCountdown === null ? 'pause' : 'play'}
                size={20}
                color={Colors.text.primary}
              />
              <Text style={styles.pauseBtnText}>
                {preCountdown !== null
                  ? 'Comenzar Ya'
                  : isBriefing
                  ? 'Iniciar Ya'
                  : isActive
                  ? 'Pausar'
                  : 'Reanudar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => {
                Haptics.medium();
                handleNextStation();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.skipBtnText}>Siguiente Estación ›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Pantalla de Finalización */
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedEmoji}>🌿</Text>
          <Text style={styles.finishedTitle}>¡Recuperación Completada!</Text>
          <Text style={styles.finishedSub}>
            Tus fibras musculares han sido oxigenadas y tu sistema nervioso ha retornado al estado de regeneración anabólica.
          </Text>

          <View style={styles.rewardPill}>
            <Ionicons name="sparkles" size={18} color="#10B981" />
            <Text style={styles.rewardPillText}>+25 XP Vitalidad Otorgados</Text>
          </View>

          <TouchableOpacity style={styles.finishBtn} onPress={handleExit} activeOpacity={0.85}>
            <Text style={styles.finishBtnText}>VOLVER AL CUARTEL GENERAL</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  stationsTrackRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: Spacing.xs,
  },
  stationStepPill: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stationStepPillActive: {
    backgroundColor: '#10B981',
  },
  stationStepPillDone: {
    backgroundColor: '#00F0FF',
  },
  stepInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  stepCounterText: {
    color: Colors.text.muted,
    fontSize: 11,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Robot demonstration container
  robotContainer: {
    width: '100%',
    height: 285,
    backgroundColor: '#090D14',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotImage: {
    width: '100%',
    height: '100%',
  },
  laserLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderBottomWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  robotTelemetryHeader: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 12,
  },
  telemetryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(9, 13, 20, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  telemetryTagText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  stationBadgeOverlay: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  stationBadgeOverlayText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
  },
  robotTelemetryFooter: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(7, 9, 14, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 12,
  },
  biomechanicalTargetLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  biomechanicalTargetText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },

  // Briefing Banner
  briefingBanner: {
    width: '100%',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  briefingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  audioWaveIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingTitle: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  briefingSub: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  skipBriefingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00F0FF',
    borderRadius: Radius.md,
    paddingVertical: 10,
    marginTop: 4,
  },
  skipBriefingBtnText: {
    color: '#07090E',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  timerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#0D131A',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  stationEmoji: {
    fontSize: 30,
    marginBottom: 2,
  },
  timerNumber: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#121824',
    borderRadius: 3,
    marginVertical: Spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#0D111A',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: Spacing.lg,
  },
  stationName: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  muscleText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
  },
  instructionText: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  tipText: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.sm,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    backgroundColor: '#171B26',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pauseBtnText: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
  },
  skipBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: '#10B981',
    borderRadius: Radius.lg,
  },
  skipBtnText: {
    color: '#07090E',
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  finishedEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  finishedTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  finishedSub: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: Spacing.xl,
  },
  rewardPillText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  finishBtn: {
    width: '100%',
    paddingVertical: Spacing.md,
    backgroundColor: '#10B981',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    color: '#07090E',
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
});
