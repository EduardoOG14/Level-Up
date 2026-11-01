import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type TrainingPlan } from '../../constants/plans';
import { CortexVoice } from '../../services/cortexVoice';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { SoundEffects } from '../../services/soundEffects';
import { Haptics } from '../../services/haptics';

interface PlanCompletedModalProps {
  visible: boolean;
  plan: TrainingPlan | null;
  recommendedNextPlan?: TrainingPlan | null;
  onClose: () => void;
  onSelectPlan: (plan: TrainingPlan) => void;
  onRepeatPlan: () => void;
}

export function PlanCompletedModal({
  visible,
  plan,
  recommendedNextPlan,
  onClose,
  onSelectPlan,
  onRepeatPlan,
}: PlanCompletedModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && plan) {
      SoundEffects.playLevelUp();
      Haptics.triumph();

      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      CortexVoice.speak(
        `¡Enhorabuena, Cazador! Has completado con éxito la totalidad del programa ${plan.title}. Tu condición física y disciplina han evolucionado. El Sistema te recomienda seleccionar tu siguiente plan de entrenamiento.`
      );

      return () => {
        pulseLoop.stop();
        CortexVoice.stop();
      };
    }
  }, [visible, plan]);

  if (!visible || !plan) return null;

  const bonusXP = Math.round(plan.totalXPReward * 0.25);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalCard,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Badge Superior CORTEX */}
          <View style={styles.systemBadge}>
            <Ionicons name="sparkles" size={14} color="#F59E0B" />
            <Text style={styles.systemBadgeText}>NOTIFICACIÓN DEL SISTEMA • CORTEX</Text>
          </View>

          {/* Trofeo de Graduación con Pulso */}
          <Animated.View
            style={[
              styles.trophyWrapper,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.trophyCircle}>
              <Ionicons name="trophy" size={50} color="#F59E0B" />
            </View>
          </Animated.View>

          {/* Título y Estado */}
          <Text style={styles.title}>¡PROGRAMA CONQUISTADO AL 100%!</Text>
          <View style={styles.planNameBadge}>
            <Text style={styles.planNameBadgeText}>
              {plan.emoji} {plan.title.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.description}>
            Has finalizado todos los ciclos de entrenamiento de este programa. Tus fibras y conexiones neuromusculares han alcanzado el objetivo previsto.
          </Text>

          {/* Caja de Recompensas */}
          <View style={styles.rewardBox}>
            <View style={styles.rewardRow}>
              <View style={styles.rewardIconBg}>
                <Ionicons name="flash" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardLabel}>BONO DE MAESTRÍA DEL PLAN</Text>
                <Text style={styles.rewardValue}>+{bonusXP} XP Extras de Disciplina</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.rewardRow}>
              <View style={[styles.rewardIconBg, { backgroundColor: 'rgba(0, 240, 255, 0.15)' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#00F0FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardLabel}>ESTADO DE CICLO</Text>
                <Text style={[styles.rewardValue, { color: '#00F0FF' }]}>
                  {plan.daysSchedule.length}/{plan.daysSchedule.length} Días Conquistados (100%)
                </Text>
              </View>
            </View>
          </View>

          {/* Recomendación de Siguiente Plan */}
          {recommendedNextPlan && recommendedNextPlan.id !== plan.id && (
            <View style={styles.recommendationBox}>
              <View style={styles.recommendationHeader}>
                <Ionicons name="compass" size={15} color="#10B981" />
                <Text style={styles.recommendationHeaderText}>
                  SIGUIENTE NIVEL RECOMENDADO POR CORTEX:
                </Text>
              </View>
              <Text style={styles.recommendationPlanTitle}>
                {recommendedNextPlan.emoji} {recommendedNextPlan.title}
              </Text>
              <Text style={styles.recommendationPlanSubtitle} numberOfLines={2}>
                {recommendedNextPlan.subtitle} • {recommendedNextPlan.durationLabel}
              </Text>

              <TouchableOpacity
                style={styles.startNextPlanBtn}
                onPress={() => {
                  onSelectPlan(recommendedNextPlan);
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={16} color="#0A0A0F" />
                <Text style={styles.startNextPlanBtnText}>
                  Activar este Programa ({recommendedNextPlan.difficulty})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Acciones Secundarias */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.browsePlansBtn}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Ionicons name="list" size={16} color="#00F0FF" />
              <Text style={styles.browsePlansBtnText}>Ver Catálogo de Planes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.repeatPlanBtn}
              onPress={() => {
                onRepeatPlan();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={15} color="#94A3B8" />
              <Text style={styles.repeatPlanBtnText}>Repetir este Plan</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 12, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#0D111D',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: Spacing.md,
  },
  systemBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  trophyWrapper: {
    marginVertical: Spacing.xs,
  },
  trophyCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: Spacing.sm,
    letterSpacing: 0.8,
  },
  planNameBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: Radius.md,
    marginTop: 6,
    marginBottom: Spacing.xs,
  },
  planNameBadgeText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  rewardBox: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rewardValue: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 8,
  },
  recommendationBox: {
    width: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: Spacing.sm,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  recommendationHeaderText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  recommendationPlanTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  recommendationPlanSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 8,
  },
  startNextPlanBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.sm,
  },
  startNextPlanBtnText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: '800',
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  browsePlansBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  browsePlansBtnText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  repeatPlanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radius.md,
  },
  repeatPlanBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
});
