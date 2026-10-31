import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CortexVoice } from '../../services/cortexVoice';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { useProgressStore } from '../../stores/progressStore';
import { useUserStore } from '../../stores/userStore';

interface WeeklyWeightModalProps {
  visible: boolean;
  onClose: () => void;
  onWeightLogged?: (weight: number, change: number) => void;
}

export function WeeklyWeightModal({
  visible,
  onClose,
  onWeightLogged,
}: WeeklyWeightModalProps) {
  const { user } = useUserStore();
  const { weightLogs, logWeight } = useProgressStore();

  const lastLog = weightLogs.length > 0 ? weightLogs[0].weight : user?.weight || 70;
  const [currentWeight, setCurrentWeight] = useState(lastLog);
  const [inputText, setInputText] = useState(lastLog.toFixed(1));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar estado cuando se abre el modal
  useEffect(() => {
    if (visible) {
      const base = weightLogs.length > 0 ? weightLogs[0].weight : user?.weight || 70;
      setCurrentWeight(base);
      setInputText(base.toFixed(1));

      // Locución motivacional humana de CORTEX
      CortexVoice.speak(
        'Saludos Cazador. Ha transcurrido una semana de combate. Es momento de calibrar tu peso corporal. Recuerda que la constancia forja al guerrero. ¡Mantén el enfoque!'
      );
    }
    return () => {
      CortexVoice.stop();
    };
  }, [visible]);

  const handleAdjust = (delta: number) => {
    const updated = Math.max(30, Math.min(250, Number((currentWeight + delta).toFixed(1))));
    setCurrentWeight(updated);
    setInputText(updated.toFixed(1));
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    const parsed = parseFloat(text.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 30 && parsed <= 250) {
      setCurrentWeight(parsed);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { change } = await logWeight(currentWeight, user.uid);
      if (onWeightLogged) onWeightLogged(currentWeight, change);
      CortexVoice.speak('Calibración completada con éxito. Has ganado 50 puntos de experiencia por tu disciplina semanal.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const diff = Number((currentWeight - lastLog).toFixed(1));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          {/* Header con Badge de Calibración */}
          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Ionicons name="scale-outline" size={14} color={Colors.brand.accent} />
              <Text style={styles.badgeText}>CALIBRACIÓN SEMANAL</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>¿Cuál es tu peso esta semana?</Text>
          <Text style={styles.subtitle}>
            El Sistema CORTEX ajusta tu telemetría metabólica para maximizar tu ganancia de fuerza.
          </Text>

          {/* Stepper y Entrada de Peso */}
          <View style={styles.weightDisplayRow}>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => handleAdjust(-0.5)}
              activeOpacity={0.7}
            >
              <Text style={styles.adjustBtnText}>-0.5</Text>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.weightInput}
                value={inputText}
                onChangeText={handleTextChange}
                keyboardType="numeric"
                selectTextOnFocus
                maxLength={5}
              />
              <Text style={styles.unitText}>KG</Text>
            </View>

            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => handleAdjust(0.5)}
              activeOpacity={0.7}
            >
              <Text style={styles.adjustBtnText}>+0.5</Text>
            </TouchableOpacity>
          </View>

          {/* Indicador de Variación */}
          <View style={styles.diffRow}>
            <Text style={styles.diffLabel}>Anterior: {lastLog.toFixed(1)} kg</Text>
            <View
              style={[
                styles.diffPill,
                diff < 0 && styles.diffPillDown,
                diff > 0 && styles.diffPillUp,
              ]}
            >
              <Text
                style={[
                  styles.diffPillText,
                  diff < 0 && styles.diffTextDown,
                  diff > 0 && styles.diffTextUp,
                ]}
              >
                {diff > 0 ? `+${diff}` : `${diff}`} kg
              </Text>
            </View>
          </View>

          {/* Consejo Táctico CORTEX */}
          <View style={styles.cortexAdviceCard}>
            <Ionicons name="hardware-chip-outline" size={18} color={Colors.brand.accent} />
            <Text style={styles.cortexAdviceText}>
              {diff < 0
                ? 'Mayor eficiencia metabólica. Menor resistencia inercial para el combate.'
                : diff > 0
                ? 'Incremento de masa y armadura muscular detectado. Fuerza aumentada.'
                : 'Constancia perfecta. Tu composición corporal se mantiene blindada.'}
            </Text>
          </View>

          {/* Recompensa de Disciplina */}
          <View style={styles.rewardNotice}>
            <Ionicons name="sparkles" size={14} color="#F59E0B" />
            <Text style={styles.rewardNoticeText}>+50 XP de Disciplina al registrar</Text>
          </View>

          {/* Botones de Acción */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissBtnText}>Más Tarde</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-sharp" size={18} color="#0A0A0F" />
              <Text style={styles.saveBtnText}>CALIBRAR PESO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.45)',
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
  },
  badgeText: {
    color: Colors.brand.accent,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  subtitle: {
    color: Colors.text.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  weightDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  adjustBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adjustBtnText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  weightInput: {
    color: Colors.brand.accent,
    fontSize: 38,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 100,
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    color: Colors.text.muted,
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.elevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  diffLabel: {
    color: Colors.text.muted,
    fontSize: 10,
  },
  diffPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  diffPillDown: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  diffPillUp: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  diffPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.text.secondary,
  },
  diffTextDown: {
    color: '#10B981',
  },
  diffTextUp: {
    color: '#F59E0B',
  },
  cortexAdviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  cortexAdviceText: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: 10,
    lineHeight: 14,
  },
  rewardNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  rewardNoticeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xs,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dismissBtnText: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.brand.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  saveBtnText: {
    color: '#0A0A0F',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
