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
import { CortexVoice } from '../../services/cortexVoice';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { Haptics } from '../../services/haptics';

export interface RestAdvisoryModalProps {
  visible: boolean;
  planTitle?: string;
  planEmoji?: string;
  dayNumber?: number;
  sessionTitle?: string;
  onStartTomorrow: () => void;
  onStartAnyway: () => void;
  onClose: () => void;
}

export function RestAdvisoryModal({
  visible,
  planTitle = 'Entrenamiento Táctico',
  planEmoji = '⚡',
  dayNumber = 1,
  sessionTitle = 'Circuito del Plan',
  onStartTomorrow,
  onStartAnyway,
  onClose,
}: RestAdvisoryModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Haptics.warning();

      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      CortexVoice.speak(
        'Directiva Biomédica CORTEX: Ya has completado una rutina el día de hoy. El descanso es fundamental para la recuperación articular y la síntesis muscular. Te recomendamos iniciar esta nueva sesión mañana, o puedes iniciar de igual manera si deseas sobrecarga voluntaria.'
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
            <Ionicons name="medical" size={13} color="#10B981" />
            <Text style={styles.systemBadgeText}>DIRECTIVA BIOMÉDICA • CORTEX</Text>
          </View>

          {/* Icono de Descanso y Pulso */}
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="bed-outline" size={44} color="#10B981" />
            </View>
          </Animated.View>

          {/* Título Principal */}
          <Text style={styles.title}>¡EL DESCANSO ES FUNDAMENTAL!</Text>
          <View style={styles.alertPill}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.alertPillText}>RUTINA DE HOY YA COMPLETADA</Text>
          </View>

          {/* Explicación Médica y de Rendimiento */}
          <View style={styles.clinicalBox}>
            <Text style={styles.clinicalText}>
              El músculo no crece durante el entrenamiento, sino durante el reposo profundo. Realizar dos circuitos en el mismo día puede elevar el cortisol, aumentar el riesgo de lesión y fatigar el sistema nervioso central.
            </Text>
          </View>

          {/* Info del Plan / Sesión seleccionada */}
          <View style={styles.sessionBox}>
            <View style={styles.sessionHeaderRow}>
              <Text style={styles.sessionBadgeTag}>PROGRAMA SELECCIONADO</Text>
              <Text style={styles.sessionDayTag}>Día {dayNumber}</Text>
            </View>
            <Text style={styles.sessionPlanTitle}>
              {planEmoji} {planTitle}
            </Text>
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {sessionTitle}
            </Text>
          </View>

          {/* Botones de Decisión Táctica */}
          <View style={styles.actionsContainer}>
            {/* Opción 1: Recomendada (Empezar Mañana) */}
            <TouchableOpacity
              style={styles.startTomorrowBtn}
              onPress={onStartTomorrow}
              activeOpacity={0.85}
            >
              <View style={styles.btnIconBoxGreen}>
                <Ionicons name="calendar-outline" size={18} color="#0A0A0F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.startTomorrowBtnText}>Empezar Mañana (Recomendado)</Text>
                <Text style={styles.startTomorrowBtnSub}>
                  Asimilar el estímulo de hoy y rendir al 100%
                </Text>
              </View>
              <Ionicons name="shield-checkmark" size={18} color="#0A0A0F" />
            </TouchableOpacity>

            {/* Opción 2: Sobrecarga Voluntaria (Iniciar de Igual Manera) */}
            <TouchableOpacity
              style={styles.startAnywayBtn}
              onPress={onStartAnyway}
              activeOpacity={0.8}
            >
              <View style={styles.btnIconBoxOrange}>
                <Ionicons name="flash-outline" size={16} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.startAnywayBtnText}>Iniciar de Igual Manera</Text>
                <Text style={styles.startAnywayBtnSub}>
                  Sobrecarga voluntaria bajo tu propio criterio
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
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
    backgroundColor: 'rgba(5, 5, 12, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 395,
    backgroundColor: '#0D111D',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: Spacing.sm,
  },
  systemBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  iconWrapper: {
    marginVertical: Spacing.xs,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: Spacing.xs,
    letterSpacing: 0.6,
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: Radius.full,
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  alertPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  clinicalBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  clinicalText: {
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
  },
  sessionBox: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionBadgeTag: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sessionDayTag: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  sessionPlanTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionTitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  actionsContainer: {
    width: '100%',
    gap: 8,
  },
  startTomorrowBtn: {
    backgroundColor: '#10B981',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnIconBoxGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTomorrowBtnText: {
    color: '#0A0A0F',
    fontSize: 13,
    fontWeight: '800',
  },
  startTomorrowBtnSub: {
    color: 'rgba(10, 10, 15, 0.75)',
    fontSize: 10,
    fontWeight: '600',
  },
  startAnywayBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radius.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  btnIconBoxOrange: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startAnywayBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  startAnywayBtnSub: {
    color: '#64748B',
    fontSize: 9.5,
  },
});
