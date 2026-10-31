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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import {
  SMARTWATCH_BRANDS,
  type SmartwatchBrand,
} from '../../constants/smartwatch';
import { useSmartwatchStore } from '../../stores/smartwatchStore';
import { Haptics } from '../../services/haptics';

interface SmartwatchSyncModalProps {
  visible: boolean;
  onClose: () => void;
  onStartAdaptedWorkout?: () => void;
}

export function SmartwatchSyncModal({
  visible,
  onClose,
  onStartAdaptedWorkout,
}: SmartwatchSyncModalProps) {
  const {
    brand,
    deviceName,
    isConnected,
    isSyncing,
    autoSync,
    metrics,
    adaptiveWorkout,
    congratulations,
    connectSmartwatch,
    disconnectSmartwatch,
    syncSmartwatch,
    simulatePreset,
    playCongratulationVoice,
    toggleAutoSync,
  } = useSmartwatchStore();

  const [selectedBrand, setSelectedBrand] = useState<SmartwatchBrand>(brand || 'samsung');
  const [selectedModel, setSelectedModel] = useState<string>(
    deviceName || SMARTWATCH_BRANDS[selectedBrand].popularModels[0]
  );
  const [activeTab, setActiveTab] = useState<'metrics' | 'diagnostics' | 'congrats'>('metrics');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const syncSpinAnim = useRef(new Animated.Value(0)).current;

  // Latido del corazón
  useEffect(() => {
    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );
    heartbeat.start();
    return () => heartbeat.stop();
  }, []);

  // Animación de sincronización
  useEffect(() => {
    if (isSyncing) {
      Animated.loop(
        Animated.timing(syncSpinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      syncSpinAnim.setValue(0);
    }
  }, [isSyncing]);

  const activeBrandConfig = SMARTWATCH_BRANDS[selectedBrand];

  const handleBrandSelect = (b: SmartwatchBrand) => {
    setSelectedBrand(b);
    setSelectedModel(SMARTWATCH_BRANDS[b].popularModels[0]);
    Haptics.light();
  };

  const handleConnect = async () => {
    await connectSmartwatch(selectedBrand, selectedModel);
  };

  const handleDisconnect = async () => {
    await disconnectSmartwatch();
  };

  const spin = syncSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const stepProgress = Math.min(100, Math.round((metrics.steps / metrics.stepGoal) * 100));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="watch" size={20} color="#00F0FF" />
            <Text style={styles.headerTitle}>NEXO SMARTWATCH & BIOMETRÍA</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* ================= SELECTOR DE MARCAS SOPORTADAS ================= */}
          <Text style={styles.sectionHeading}>1. DISPOSITIVOS COMPATIBLES</Text>
          <View style={styles.brandsGrid}>
            {(Object.keys(SMARTWATCH_BRANDS) as SmartwatchBrand[]).map((b) => {
              const cfg = SMARTWATCH_BRANDS[b];
              const isCurrent = selectedBrand === b;
              const isCurrentlyConnected = isConnected && brand === b;

              return (
                <TouchableOpacity
                  key={b}
                  style={[
                    styles.brandCard,
                    isCurrent && { borderColor: cfg.accentColor, backgroundColor: cfg.glowColor.replace('0.4', '0.12') },
                  ]}
                  onPress={() => handleBrandSelect(b)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.brandIconWrap, { backgroundColor: cfg.accentColor + '22' }]}>
                    <Ionicons name={cfg.icon as any} size={22} color={cfg.accentColor} />
                  </View>
                  <Text style={[styles.brandName, isCurrent && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                    {cfg.name}
                  </Text>
                  <Text style={styles.brandModelsSub}>{cfg.popularModels[0].split(' ')[0]}</Text>

                  {isCurrentlyConnected && (
                    <View style={styles.connectedBadgeSmall}>
                      <View style={styles.greenPulseDot} />
                      <Text style={styles.connectedBadgeSmallText}>ACTIVO</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ================= ESTADO DE VINCULACIÓN ================= */}
          <View style={[styles.connectionCard, { borderColor: activeBrandConfig.accentColor + '55' }]}>
            <View style={styles.connectionCardHeader}>
              <View>
                <Text style={[styles.protocolBadge, { color: activeBrandConfig.accentColor }]}>
                  {activeBrandConfig.badge}
                </Text>
                <Text style={styles.deviceNameDisplay}>
                  {isConnected && brand === selectedBrand ? deviceName : selectedModel}
                </Text>
                <Text style={styles.protocolDescriptionText}>{activeBrandConfig.protocolName}</Text>
              </View>

              <View style={styles.batteryContainer}>
                <Ionicons name="battery-charging" size={16} color="#10B981" />
                <Text style={styles.batteryText}>{metrics.batteryLevel}%</Text>
              </View>
            </View>

            {/* Selector de Modelo si aún no está conectado a esta marca */}
            {(!isConnected || brand !== selectedBrand) && (
              <View style={styles.modelsPickerContainer}>
                <Text style={styles.modelPickerLabel}>Seleccionar Modelo de {activeBrandConfig.name}:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelsRow}>
                  {activeBrandConfig.popularModels.map((model) => (
                    <TouchableOpacity
                      key={model}
                      style={[
                        styles.modelPill,
                        selectedModel === model && {
                          backgroundColor: activeBrandConfig.accentColor,
                          borderColor: activeBrandConfig.accentColor,
                        },
                      ]}
                      onPress={() => {
                        setSelectedModel(model);
                        Haptics.light();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.modelPillText,
                          selectedModel === model && { color: '#07090E', fontWeight: 'bold' },
                        ]}
                      >
                        {model}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Botón Conectar / Desconectar */}
            <View style={styles.connectionActionsRow}>
              {isConnected && brand === selectedBrand ? (
                <>
                  <TouchableOpacity
                    style={[styles.syncNowBtn, { backgroundColor: activeBrandConfig.accentColor }]}
                    onPress={() => syncSmartwatch()}
                    disabled={isSyncing}
                    activeOpacity={0.8}
                  >
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Ionicons name="sync" size={18} color="#07090E" />
                    </Animated.View>
                    <Text style={styles.syncNowBtnText}>
                      {isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR DATOS'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.disconnectBtn}
                    onPress={handleDisconnect}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                    <Text style={styles.disconnectBtnText}>Desvincular</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.connectDeviceBtn, { backgroundColor: activeBrandConfig.accentColor }]}
                  onPress={handleConnect}
                  activeOpacity={0.85}
                >
                  <Ionicons name="bluetooth" size={18} color="#07090E" />
                  <Text style={styles.connectDeviceBtnText}>
                    VINCULAR CON {activeBrandConfig.name.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sincronización Automática Toggle */}
            {isConnected && (
              <View style={styles.autoSyncRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.autoSyncTitle}>Telemetría en Segundo Plano</Text>
                  <Text style={styles.autoSyncSubtitle}>
                    Última sincronización: {metrics.lastSyncTime}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.autoSyncToggle, autoSync && styles.autoSyncToggleActive]}
                  onPress={toggleAutoSync}
                  activeOpacity={0.8}
                >
                  <Text style={styles.autoSyncToggleText}>{autoSync ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ================= TABS: MÉTRICAS / ENTRENAMIENTO ASIGNADO / FELICITACIONES ================= */}
          {isConnected && (
            <>
              <View style={styles.tabNavRow}>
                <TouchableOpacity
                  style={[styles.tabNavBtn, activeTab === 'metrics' && styles.tabNavBtnActive]}
                  onPress={() => setActiveTab('metrics')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabNavBtnText, activeTab === 'metrics' && styles.tabNavBtnTextActive]}>
                    📊 Telemetría
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabNavBtn, activeTab === 'diagnostics' && styles.tabNavBtnActive]}
                  onPress={() => setActiveTab('diagnostics')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabNavBtnText, activeTab === 'diagnostics' && styles.tabNavBtnTextActive]}>
                    🎯 Rutina Asignada
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabNavBtn, activeTab === 'congrats' && styles.tabNavBtnActive]}
                  onPress={() => setActiveTab('congrats')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabNavBtnText, activeTab === 'congrats' && styles.tabNavBtnTextActive]}>
                    🏆 Felicitaciones ({congratulations.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ========== TAB 1: TELEMETRÍA EN VIVO ========== */}
              {activeTab === 'metrics' && (
                <View style={styles.tabContentContainer}>
                  {/* Grid de 4 Métricas */}
                  <View style={styles.metricsGrid}>
                    {/* Pasos */}
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeaderRow}>
                        <Text style={styles.metricEmoji}>👟</Text>
                        <Text style={styles.metricBadge}>{stepProgress}% meta</Text>
                      </View>
                      <Text style={styles.metricBigNumber}>{metrics.steps.toLocaleString()}</Text>
                      <Text style={styles.metricLabel}>Pasos Hoy ({metrics.stepGoal.toLocaleString()} meta)</Text>
                      <View style={styles.metricMiniTrack}>
                        <View style={[styles.metricMiniFill, { width: `${stepProgress}%`, backgroundColor: '#00F0FF' }]} />
                      </View>
                    </View>

                    {/* Frecuencia Cardíaca */}
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeaderRow}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                          <Ionicons name="heart" size={20} color="#EF4444" />
                        </Animated.View>
                        <Text style={[styles.metricBadge, { color: '#EF4444' }]}>En reposo {metrics.restingHeartRate}</Text>
                      </View>
                      <Text style={styles.metricBigNumber}>{metrics.currentHeartRate} <Text style={{ fontSize: 13 }}>BPM</Text></Text>
                      <Text style={styles.metricLabel}>Pico hoy: {metrics.maxHeartRateToday} BPM</Text>
                      <Text style={styles.metricSubInfo}>Zona Anabólica Óptima</Text>
                    </View>

                    {/* Calorías Activas */}
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeaderRow}>
                        <Text style={styles.metricEmoji}>🔥</Text>
                        <Text style={styles.metricBadge}>{metrics.activeCalories}/{metrics.calorieGoal}</Text>
                      </View>
                      <Text style={styles.metricBigNumber}>{metrics.activeCalories} <Text style={{ fontSize: 13 }}>kcal</Text></Text>
                      <Text style={styles.metricLabel}>Gasto Energético Activo</Text>
                      <View style={styles.metricMiniTrack}>
                        <View
                          style={[
                            styles.metricMiniFill,
                            {
                              width: `${Math.min(100, (metrics.activeCalories / metrics.calorieGoal) * 100)}%`,
                              backgroundColor: '#F59E0B',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Sueño & Vitalidad */}
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeaderRow}>
                        <Text style={styles.metricEmoji}>💤</Text>
                        <Text style={[styles.metricBadge, { color: '#10B981' }]}>{metrics.sleepQuality}% calidad</Text>
                      </View>
                      <Text style={styles.metricBigNumber}>{metrics.sleepHours} <Text style={{ fontSize: 13 }}>hrs</Text></Text>
                      <Text style={styles.metricLabel}>Vitalidad: {metrics.readinessScore}%</Text>
                      <Text style={styles.metricSubInfo}>Estrés: {metrics.stressLevel === 'low' ? 'Bajo (Relajado)' : 'Moderado'}</Text>
                    </View>
                  </View>

                  {/* Simulador Biométrico para Probar Adaptabilidad y Felicitaciones */}
                  <View style={styles.simulatorCard}>
                    <View style={styles.simulatorHeader}>
                      <Ionicons name="flask-outline" size={16} color="#00F0FF" />
                      <Text style={styles.simulatorTitle}>CALIBRADOR / SIMULADOR DE BIOMETRÍA</Text>
                    </View>
                    <Text style={styles.simulatorSub}>
                      Selecciona un escenario biométrico para observar en tiempo real cómo CORTEX reajusta los ejercicios asignados y emite felicitaciones por voz:
                    </Text>

                    <View style={styles.simulatorButtonsRow}>
                      <TouchableOpacity
                        style={styles.simPresetBtn}
                        onPress={() => simulatePreset('peak_performance')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.simPresetBtnEmoji}>🦁</Text>
                        <Text style={styles.simPresetBtnTitle}>Modo Élite</Text>
                        <Text style={styles.simPresetBtnSub}>10.4k pasos, 95% Vitalidad</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.simPresetBtn}
                        onPress={() => simulatePreset('fatigue_low_sleep')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.simPresetBtnEmoji}>😴</Text>
                        <Text style={styles.simPresetBtnTitle}>Fatiga / Sueño Bajo</Text>
                        <Text style={styles.simPresetBtnSub}>5.1h sueño, 78 BPM basal</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.simulatorButtonsRow}>
                      <TouchableOpacity
                        style={styles.simPresetBtn}
                        onPress={() => simulatePreset('sedentary_steps')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.simPresetBtnEmoji}>🚶</Text>
                        <Text style={styles.simPresetBtnTitle}>Déficit Pasos</Text>
                        <Text style={styles.simPresetBtnSub}>2,310 pasos, sedentario</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.simPresetBtn}
                        onPress={() => simulatePreset('extreme_calorie_burn')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.simPresetBtnEmoji}>🔥</Text>
                        <Text style={styles.simPresetBtnTitle}>Alta Combustión</Text>
                        <Text style={styles.simPresetBtnSub}>680 kcal, 12.8k pasos</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* ========== TAB 2: RUTINA ADAPTADA POR SMARTWATCH ========== */}
              {activeTab === 'diagnostics' && (
                <View style={styles.tabContentContainer}>
                  <View style={styles.workoutAssignedCard}>
                    <View style={styles.workoutBadgeRow}>
                      <View style={styles.cortexBrainIcon}>
                        <Ionicons name="hardware-chip-outline" size={16} color="#00F0FF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.workoutAssignedHeader}>DIRECTIVA CORTEX AUTOMATIZADA</Text>
                        <Text style={styles.workoutAssignedSub}>{adaptiveWorkout.subtitle}</Text>
                      </View>
                    </View>

                    <Text style={styles.workoutAssignedTitle}>{adaptiveWorkout.title}</Text>

                    {/* Cuadro de Diagnóstico CORTEX */}
                    <View style={styles.diagnosisBox}>
                      <Text style={styles.diagnosisReasonText}>
                        <Text style={{ fontWeight: 'bold', color: '#00F0FF' }}>Parámetro disparador:{' '}</Text>
                        {adaptiveWorkout.triggerReason}
                      </Text>
                      <Text style={styles.diagnosisBodyText}>{adaptiveWorkout.cortexDiagnosis}</Text>
                    </View>

                    {/* Lista de ejercicios asignados */}
                    <Text style={styles.exercisesListHeading}>EJERCICIOS ASIGNADOS ({adaptiveWorkout.exercises.length}):</Text>
                    {adaptiveWorkout.exercises.map((ex, i) => (
                      <View key={ex.id} style={styles.exerciseItemRow}>
                        <View style={styles.exerciseItemIndex}>
                          <Text style={styles.exerciseItemIndexText}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.exerciseItemName}>{ex.name}</Text>
                          <Text style={styles.exerciseItemReps}>{ex.sets} series • {ex.reps}</Text>
                          <Text style={styles.exerciseItemMuscles}>{ex.muscles.join(', ')}</Text>
                        </View>
                      </View>
                    ))}

                    <View style={styles.rewardSummaryRow}>
                      <View style={styles.rewardSummaryPill}>
                        <Ionicons name="sparkles" size={14} color="#F59E0B" />
                        <Text style={styles.rewardSummaryText}>+{adaptiveWorkout.xpReward} XP</Text>
                      </View>
                      <View style={styles.rewardSummaryPill}>
                        <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                        <Text style={styles.rewardSummaryText}>+{adaptiveWorkout.vitalityGain} Vitalidad</Text>
                      </View>
                      <View style={styles.rewardSummaryPill}>
                        <Ionicons name="flash" size={14} color="#00F0FF" />
                        <Text style={styles.rewardSummaryText}>+{adaptiveWorkout.strengthGain} Fuerza</Text>
                      </View>
                    </View>

                    {onStartAdaptedWorkout && (
                      <TouchableOpacity
                        style={styles.startWorkoutBtn}
                        onPress={() => {
                          onClose();
                          onStartAdaptedWorkout();
                        }}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="play" size={18} color="#07090E" />
                        <Text style={styles.startWorkoutBtnText}>INICIAR ESTE ENTRENAMIENTO ADAPTADO</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* ========== TAB 3: FELICITACIONES REGISTRADAS ========== */}
              {activeTab === 'congrats' && (
                <View style={styles.tabContentContainer}>
                  {congratulations.length === 0 ? (
                    <View style={styles.emptyCongratsContainer}>
                      <Text style={styles.emptyCongratsEmoji}>🎖️</Text>
                      <Text style={styles.emptyCongratsTitle}>Sin Felicitaciones Aún</Text>
                      <Text style={styles.emptyCongratsSub}>
                        Cumple tu meta de 10,000 pasos, supera las 500 kcal o duerme 7.5h para que CORTEX emita condecoraciones biomecánicas.
                      </Text>
                    </View>
                  ) : (
                    congratulations.map((congrat) => (
                      <View key={congrat.id} style={styles.congratCard}>
                        <View style={styles.congratHeaderRow}>
                          <Text style={styles.congratEmoji}>{congrat.badgeEmoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.congratTitle}>{congrat.title}</Text>
                            <Text style={styles.congratDate}>{congrat.dateLabel} • {congrat.metricValue}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.speechVoiceBtn}
                            onPress={() => playCongratulationVoice(congrat.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="volume-high" size={18} color="#00F0FF" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.congratMessage}>{congrat.message}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    letterSpacing: 0.5,
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
  },
  sectionHeading: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  brandCard: {
    width: '48%',
    backgroundColor: '#0D111A',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  brandIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  brandName: {
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },
  brandModelsSub: {
    color: Colors.text.muted,
    fontSize: 11,
  },
  connectedBadgeSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  connectedBadgeSmallText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: 'bold',
  },
  connectionCard: {
    backgroundColor: '#0A0E17',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },
  connectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  protocolBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  deviceNameDisplay: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
  },
  protocolDescriptionText: {
    color: Colors.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  batteryText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modelsPickerContainer: {
    marginBottom: Spacing.md,
  },
  modelPickerLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginBottom: 6,
  },
  modelsRow: {
    gap: 8,
  },
  modelPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#141A26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modelPillText: {
    color: Colors.text.secondary,
    fontSize: 11,
  },
  connectionActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  connectDeviceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  connectDeviceBtnText: {
    color: '#07090E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  syncNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  syncNowBtnText: {
    color: '#07090E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  disconnectBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  autoSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  autoSyncTitle: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  autoSyncSubtitle: {
    color: Colors.text.muted,
    fontSize: 10,
    marginTop: 2,
  },
  autoSyncToggle: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: '#1E293B',
  },
  autoSyncToggleActive: {
    backgroundColor: '#10B981',
  },
  autoSyncToggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabNavRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    backgroundColor: '#0D111A',
    borderRadius: Radius.md,
    padding: 4,
  },
  tabNavBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  tabNavBtnActive: {
    backgroundColor: '#1A2333',
  },
  tabNavBtnText: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  tabNavBtnTextActive: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  tabContentContainer: {
    marginBottom: Spacing.xl,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#0D111A',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricEmoji: {
    fontSize: 18,
  },
  metricBadge: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: 'bold',
  },
  metricBigNumber: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: Colors.text.secondary,
    fontSize: 10,
    marginTop: 2,
  },
  metricSubInfo: {
    color: '#10B981',
    fontSize: 9,
    marginTop: 4,
    fontWeight: 'bold',
  },
  metricMiniTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#1A2333',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  metricMiniFill: {
    height: '100%',
    borderRadius: 2,
  },
  simulatorCard: {
    backgroundColor: '#0A0E17',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  simulatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  simulatorTitle: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  simulatorSub: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  simulatorButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  simPresetBtn: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  simPresetBtnEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  simPresetBtnTitle: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  simPresetBtnSub: {
    color: Colors.text.muted,
    fontSize: 9,
    marginTop: 2,
  },
  workoutAssignedCard: {
    backgroundColor: '#0D121D',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  workoutBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cortexBrainIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutAssignedHeader: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  workoutAssignedSub: {
    color: Colors.text.muted,
    fontSize: 11,
  },
  workoutAssignedTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    marginVertical: Spacing.sm,
  },
  diagnosisBox: {
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    marginBottom: Spacing.md,
  },
  diagnosisReasonText: {
    color: Colors.text.primary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
  },
  diagnosisBodyText: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 17,
  },
  exercisesListHeading: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  exerciseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#121927',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: 6,
  },
  exerciseItemIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00F0FF22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseItemIndexText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  exerciseItemName: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  exerciseItemReps: {
    color: '#10B981',
    fontSize: 11,
  },
  exerciseItemMuscles: {
    color: Colors.text.muted,
    fontSize: 9,
  },
  rewardSummaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: Spacing.md,
  },
  rewardSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A2333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  rewardSummaryText: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  startWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00F0FF',
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: 4,
  },
  startWorkoutBtnText: {
    color: '#07090E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  congratCard: {
    backgroundColor: '#0D111A',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: Spacing.sm,
  },
  congratHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  congratEmoji: {
    fontSize: 24,
  },
  congratTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  congratDate: {
    color: Colors.text.muted,
    fontSize: 10,
  },
  speechVoiceBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  congratMessage: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 17,
  },
  emptyCongratsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyCongratsEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyCongratsTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyCongratsSub: {
    color: Colors.text.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.lg,
  },
});
