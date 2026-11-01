import React, { useState, useEffect, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../stores/userStore';
import { Haptics } from '../../services/haptics';
import { SoundEffects } from '../../services/soundEffects';
import { CortexVoice } from '../../services/cortexVoice';

interface DailyRewardChestModalProps {
  visible: boolean;
  onClose: () => void;
  onClaimed?: () => void;
}

const CORTEX_TACTICAL_QUOTES = [
  'El descanso activo y la hidratación estructurada multiplican por dos la hipertrofia miofibrilar.',
  'La cadencia excéntrica de 3 segundos recluta hasta un 38% más de unidades motoras profundas.',
  'La constancia es la única estadística inmutable que transforma a un Cazador Rango E en Soberano.',
  'Controlar la respiración diafragmática durante el esfuerzo previene picos excesivos de presión arterial.',
  'Cada repetición con rango de movimiento completo estimula la síntesis proteica de forma óptima.',
  'El verdadero poder se forja en los días en que tu mente busca excusas pero tu disciplina prevalece.',
];

export function DailyRewardChestModal({
  visible,
  onClose,
  onClaimed,
}: DailyRewardChestModalProps) {
  const { user, addXP } = useUserStore();
  const [isOpened, setIsOpened] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState('');
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const chestBounceAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (visible) {
      setIsOpened(false);
      const quote =
        CORTEX_TACTICAL_QUOTES[Math.floor(Math.random() * CORTEX_TACTICAL_QUOTES.length)];
      setSelectedQuote(quote);

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible]);

  const handleOpenChest = async () => {
    if (isOpened) return;

    Haptics.triumph();
    SoundEffects.playLevelUp();
    setIsOpened(true);

    // Recompensa: +50 XP
    await addXP(50, 'strength');

    // Registrar en AsyncStorage para hoy
    const todayKey = new Date().toISOString().slice(0, 10);
    const uid = user?.uid || 'guest';
    await AsyncStorage.setItem(`@fitrise_daily_chest_${uid}_${todayKey}`, 'claimed');

    CortexVoice.speak('Caja de suministros desbloqueada. Has recibido cincuenta puntos de experiencia.');

    if (onClaimed) onClaimed();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.systemTag}>
              <Text style={styles.systemTagText}>[ SUMINISTROS DEL SISTEMA ]</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Cofre Ilustrado / Animado */}
          <View style={styles.chestArea}>
            <Animated.View
              style={[
                styles.glowCircle,
                {
                  opacity: glowAnim,
                  transform: [{ scale: isOpened ? 1.4 : 1.1 }],
                },
              ]}
            />
            <TouchableOpacity
              onPress={handleOpenChest}
              disabled={isOpened}
              activeOpacity={0.8}
              style={styles.chestTouch}
            >
              <Text style={styles.chestEmoji}>{isOpened ? '💎' : '🎁'}</Text>
            </TouchableOpacity>
          </View>

          {/* Título y Estado */}
          <Text style={styles.title}>
            {isOpened ? '¡Suministro Desplegado!' : 'Caja Diaria de Cazador'}
          </Text>
          <Text style={styles.subtitle}>
            {isOpened
              ? '+50 XP sumados a tu perfil de Cazador'
              : 'Toca el cofre para reclamar tus recursos tácticos de hoy'}
          </Text>

          {/* Consejo Táctico Revelado */}
          {isOpened ? (
            <View style={styles.adviceBox}>
              <View style={styles.adviceHeaderRow}>
                <Ionicons name="sparkles" size={14} color="#00F0FF" />
                <Text style={styles.adviceHeaderLabel}>DIRECTIVA BIOMECÁNICA CORTEX</Text>
              </View>
              <Text style={styles.adviceText}>{selectedQuote}</Text>
            </View>
          ) : null}

          {/* Botón de Acción */}
          {isOpened ? (
            <TouchableOpacity
              style={styles.actionBtnDone}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done" size={18} color="#0A0A0F" />
              <Text style={styles.actionBtnDoneText}>REGRESAR AL CENTRO DE MANDO</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionBtnOpen}
              onPress={handleOpenChest}
              activeOpacity={0.85}
            >
              <Ionicons name="key-outline" size={18} color="#0A0A0F" />
              <Text style={styles.actionBtnOpenText}>ABRIR COFRE (+50 XP)</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 17, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F121E',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    alignItems: 'center',
    shadowColor: '#00F0FF',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  systemTag: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  systemTagText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  chestArea: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
    width: 140,
    height: 140,
  },
  glowCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
  },
  chestTouch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestEmoji: {
    fontSize: 72,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  adviceBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  adviceHeaderLabel: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adviceText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
  },
  actionBtnOpen: {
    width: '100%',
    backgroundColor: '#00F0FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    shadowColor: '#00F0FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  actionBtnOpenText: {
    color: '#0A0A0F',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionBtnDone: {
    width: '100%',
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.lg,
  },
  actionBtnDoneText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
