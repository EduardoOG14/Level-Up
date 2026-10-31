import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CortexVoice } from '../../services/cortexVoice';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';

interface DailyCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  bonusXP?: number;
}

export function DailyCompletionModal({
  visible,
  onClose,
  bonusXP = 300,
}: DailyCompletionModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Pulso brillante continuo
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

      // Locución humana y entusiasta de felicitaciones
      CortexVoice.speak(
        '¡Felicidades, Cazador! Has completado todas las misiones de hoy con excelencia táctica. Has recibido un bono especial de trescientos puntos de experiencia del Sistema.'
      );

      return () => {
        pulseLoop.stop();
        CortexVoice.stop();
      };
    }
  }, [visible]);

  if (!visible) return null;

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
          {/* Header Badge */}
          <View style={styles.systemBadge}>
            <Ionicons name="sparkles" size={14} color="#F59E0B" />
            <Text style={styles.systemBadgeText}>NOTIFICACIÓN DEL SISTEMA • CORTEX</Text>
          </View>

          {/* Glowing Trophy Icon with Pulse */}
          <Animated.View
            style={[
              styles.trophyWrapper,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.trophyCircle}>
              <Ionicons name="trophy" size={54} color="#F59E0B" />
            </View>
          </Animated.View>

          {/* Title & Clear Status */}
          <Text style={styles.title}>¡TODAS LAS MISIONES DE HOY CUMPLIDAS!</Text>
          <View style={styles.clearBadge}>
            <Text style={styles.clearBadgeText}>PROTOCOLO DIARIO 100% CLEAR ⚡</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            ¡Excelente desempeño, Cazador! Has completado las 5 misiones de entrenamiento del día con disciplina implacable.
          </Text>

          {/* Reward Box */}
          <View style={styles.rewardBox}>
            <View style={styles.rewardRow}>
              <View style={styles.rewardIconBg}>
                <Ionicons name="flash" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardLabel}>BONO DE EXPERIENCIA DIARIO</Text>
                <Text style={styles.rewardValue}>+{bonusXP} XP Extras</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.rewardRow}>
              <View style={[styles.rewardIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardLabel}>ESTADO DE RACHA</Text>
                <Text style={[styles.rewardValue, { color: '#10B981' }]}>Racha de Combate Protegida 🔥</Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.claimBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done" size={22} color="#000000" />
            <Text style={styles.claimBtnText}>¡Reclamar Recompensa y Continuar!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F1322',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    marginBottom: Spacing.md,
  },
  systemBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  trophyWrapper: {
    marginVertical: Spacing.sm,
  },
  trophyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  title: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.xl,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 28,
  },
  clearBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#10B981',
    marginTop: 6,
  },
  clearBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  description: {
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: Spacing.md,
  },
  rewardBox: {
    width: '100%',
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rewardIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  rewardValue: {
    color: '#F59E0B',
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  claimBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  claimBtnText: {
    color: '#000000',
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
