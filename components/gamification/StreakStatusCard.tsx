import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';

interface StreakStatusCardProps {
  streak: number;
  questsCompletedCount: number;
  totalQuests?: number;
  areQuestsCompleted: boolean;
  isRoutineCompleted: boolean;
  routineTitle?: string;
  isPenaltyActive?: boolean;
  shieldsCount?: number;
  isRestDay?: boolean;
  onPressQuests?: () => void;
  onPressRoutine?: () => void;
}

export function StreakStatusCard({
  streak,
  questsCompletedCount,
  totalQuests = 5,
  areQuestsCompleted,
  isRoutineCompleted,
  routineTitle,
  isPenaltyActive = false,
  shieldsCount,
  isRestDay = false,
  onPressQuests,
  onPressRoutine,
}: StreakStatusCardProps) {
  const isFullDay = areQuestsCompleted && isRoutineCompleted;
  const completedCriteriaCount = (areQuestsCompleted ? 1 : 0) + (isRoutineCompleted ? 1 : 0);

  return (
    <View style={[styles.card, isFullDay ? styles.cardComplete : isPenaltyActive ? styles.cardPenalty : isRestDay ? styles.cardRestDay : styles.cardPending]}>
      {/* Header con Estado de Racha */}
      <View style={styles.headerRow}>
        <View style={[styles.streakBadge, isRestDay && !isFullDay && styles.streakBadgeRestDay]}>
          <Text style={styles.streakFlame}>{isRestDay && !isFullDay ? '🛡️' : '🔥'}</Text>
          <Text style={[styles.streakNumber, isRestDay && !isFullDay && styles.streakNumberRestDay]}>{streak}</Text>
          <Text style={[styles.streakUnit, isRestDay && !isFullDay && styles.streakUnitRestDay]}>{streak === 1 ? 'DÍA' : 'DÍAS'}</Text>
        </View>

        <View style={styles.headerTexts}>
          <View style={styles.systemTagRow}>
            <View style={[styles.statusDot, isFullDay ? styles.statusDotGreen : isPenaltyActive ? styles.statusDotOrange : isRestDay ? styles.statusDotCyan : styles.statusDotOrange]} />
            <Text style={[styles.systemTag, isRestDay && !isFullDay && { color: '#00F0FF' }]}>
              {isFullDay
                ? 'RACHA BLINDADA Y AVANZADA'
                : isPenaltyActive
                ? '⚠️ ZONA DE CASTIGO ACTIVA'
                : isRestDay
                ? '🛡️ DESCANSO TÁCTICO • RACHA PROTEGIDA'
                : 'PACTO DE RACHA DIARIO'}
            </Text>
          </View>
          <Text style={styles.hintText}>
            {isFullDay
              ? 'Has cumplido el 100% de las misiones y la rutina de hoy.'
              : isRestDay
              ? 'Hoy es tu día de recuperación programado. Tu racha está protegida y no se cortará. Entrenar hoy sumará como bonus.'
              : 'La racha se mantiene SÓLO si completas las misiones y tu rutina.'}
          </Text>
        </View>

        <View style={[styles.criteriaPill, isFullDay ? styles.criteriaPillGreen : isRestDay ? styles.criteriaPillCyan : styles.criteriaPillNeutral]}>
          <Text style={[styles.criteriaPillText, isFullDay ? styles.criteriaPillTextGreen : isRestDay ? styles.criteriaPillTextCyan : styles.criteriaPillTextNeutral]}>
            {isFullDay ? '2/2' : isRestDay ? 'SEGURO 🛡️' : `${completedCriteriaCount}/2`}
          </Text>
        </View>
      </View>

      {/* Checklist de los 2 Requisitos Obligatorios */}
      <View style={styles.checklist}>
        {/* Requisito 1: Misiones Diarias */}
        <TouchableOpacity
          style={[styles.checkItem, areQuestsCompleted && styles.checkItemDone]}
          onPress={onPressQuests}
          activeOpacity={0.75}
        >
          <View style={[styles.checkBox, areQuestsCompleted && styles.checkBoxDone]}>
            <Ionicons
              name={areQuestsCompleted ? 'checkmark' : 'ellipse-outline'}
              size={15}
              color={areQuestsCompleted ? '#0A0A0F' : '#64748B'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.checkLabel, areQuestsCompleted && styles.checkLabelDone]}>
              1. Misiones Diarias
            </Text>
            <Text style={styles.checkSub}>
              {areQuestsCompleted
                ? '5 de 5 directivas completadas'
                : `${questsCompletedCount} de ${totalQuests} completadas`}
            </Text>
          </View>
          <View style={[styles.statusBadge, areQuestsCompleted ? styles.statusBadgeGreen : styles.statusBadgeNeutral]}>
            <Text style={[styles.statusBadgeText, areQuestsCompleted ? styles.statusBadgeTextGreen : styles.statusBadgeTextNeutral]}>
              {areQuestsCompleted ? '✓ LISTO' : `${questsCompletedCount}/${totalQuests}`}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Requisito 2: Rutina del Día */}
        <TouchableOpacity
          style={[styles.checkItem, isRoutineCompleted && styles.checkItemDone]}
          onPress={onPressRoutine}
          activeOpacity={0.75}
        >
          <View style={[styles.checkBox, isRoutineCompleted && styles.checkBoxDone]}>
            <Ionicons
              name={isRoutineCompleted ? 'checkmark' : 'ellipse-outline'}
              size={15}
              color={isRoutineCompleted ? '#0A0A0F' : '#64748B'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.checkLabel, isRoutineCompleted && styles.checkLabelDone]}>
              2. Rutina del Día
            </Text>
            <Text style={styles.checkSub} numberOfLines={1}>
              {isRoutineCompleted
                ? routineTitle || 'Circuito completado hoy'
                : 'Plan activo o circuito de combate'}
            </Text>
          </View>
          <View style={[styles.statusBadge, isRoutineCompleted ? styles.statusBadgeGreen : styles.statusBadgeNeutral]}>
            <Text style={[styles.statusBadgeText, isRoutineCompleted ? styles.statusBadgeTextGreen : styles.statusBadgeTextNeutral]}>
              {isRoutineCompleted ? '✓ LISTO' : 'PENDIENTE'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Escudo Protector de Racha */}
      {typeof shieldsCount === 'number' && (
        <View style={styles.shieldRow}>
          <Ionicons name="shield-checkmark" size={13} color="#00F0FF" />
          <Text style={styles.shieldText}>
            {shieldsCount > 0
              ? `${shieldsCount} ${shieldsCount === 1 ? 'Escudo Protector disponible' : 'Escudos Protectores disponibles'}`
              : '0 Escudos Protectores • Gana 1 cada 7 días de racha'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F121E',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  cardComplete: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  cardPenalty: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  cardRestDay: {
    borderColor: 'rgba(0, 240, 255, 0.35)',
    backgroundColor: 'rgba(0, 240, 255, 0.04)',
  },
  cardPending: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  streakBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 50,
  },
  streakBadgeRestDay: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  streakFlame: {
    fontSize: 14,
  },
  streakNumber: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  streakNumberRestDay: {
    color: '#00F0FF',
  },
  streakUnit: {
    color: '#F87171',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streakUnitRestDay: {
    color: '#38BDF8',
  },
  headerTexts: {
    flex: 1,
  },
  systemTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotGreen: {
    backgroundColor: '#10B981',
  },
  statusDotOrange: {
    backgroundColor: '#F59E0B',
  },
  statusDotCyan: {
    backgroundColor: '#00F0FF',
  },
  systemTag: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  hintText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
  },
  criteriaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  criteriaPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  criteriaPillCyan: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: '#00F0FF',
  },
  criteriaPillNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  criteriaPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  criteriaPillTextGreen: {
    color: '#10B981',
  },
  criteriaPillTextCyan: {
    color: '#00F0FF',
  },
  criteriaPillTextNeutral: {
    color: '#94A3B8',
  },
  checklist: {
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkItemDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkLabel: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  checkLabelDone: {
    color: '#10B981',
  },
  checkSub: {
    color: '#64748B',
    fontSize: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  statusBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeTextGreen: {
    color: '#10B981',
  },
  statusBadgeTextNeutral: {
    color: '#94A3B8',
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  shieldText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
