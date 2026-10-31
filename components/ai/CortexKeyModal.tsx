import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { useCortexEnergyStore } from '../../stores/cortexEnergyStore';
import { Haptics } from '../../services/haptics';

interface CortexKeyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CortexKeyModal({ visible, onClose }: CortexKeyModalProps) {
  const {
    personalApiKey,
    dailyManaRemaining,
    maxDailyMana,
    isUnlimited,
    setPersonalApiKey,
    removePersonalApiKey,
    initialize,
  } = useCortexEnergyStore();

  const [inputKey, setInputKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      initialize();
      setInputKey(personalApiKey || '');
    }
  }, [visible, personalApiKey]);

  const handleOpenGoogleAIStudio = async () => {
    Haptics.light();
    try {
      await WebBrowser.openBrowserAsync('https://aistudio.google.com/app/apikey');
    } catch {
      Alert.alert(
        'Abrir en Navegador',
        'Visita https://aistudio.google.com/app/apikey desde tu navegador para crear tu clave gratuita.'
      );
    }
  };

  const handlePasteFromClipboard = async () => {
    Haptics.light();
    try {
      const text = await Clipboard.getStringAsync();
      const trimmed = text?.trim();
      if (trimmed && trimmed.length > 15) {
        setInputKey(trimmed);
        Haptics.success();
      } else {
        Alert.alert(
          'Portapapeles Vacío',
          'No se encontró una clave válida en tu portapapeles. Copia tu clave desde Google AI Studio primero.'
        );
      }
    } catch (err) {
      console.warn('Error leyendo portapapeles:', err);
    }
  };

  const handleSaveKey = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed || trimmed.length < 15) {
      Alert.alert('Clave Inválida', 'Ingresa una clave válida de Gemini API (suele iniciar con AIzaSy...).');
      return;
    }

    setIsSaving(true);
    const success = await setPersonalApiKey(trimmed);
    setIsSaving(false);

    if (success) {
      Haptics.triumph();
      Alert.alert(
        '¡Modo Ilimitado Desbloqueado! 👑',
        'Tu clave personal de Google Gemini ha sido vinculada con éxito. Ahora tienes consultas de CORTEX y Mazmorras IA sin límite diario.',
        [{ text: '¡Excelente!', onPress: onClose }]
      );
    } else {
      Alert.alert('Error', 'No se pudo guardar la clave. Verifica que sea correcta.');
    }
  };

  const handleUnlinkKey = () => {
    Alert.alert(
      'Desvincular Clave',
      '¿Deseas volver al Modo Estándar con 5 consultas gratuitas diarias?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            await removePersonalApiKey();
            setInputKey('');
            Haptics.medium();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Ionicons name="hardware-chip" size={20} color={Colors.brand.primary} />
                <Text style={styles.title}>Núcleo Neural CORTEX</Text>
              </View>
              <Text style={styles.subtitle}>Gestión de Energía y Tokens de Inteligencia Artificial</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Estado Actual */}
            <View style={[styles.statusCard, isUnlimited ? styles.statusCardUnlimited : styles.statusCardStandard]}>
              <View style={styles.statusHeaderRow}>
                <View style={[styles.statusDot, { backgroundColor: isUnlimited ? '#8B5CF6' : '#00F0FF' }]} />
                <Text style={[styles.statusTitle, { color: isUnlimited ? '#A78BFA' : '#00F0FF' }]}>
                  {isUnlimited ? '👑 MODO ILIMITADO ACTIVO' : '⚡ MODO ESTÁNDAR ACTIVO'}
                </Text>
              </View>

              {isUnlimited ? (
                <View style={{ gap: 6 }}>
                  <Text style={styles.statusDesc}>
                    CORTEX está funcionando con tu propia cuenta de Google Gemini. Tienes acceso sin límites diarios para análisis y mazmorras.
                  </Text>
                  <TouchableOpacity style={styles.unlinkBtn} onPress={handleUnlinkKey} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    <Text style={styles.unlinkBtnText}>Desvincular Clave Personal</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <View style={styles.manaRow}>
                    <Text style={styles.manaLabel}>Energía Neural de Hoy:</Text>
                    <Text style={styles.manaValue}>
                      {dailyManaRemaining} / {maxDailyMana} consultas
                    </Text>
                  </View>
                  <View style={styles.manaTrack}>
                    <View
                      style={[
                        styles.manaFill,
                        { width: `${(dailyManaRemaining / maxDailyMana) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.statusDesc}>
                    Recibes 5 consultas y mazmorras gratuitas cada día cubiertas por el sistema. Se recargan automáticamente a medianoche.
                  </Text>
                </View>
              )}
            </View>

            {/* Guía para Desbloquear Ilimitado */}
            {!isUnlimited && (
              <View style={styles.unlockSection}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="infinite" size={18} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>¿Quieres Consultas Ilimitadas?</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Google regala a cualquier persona con cuenta de Google hasta <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>1,000,000 de tokens al día</Text> 100% gratis, sin tarjeta de crédito ni cobros.
                </Text>

                {/* Paso 1: Abrir Google AI Studio */}
                <TouchableOpacity
                  style={styles.stepBtnPrimary}
                  onPress={handleOpenGoogleAIStudio}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-google" size={18} color="#0A0A0F" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepBtnPrimaryTitle}>1. Abrir Google AI Studio</Text>
                    <Text style={styles.stepBtnPrimarySub}>Toca aquí, inicia sesión y copia tu clave</Text>
                  </View>
                  <Ionicons name="open-outline" size={18} color="#0A0A0F" />
                </TouchableOpacity>

                {/* Paso 2: Pegar del portapapeles */}
                <TouchableOpacity
                  style={styles.stepBtnSecondary}
                  onPress={handlePasteFromClipboard}
                  activeOpacity={0.8}
                >
                  <Ionicons name="clipboard-outline" size={18} color="#00F0FF" />
                  <Text style={styles.stepBtnSecondaryText}>2. Pegar clave desde el portapapeles</Text>
                </TouchableOpacity>

                {/* Input Manual */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>O escribe / pega tu API Key manualmente:</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="key-outline" size={16} color={Colors.text.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="AIzaSy..."
                      placeholderTextColor={Colors.text.muted}
                      value={inputKey}
                      onChangeText={setInputKey}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* Botón de Guardado */}
                <TouchableOpacity
                  style={[styles.saveBtn, (!inputKey.trim() || isSaving) && styles.saveBtnDisabled]}
                  onPress={handleSaveKey}
                  disabled={!inputKey.trim() || isSaving}
                  activeOpacity={0.85}
                >
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {isSaving ? 'Vinculando...' : 'Vincular y Activar Modo Ilimitado'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.bg.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  subtitle: {
    color: Colors.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statusCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  statusCardStandard: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  statusCardUnlimited: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusDesc: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  manaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manaLabel: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  manaValue: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  manaTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  manaFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 3,
  },
  unlinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginTop: 6,
  },
  unlinkBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
  unlockSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionDesc: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
  },
  stepBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F0FF',
    padding: 12,
    borderRadius: Radius.md,
    gap: 10,
    marginTop: 4,
  },
  stepBtnPrimaryTitle: {
    color: '#0A0A0F',
    fontSize: 13,
    fontWeight: 'bold',
  },
  stepBtnPrimarySub: {
    color: '#1E293B',
    fontSize: 10,
  },
  stepBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    padding: 10,
    borderRadius: Radius.md,
    gap: 8,
  },
  stepBtnSecondaryText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    gap: 6,
    marginTop: 6,
  },
  inputLabel: {
    color: Colors.text.muted,
    fontSize: 11,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 12,
    paddingVertical: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.primary,
    padding: 12,
    borderRadius: Radius.md,
    gap: 8,
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
