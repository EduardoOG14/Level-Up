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
import { SafeAreaView } from 'react-native-safe-area-context';
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
    id: 'chest_decompression',
    name: 'Descompresión Pectoral & Hombros',
    durationSeconds: 45,
    muscles: 'Pectorales, Deltoides Anterior y Bíceps',
    instructions: 'Entrelaza los dedos por detrás de tu espalda baja, eleva el esternón suavemente y respira profundo sintiendo cómo se abre la caja torácica.',
    cortexTip: 'No fuerces las articulaciones; el estiramiento debe sentirse como una liberación progresiva.',
    emoji: '🧘‍♂️',
    robotImageKey: 'stretch_chest',
  },
  {
    id: 'hamstring_stretch',
    name: 'Extensión Isquiotibial & Cadera',
    durationSeconds: 45,
    muscles: 'Isquiotibiales, Glúteos y Zona Lumbar',
    instructions: 'Con una pierna adelantada apoyando el talón, flexiona la cadera llevando los glúteos hacia atrás mientras mantienes el pecho erguido.',
    cortexTip: 'Mantiene la columna neutra para aislar correctamente la cadena posterior de las piernas.',
    emoji: '🦵',
    robotImageKey: 'stretch_hamstring',
  },
  {
    id: 'cobra_stretch',
    name: 'Postura de Cobra / Alargamiento Abdominal',
    durationSeconds: 45,
    muscles: 'Recto Abdominal, Psoas Ilíaco y Espalda',
    instructions: 'Tumbado boca abajo, coloca las palmas bajo los hombros y eleva suavemente el torso mirando al frente con los hombros lejos de las orejas.',
    cortexTip: 'La fascia abdominal se relaja y descomprime los discos intervertebrales.',
    emoji: '🐍',
    robotImageKey: 'stretch_cobra',
  },
  {
    id: 'neural_calm',
    name: 'Respiración Diafragmática & Calma Neural',
    durationSeconds: 45,
    muscles: 'Diafragma, Sistema Parasimpático y Mente',
    instructions: 'Cierra los ojos. Inhala despacio en 4 segundos inflando el abdomen, mantén el aire 2 segundos y exhala vaciando todo en 4 segundos.',
    cortexTip: 'Esta cadencia reduce el cortisol post-combate y prepara a tu cuerpo para la regeneración celular.',
    emoji: '✨',
    robotImageKey: 'stretch_calm',
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

  useEffect(() => {
    isBriefingRef.current = isBriefing;
  }, [isBriefing]);

  // Detener voz al desmontar
  useEffect(() => {
    return () => {
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

  // Transición segura: Iniciar Conteo de la Estación
  const startCountdown = () => {
    if (!isBriefingRef.current) return;
    setIsBriefing(false);
    setIsCounting(true);
    SoundEffects.playChime();
    Haptics.success();
  };

  // Iniciar estación: 1° Fase de Explicación / Briefing de CORTEX
  useEffect(() => {
    setIsBriefing(true);
    setIsCounting(false);
    setSecondsLeft(currentStation.durationSeconds);
    setIsActive(true);

    SoundEffects.playNotice();
    Haptics.light();

    // Síntesis vocal humana de la explicación completa antes de iniciar el conteo
    CortexVoice.stop();
    const briefingText = `Estación ${stationIndex + 1}: ${currentStation.name}. ${currentStation.instructions}. ${currentStation.cortexTip}. Iniciamos conteo.`;

    CortexVoice.speak(briefingText, {
      onDone: () => {
        startCountdown();
      },
      onError: () => {
        startCountdown();
      },
    });

    // Fallback de seguridad: si TTS se congela o no dispara onDone en 14 segundos, inicia automáticamente
    const safetyTimer = setTimeout(() => {
      startCountdown();
    }, 14000);

    return () => {
      clearTimeout(safetyTimer);
      CortexVoice.stop();
    };
  }, [stationIndex]);

  // Intervalo de segundo a segundo (SOLO cuando isCounting es true y no está en briefing)
  useEffect(() => {
    if (!isActive || isFinished || isBriefing || !isCounting) return;

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
  }, [isActive, stationIndex, isFinished, isBriefing, isCounting]);

  const handleNextStation = () => {
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
    startCountdown();
  };

  const finishRecovery = async () => {
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
    <SafeAreaView style={styles.safe}>
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
                borderColor: isBriefing ? '#00F0FF' : '#10B981',
                shadowColor: isBriefing ? '#00F0FF' : '#10B981',
                transform: [{ scale: isBriefing ? 1 : pulseAnim }],
              },
            ]}
          >
            <Text style={styles.stationEmoji}>{currentStation.emoji}</Text>
            <Text style={styles.timerNumber}>{secondsLeft}s</Text>
            <Text
              style={[
                styles.timerLabel,
                { color: isBriefing ? '#00F0FF' : '#10B981' },
              ]}
            >
              {isBriefing ? 'EN ESPERA (EXPLICACIÓN)' : 'RESPIRACIÓN PROFUNDA'}
            </Text>
          </Animated.View>

          {/* Barra de Progreso de la Estación */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: isBriefing ? '0%' : `${progressPercent}%`,
                  backgroundColor: isBriefing ? '#00F0FF' : '#10B981',
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
                if (isBriefing) {
                  // Si está en briefing y pausa, inicia de inmediato o frena
                  handleSkipBriefing();
                } else {
                  setIsActive(!isActive);
                  Haptics.light();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive && !isBriefing ? 'pause' : 'play'}
                size={20}
                color={Colors.text.primary}
              />
              <Text style={styles.pauseBtnText}>
                {isBriefing ? 'Iniciar Ya' : isActive ? 'Pausar' : 'Reanudar'}
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
    </SafeAreaView>
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
