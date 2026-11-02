import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeScreen } from '../../components/ui/SafeScreen';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/userStore';
import { useProgressStore } from '../../stores/progressStore';
import { WeeklyWeightModal } from '../../components/progress/WeeklyWeightModal';
import { MacroCalculatorCard } from '../../components/progress/MacroCalculatorCard';
import { XPBar } from '../../components/ui/XPBar';
import { RankBadge } from '../../components/ui/RankBadge';
import { getRankByXP, getXPForNextLevel, RANKS } from '../../constants/ranks';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { Haptics } from '../../services/haptics';

export default function ProgressScreen() {
  const { user } = useUserStore();
  const {
    weightLogs,
    loadProgress,
    getWeeklyCircuitsCount,
    getWeeklyQuestDaysCount,
    getWeeklyDaysBreakdown,
    isWeeklyCheckinDue,
  } = useProgressStore();

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [progressTab, setProgressTab] = useState<'performance' | 'biometrics'>('performance');

  // Animación de pulso continuo (Solo Leveling HUD)
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

  useEffect(() => {
    if (user?.uid) {
      loadProgress(user.uid);
    }
  }, [user?.uid]);

  const onRefresh = async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    await loadProgress(user.uid);
    setRefreshing(false);
  };

  if (!user) {
    return (
      <SafeScreen style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00F0FF" />
      </SafeScreen>
    );
  }

  const rank = getRankByXP(user.totalXP);
  const xpInfo = getXPForNextLevel(user.totalXP);

  // Aura de Cazador según Rango
  const rankAuraColor =
    rank.key === 'S' || rank.key === 'SS' || rank.key === 'SSS'
      ? '#EF4444'
      : rank.key === 'A'
      ? '#F59E0B'
      : rank.key === 'B'
      ? '#8B5CF6'
      : rank.key === 'C'
      ? '#3B82F6'
      : rank.key === 'D'
      ? '#10B981'
      : '#64748B';

  // Métricas de esta semana
  const weeklyCircuits = getWeeklyCircuitsCount();
  const weeklyQuestDays = getWeeklyQuestDaysCount();
  const weekDays = getWeeklyDaysBreakdown();
  const checkinDue = isWeeklyCheckinDue();

  // Métricas de peso
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : user.weight || 70;
  const initialWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : currentWeight;
  const totalChange = Number((currentWeight - initialWeight).toFixed(1));
  const latestChange = weightLogs.length > 1 ? weightLogs[0].change || 0 : 0;

  return (
    <SafeScreen style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00F0FF"
          />
        }
      >
        {/* Header Superior del Sistema */}
        <View style={styles.header}>
          <View style={styles.headerSystemBadgeRow}>
            <Animated.View style={[styles.headerLiveDot, { transform: [{ scale: liveScale }] }]} />
            <Text style={styles.headerSystemTag}>[ SISTEMA: TELEMETRÍA Y CALIBRACIÓN ]</Text>
            <Text style={styles.headerRankSubTag}>CORTEX V1.0</Text>
          </View>
        </View>

        {/* Selector de Pestañas Estilo Sistema Solo Leveling */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, progressTab === 'performance' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.light();
              setProgressTab('performance');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="analytics-outline"
              size={15}
              color={progressTab === 'performance' ? '#0A0A0F' : '#00F0FF'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                progressTab === 'performance' && styles.segmentBtnTextActive,
              ]}
            >
              [ 📊 Rendimiento & Stats ]
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, progressTab === 'biometrics' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.light();
              setProgressTab('biometrics');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="scale-outline"
              size={15}
              color={progressTab === 'biometrics' ? '#0A0A0F' : '#00F0FF'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                progressTab === 'biometrics' && styles.segmentBtnTextActive,
              ]}
            >
              [ ⚖️ Biometría & Macros ]
            </Text>
          </TouchableOpacity>
        </View>

        {progressTab === 'performance' ? (
          <>
            {/* ================= 1. RESUMEN TÁCTICO DE ESTA SEMANA ================= */}
            <Animated.View style={[styles.questsCard, { borderColor: borderPulse }]}>
              <View style={styles.questsCardHeader}>
                <View style={styles.questsTitleIconBox}>
                  <Ionicons name="flash-outline" size={17} color="#00F0FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questsCardTitle}>[ RENDIMIENTO TÁCTICO SEMANAL ]</Text>
                  <Text style={styles.questsCardSubtitle}>Semana en curso • Calibración en tiempo real</Text>
                </View>
              </View>

              <View style={styles.weeklyCountersRow}>
                {/* Contador de Circuitos Completados */}
                <View style={styles.weeklyCounterBox}>
                  <View style={styles.counterIconCircle}>
                    <Ionicons name="barbell-outline" size={18} color="#00F0FF" />
                  </View>
                  <Text style={styles.counterBigNumber}>{weeklyCircuits}</Text>
                  <Text style={styles.counterLabel}>Circuitos Superados</Text>
                  <View style={styles.metaBadgePill}>
                    <Text style={styles.metaBadgePillText}>
                      {weeklyCircuits >= 3 ? '✓ Objetivo Cumplido' : `${weeklyCircuits}/3 sugeridos`}
                    </Text>
                  </View>
                </View>

                {/* Contador de Días de Misiones Diarias Completadas */}
                <View style={styles.weeklyCounterBox}>
                  <View style={[styles.counterIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#F59E0B" />
                  </View>
                  <Text style={[styles.counterBigNumber, { color: '#F59E0B' }]}>
                    {weeklyQuestDays}<Text style={styles.counterSmallDenom}>/7</Text>
                  </Text>
                  <Text style={styles.counterLabel}>Días Misiones 5/5</Text>
                  <View style={[styles.metaBadgePill, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                    <Text style={[styles.metaBadgePillText, { color: '#F59E0B' }]}>
                      {weeklyQuestDays >= 5 ? '🔥 Gran Disciplina' : `${7 - weeklyQuestDays} días restan`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Mini Calendario de la Semana */}
              <View style={styles.weekCalendarSection}>
                <Text style={styles.weekCalendarTitle}>DÍAS DE DIRECTIVAS DIARIAS SUPERADAS</Text>
                <View style={styles.weekDaysGrid}>
                  {weekDays.map((d, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dayPill,
                        d.completed && styles.dayPillDone,
                        d.isToday && styles.dayPillToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPillName,
                          d.completed && styles.dayPillNameDone,
                          d.isToday && styles.dayPillNameToday,
                        ]}
                      >
                        {d.dayName}
                      </Text>
                      <View
                        style={[
                          styles.dayDot,
                          d.completed && styles.dayDotDone,
                          d.isToday && styles.dayDotToday,
                        ]}
                      >
                        {d.completed ? (
                          <Ionicons name="checkmark" size={11} color="#0A0A0F" />
                        ) : (
                          <Text style={styles.dayDotEmptyText}>•</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* ================= 2. RANGO Y NIVEL (SOLO LEVELING) ================= */}
            <View style={[styles.questsCard, { borderColor: rankAuraColor + '55' }]}>
              <View style={styles.questsCardHeader}>
                <View style={[styles.questsTitleIconBox, { backgroundColor: rankAuraColor + '22' }]}>
                  <Ionicons name="ribbon-outline" size={17} color={rankAuraColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.questsCardTitle, { color: rankAuraColor }]}>
                    [ RANGO & ASCENSO DEL CAZADOR ]
                  </Text>
                  <Text style={styles.questsCardSubtitle}>Asociación de Cazadores • Rango Oficial</Text>
                </View>
              </View>

              <View style={styles.rankRow}>
                <RankBadge rankKey={rank.key} size="lg" />
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{rank.name} • {rank.label}</Text>
                  <Text style={styles.rankDesc}>{rank.description}</Text>
                </View>
              </View>

              <XPBar
                current={xpInfo.current}
                required={xpInfo.required}
                progress={xpInfo.progress}
                level={user.level}
              />
            </View>

            {/* ================= 3. ATRIBUTOS DEL PERSONAJE (SOLO LEVELING) ================= */}
            <View style={styles.questsCard}>
              <View style={styles.questsCardHeader}>
                <View style={styles.questsTitleIconBox}>
                  <Ionicons name="shield-outline" size={17} color="#00F0FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questsCardTitle}>[ ATRIBUTOS DEL SISTEMA ]</Text>
                  <Text style={styles.questsCardSubtitle}>Distribución de parámetros biológicos</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                {[
                  { code: 'STR', name: 'FUERZA', value: user.stats?.strength || 10, color: '#EF4444', desc: 'Entrenamientos & Cargas' },
                  { code: 'AGI', name: 'AGILIDAD', value: user.stats?.agility || 10, color: '#F59E0B', desc: 'Cardio, Reflejos & Velocidad' },
                  { code: 'VIT', name: 'VITALIDAD', value: user.stats?.vitality || 10, color: '#10B981', desc: 'Hidratación & Nutrición' },
                  { code: 'INT', name: 'DISCIPLINA', value: user.stats?.discipline || 10, color: '#3B82F6', desc: 'Rachas Tácticas & Constancia' },
                  { code: 'PER', name: 'PERCEPCIÓN', value: user.stats?.mind || 10, color: '#8B5CF6', desc: 'Foco Mental & Descanso' },
                ].map((st) => (
                  <View key={st.code} style={styles.statCard}>
                    <View style={styles.statCardTop}>
                      <View style={[styles.statCodeBadge, { borderColor: st.color + '66', backgroundColor: st.color + '15' }]}>
                        <Text style={[styles.statCodeText, { color: st.color }]}>{st.code}</Text>
                      </View>
                      <Text style={styles.statNameText}>{st.name}</Text>
                      <Text style={[styles.statValueText, { color: st.color }]}>{st.value}</Text>
                    </View>
                    <Text style={styles.statDescText}>{st.desc}</Text>
                    <View style={styles.statMiniBarTrack}>
                      <View style={[styles.statMiniBarFill, { backgroundColor: st.color, width: `${Math.min(st.value * 3, 100)}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ================= 4. REGISTRO DE BATALLA ================= */}
            <View style={styles.questsCard}>
              <View style={styles.questsCardHeader}>
                <View style={styles.questsTitleIconBox}>
                  <Ionicons name="trophy-outline" size={17} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questsCardTitle}>[ REGISTRO DE BATALLA DEL CAZADOR ]</Text>
                  <Text style={styles.questsCardSubtitle}>Historial de combate y telemetría de carrera</Text>
                </View>
              </View>

              <View style={styles.battleGrid}>
                {[
                  { label: 'Total XP', value: user.totalXP.toLocaleString(), icon: '⚡', color: '#00F0FF' },
                  { label: 'Nivel', value: `${user.level}`, icon: '⭐', color: '#F59E0B' },
                  { label: 'Racha', value: `${user.streak} d`, icon: '🔥', color: '#EF4444' },
                  { label: 'Circuitos', value: `${user.workoutsCompleted}`, icon: '💪', color: '#10B981' },
                  { label: 'Misiones', value: `${user.questsCompleted}`, icon: '✅', color: '#3B82F6' },
                  { label: 'Rango', value: rank.key, icon: rank.emoji, color: rankAuraColor },
                ].map((item) => (
                  <View key={item.label} style={styles.battleCard}>
                    <Text style={styles.battleIcon}>{item.icon}</Text>
                    <Text style={[styles.battleValue, { color: item.color }]}>{item.value}</Text>
                    <Text style={styles.battleLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ================= 5. ESCALA DE RANGOS ================= */}
            <View style={styles.questsCard}>
              <View style={styles.questsCardHeader}>
                <View style={styles.questsTitleIconBox}>
                  <Ionicons name="layers-outline" size={17} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questsCardTitle}>[ ESCALA DE RANGOS DEL SISTEMA ]</Text>
                  <Text style={styles.questsCardSubtitle}>Jerarquía y umbrales de poder</Text>
                </View>
              </View>

              <View style={styles.rankList}>
                {RANKS.map((r) => {
                  const isCurrentRank = r.key === rank.key;
                  const isPastRank = user.totalXP >= r.minXP && r.key !== rank.key;
                  return (
                    <View
                      key={r.key}
                      style={[
                        styles.rankItem,
                        isCurrentRank && [styles.rankItemActive, { borderColor: r.color, backgroundColor: r.color + '12' }],
                      ]}
                    >
                      <Text style={styles.rankItemEmoji}>{r.emoji}</Text>
                      <View style={styles.rankItemInfo}>
                        <Text style={[styles.rankItemName, { color: r.color }]}>
                          {r.name} ({r.label})
                        </Text>
                        <Text style={styles.rankItemLabel}>
                          Nivel {r.minLevel}-{r.maxLevel} • {r.minXP.toLocaleString()} XP
                        </Text>
                      </View>
                      {isPastRank && (
                        <View style={styles.conqueredPill}>
                          <Text style={styles.conqueredText}>✓ Conquistado</Text>
                        </View>
                      )}
                      {isCurrentRank && (
                        <View style={[styles.currentRankPill, { borderColor: r.color, backgroundColor: r.color + '25' }]}>
                          <Text style={[styles.currentRankText, { color: r.color }]}>RANGO ACTUAL</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* ================= 2. REGISTRO Y CALIBRACIÓN SEMANAL DE PESO ================= */}
            <View style={styles.questsCard}>
              <View style={styles.questsCardHeader}>
                <View style={styles.questsTitleIconBox}>
                  <Ionicons name="scale-outline" size={17} color="#00F0FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questsCardTitle}>[ CALIBRACIÓN BIOMÉTRICA SEMANAL ]</Text>
                  <Text style={styles.questsCardSubtitle}>Composición corporal & ajuste de directivas</Text>
                </View>
                <TouchableOpacity
                  style={styles.calibrateActionBtn}
                  onPress={() => {
                    Haptics.light();
                    setShowWeightModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="scale" size={14} color="#0A0A0F" />
                  <Text style={styles.calibrateActionBtnText}>Calibrar</Text>
                </TouchableOpacity>
              </View>

              {/* Banner de Aviso si el pesaje semanal está pendiente (Alerta Red Gate) */}
              {checkinDue && (
                <TouchableOpacity
                  style={styles.pendingWeightBanner}
                  onPress={() => {
                    Haptics.medium();
                    setShowWeightModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.pendingBannerIcon}>
                    <Ionicons name="warning" size={18} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingBannerTitle}>[ ALERTA: CALIBRACIÓN SEMANAL PENDIENTE ]</Text>
                    <Text style={styles.pendingBannerSub}>
                      Ha transcurrido 1 semana. Registra tu peso actual para ganar +50 XP y reajustar tu plan.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
                </TouchableOpacity>
              )}

              {/* Métricas Principales de Peso en formato Telemetría HUD */}
              <View style={styles.weightMetricsRow}>
                <View style={styles.weightMetricItem}>
                  <Text style={styles.weightMetricLabel}>PESO ACTUAL</Text>
                  <Text style={styles.weightMetricValue}>{currentWeight.toFixed(1)} <Text style={styles.weightMetricUnit}>kg</Text></Text>
                </View>

                <View style={styles.weightMetricDivider} />

                <View style={styles.weightMetricItem}>
                  <Text style={styles.weightMetricLabel}>ESTA SEMANA</Text>
                  <Text
                    style={[
                      styles.weightMetricValue,
                      latestChange < 0 ? styles.changeGreen : latestChange > 0 ? styles.changeOrange : null,
                    ]}
                  >
                    {latestChange > 0 ? `+${latestChange}` : `${latestChange}`} <Text style={styles.weightMetricUnit}>kg</Text>
                  </Text>
                </View>

                <View style={styles.weightMetricDivider} />

                <View style={styles.weightMetricItem}>
                  <Text style={styles.weightMetricLabel}>TOTAL</Text>
                  <Text
                    style={[
                      styles.weightMetricValue,
                      totalChange < 0 ? styles.changeGreen : totalChange > 0 ? styles.changeOrange : null,
                    ]}
                  >
                    {totalChange > 0 ? `+${totalChange}` : `${totalChange}`} <Text style={styles.weightMetricUnit}>kg</Text>
                  </Text>
                </View>
              </View>

              {/* Historial Cronológico de Pesajes */}
              {weightLogs.length > 0 && (
                <View style={styles.weightHistoryBox}>
                  <Text style={styles.historySectionLabel}>[ REGISTRO CRONOLÓGICO DE PESAJES ]</Text>
                  {weightLogs.slice(0, 5).map((log, index) => (
                    <View key={log.id || index} style={styles.historyRow}>
                      <View style={styles.historyDateBox}>
                        <Ionicons name="calendar-outline" size={13} color="#64748B" />
                        <Text style={styles.historyDateText}>
                          {log.dateLabel || new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </Text>
                      </View>

                      <Text style={styles.historyWeightVal}>{log.weight.toFixed(1)} kg</Text>

                      <View
                        style={[
                          styles.historyPill,
                          log.change && log.change < 0
                            ? styles.historyPillDown
                            : log.change && log.change > 0
                            ? styles.historyPillUp
                            : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyPillText,
                            log.change && log.change < 0
                              ? styles.historyPillTextDown
                              : log.change && log.change > 0
                              ? styles.historyPillTextUp
                              : null,
                          ]}
                        >
                          {log.change && log.change > 0 ? `+${log.change}` : `${log.change ?? 0}`} kg
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Transmisión Táctica de CORTEX */}
              <View style={styles.cortexMotivationalCard}>
                <View style={styles.cortexMotivationalIconBox}>
                  <Ionicons name="hardware-chip-outline" size={16} color="#00F0FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cortexMotivationalTag}>[ TRANSMISIÓN CORTEX ]</Text>
                  <Text style={styles.cortexMotivationalText}>
                    {latestChange < 0
                      ? 'Tu índice de masa se está depurando. La constancia semanal acelerará tu ascenso a los rangos de élite.'
                      : latestChange > 0
                      ? 'Incremento de masa corporal. Asegúrate de consumir suficiente proteína para alimentar tus fibras musculares.'
                      : 'Composición corporal estable. Mantén el ritmo de los circuitos de entrenamiento para forjar resistencia.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ================= 2.5 CALCULADORA TÁCTICA DE MACROS Y CALORÍAS ================= */}
            <MacroCalculatorCard
              weight={currentWeight}
              height={user.height || 175}
              age={user.age || 25}
              userGoal={user.goals?.[0]}
            />
          </>
        )}
      </ScrollView>

      {/* Modal de Calibración de Peso Semanal */}
      <WeeklyWeightModal
        visible={showWeightModal}
        onClose={() => setShowWeightModal(false)}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  container: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },

  // Header del Sistema Solo Leveling
  header: {
    marginBottom: 2,
  },
  headerSystemBadgeRow: {
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
  headerLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00F0FF',
  },
  headerSystemTag: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  headerRankSubTag: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },

  // Segmented Control (Tabs del Sistema)
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#0F121E',
    borderRadius: Radius.lg,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentBtnActive: {
    backgroundColor: '#00F0FF',
    borderColor: '#00F0FF',
  },
  segmentBtnText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  segmentBtnTextActive: {
    color: '#0A0A0F',
    fontWeight: '900',
  },

  // Cards Estilo Misiones Diarias (QuestsCard)
  questsCard: {
    backgroundColor: '#0F121E',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  questsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questsTitleIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questsCardTitle: {
    color: '#00F0FF',
    fontSize: 13.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  questsCardSubtitle: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 1,
  },

  // Weekly Counters
  weeklyCountersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weeklyCounterBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    gap: 5,
  },
  counterIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBigNumber: {
    color: '#00F0FF',
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  counterSmallDenom: {
    fontSize: 14,
    color: '#64748B',
  },
  counterLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metaBadgePill: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  metaBadgePillText: {
    color: '#00F0FF',
    fontSize: 9.5,
    fontWeight: 'bold',
  },

  // Week Calendar
  weekCalendarSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  weekCalendarTitle: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  weekDaysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPill: {
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dayPillDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  dayPillToday: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  dayPillName: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  dayPillNameDone: {
    color: '#10B981',
  },
  dayPillNameToday: {
    color: '#00F0FF',
  },
  dayDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotDone: {
    backgroundColor: '#10B981',
  },
  dayDotToday: {
    backgroundColor: 'rgba(0, 240, 255, 0.25)',
  },
  dayDotEmptyText: {
    color: '#475569',
    fontSize: 10,
    lineHeight: 12,
  },

  // Rank + Level Card
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rankInfo: { flex: 1 },
  rankName: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  rankDesc: { color: '#94A3B8', fontSize: 11, lineHeight: 16, marginTop: 2 },

  // Solo Leveling Stats
  statsGrid: {
    gap: 8,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statCodeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statNameText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  statValueText: {
    fontSize: 14,
    fontWeight: '900',
  },
  statDescText: {
    color: '#64748B',
    fontSize: 10,
  },
  statMiniBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  statMiniBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Battle Grid
  battleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  battleCard: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    gap: 2,
  },
  battleIcon: { fontSize: 18 },
  battleValue: { fontSize: 15, fontWeight: '900' },
  battleLabel: { color: '#64748B', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },

  // Hierarchy Ranks List
  rankList: {
    gap: 6,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rankItemActive: {
    borderWidth: 1.5,
  },
  rankItemEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  rankItemInfo: { flex: 1 },
  rankItemName: { fontSize: 13, fontWeight: 'bold' },
  rankItemLabel: { color: '#64748B', fontSize: 10, marginTop: 1 },
  conqueredPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  conqueredText: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
  currentRankPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  currentRankText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

  // Weight Tab Elements
  calibrateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#00F0FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
  },
  calibrateActionBtnText: {
    color: '#0A0A0F',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pendingWeightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  pendingBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBannerTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  pendingBannerSub: {
    color: '#CBD5E1',
    fontSize: 10.5,
    marginTop: 2,
    lineHeight: 14,
  },
  weightMetricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  weightMetricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  weightMetricLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  weightMetricValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  weightMetricUnit: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'normal',
  },
  changeGreen: {
    color: '#10B981',
  },
  changeOrange: {
    color: '#F59E0B',
  },
  weightMetricDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Weight History
  weightHistoryBox: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  historySectionLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDateText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  historyWeightVal: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  historyPillDown: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  historyPillUp: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  historyPillText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  historyPillTextDown: {
    color: '#10B981',
  },
  historyPillTextUp: {
    color: '#F59E0B',
  },

  // Hologram Transmission Card
  cortexMotivationalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  cortexMotivationalIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  cortexMotivationalTag: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  cortexMotivationalText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
});
