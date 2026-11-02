import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { TrainingPlan, PlanDay } from '../../constants/plans';

interface TodayWorkoutCardProps {
  activePlan: TrainingPlan | null;
  activePlanDay: number;
  isCompletedToday: boolean;
  completedTitle?: string;
  onStartTodayWorkout: () => void;
  onExplorePlans: () => void;
}

export function TodayWorkoutCard({
  activePlan,
  activePlanDay,
  isCompletedToday,
  completedTitle,
  onStartTodayWorkout,
  onExplorePlans,
}: TodayWorkoutCardProps) {
  if (!activePlan) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.systemBadge}>
            <View style={styles.systemDot} />
            <Text style={styles.systemBadgeText}>SISTEMA CORTEX V3.4</Text>
          </View>
          <Text style={styles.noPlanSub}>Directiva lista</Text>
        </View>

        <Text style={styles.noPlanTitle}>Directiva de Combate Computada</Text>
        <Text style={styles.noPlanDesc}>
          CORTEX ha preparado tu protocolo diario según tu rango y estado físico. Accede para iniciar tu misión obligatoria.
        </Text>

        <TouchableOpacity
          style={styles.selectPlanBtn}
          onPress={onExplorePlans}
          activeOpacity={0.8}
        >
          <Ionicons name="hardware-chip-outline" size={16} color="#0A0A0F" />
          <Text style={styles.selectPlanBtnText}>ABRIR DIRECTIVA CORTEX</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentDayInfo: PlanDay | undefined = activePlan.daysSchedule.find(
    (d) => d.dayNumber === activePlanDay
  ) || activePlan.daysSchedule[0];

  return (
    <View style={[styles.cardContainer, isCompletedToday && styles.cardContainerDone]}>
      {/* Header de la Directiva */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.systemBadge}>
          <View style={[styles.systemDot, isCompletedToday ? styles.systemDotGreen : styles.systemDotCyan]} />
          <Text style={[styles.systemBadgeText, isCompletedToday && styles.systemBadgeTextGreen]}>
            {isCompletedToday ? 'DIRECTIVA CUMPLIDA' : 'DIRECTIVA DE HOY'}
          </Text>
        </View>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>
            DÍA {activePlanDay} DE {activePlan.daysSchedule.length}
          </Text>
        </View>
      </View>

      {/* Título y Enfoque del Día */}
      <View style={styles.planInfoBox}>
        <Text style={styles.planNameTag} numberOfLines={1}>
          {activePlan.emoji} {activePlan.title}
        </Text>
        <Text style={styles.dayFocusTitle} numberOfLines={1}>
          {isCompletedToday && completedTitle ? completedTitle : currentDayInfo?.title || 'Entrenamiento Táctico'}
        </Text>
        <Text style={styles.dayFocusSub} numberOfLines={1}>
          {currentDayInfo?.focus || 'Fuerza, técnica y potencia neuromuscular'}
        </Text>
      </View>

      {/* Métricas rápidas: Duración, Ejercicios, XP */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Ionicons name="time-outline" size={13} color="#94A3B8" />
          <Text style={styles.metricText}>{currentDayInfo?.duration || 20} min</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Ionicons name="barbell-outline" size={13} color="#94A3B8" />
          <Text style={styles.metricText}>{currentDayInfo?.exercisesCount || 4} ejercicios</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Ionicons name="flash-outline" size={13} color="#F59E0B" />
          <Text style={styles.metricText}>+{currentDayInfo?.xpReward || 100} XP</Text>
        </View>
      </View>

      {/* Botón de Acción Directo */}
      {isCompletedToday ? (
        <View style={styles.completedBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.completedBannerText}>Completado hoy con honores</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.startWorkoutBtn}
          onPress={onStartTodayWorkout}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={16} color="#0A0A0F" />
          <Text style={styles.startWorkoutBtnText}>INICIAR DIRECTIVA DE HOY</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0F121E',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardContainerDone: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  systemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  systemDotCyan: {
    backgroundColor: '#00F0FF',
  },
  systemDotGreen: {
    backgroundColor: '#10B981',
  },
  systemBadgeText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  systemBadgeTextGreen: {
    color: '#10B981',
  },
  dayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  dayBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  planInfoBox: {
    marginVertical: 4,
  },
  planNameTag: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayFocusTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dayFocusSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  startWorkoutBtn: {
    backgroundColor: '#00F0FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: Radius.md,
    shadowColor: '#00F0FF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  startWorkoutBtnText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  completedBannerText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  noPlanTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  noPlanDesc: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
    marginBottom: 12,
  },
  noPlanSub: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  selectPlanBtn: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  selectPlanBtnText: {
    color: '#0A0A0F',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
