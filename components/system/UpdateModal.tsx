import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUpdateStore } from '../../stores/updateStore';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';

export function UpdateModal() {
  const { isModalVisible, updateInfo, dismissModal, downloadLatestApk } = useUpdateStore();

  // Animación de pulso continuo (Solo Leveling HUD)
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isModalVisible) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isModalVisible, pulseAnim]);

  if (!isModalVisible || !updateInfo) return null;

  const borderPulse = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 240, 255, 0.35)', 'rgba(0, 240, 255, 0.85)'],
  });

  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={dismissModal}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalBox, { borderColor: borderPulse }]}>
          {/* Header del Sistema Solo Leveling */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Animated.View style={[styles.iconSquircle, { transform: [{ scale: glowScale }] }]}>
                <Ionicons name="cloud-download" size={20} color="#00F0FF" />
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text style={styles.systemTag}>[ SISTEMA: ACTUALIZACIÓN DISPONIBLE ]</Text>
                <Text style={styles.systemSub}>DIRECTIVA DE ACTUALIZACIÓN CORTEX</Text>
              </View>
            </View>
          </View>

          {/* Comparativa de Versión */}
          <View style={styles.versionCompareCard}>
            <View style={styles.versionBox}>
              <Text style={styles.versionBoxLabel}>VERSIÓN ACTUAL</Text>
              <Text style={styles.versionBoxVal}>v{updateInfo.currentVersion}</Text>
            </View>

            <View style={styles.arrowBox}>
              <Ionicons name="arrow-forward" size={18} color="#00F0FF" />
            </View>

            <View style={[styles.versionBox, styles.versionBoxNew]}>
              <Text style={[styles.versionBoxLabel, { color: '#10B981' }]}>NUEVA VERSIÓN</Text>
              <Text style={[styles.versionBoxVal, { color: '#10B981' }]}>v{updateInfo.latestVersion}</Text>
            </View>
          </View>

          {/* Título de la Release y Notas de Versión */}
          <View style={styles.notesContainer}>
            <Text style={styles.releaseTitle}>{updateInfo.releaseTitle}</Text>
            <ScrollView style={styles.notesScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.notesText}>{updateInfo.releaseNotes}</Text>
            </ScrollView>
          </View>

          {/* Indicador de Seguridad Local */}
          <View style={styles.safetyBadgeRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#10B981" />
            <Text style={styles.safetyBadgeText}>
              Actualización directa: Tus atributos, rachas y progreso se conservarán intactos.
            </Text>
          </View>

          {/* Botones de Acción Tácticos */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={downloadLatestApk}
              activeOpacity={0.8}
            >
              <Ionicons name="download" size={18} color="#0A0A0F" />
              <Text style={styles.downloadBtnText}>[ DESCARGAR E INSTALAR APK ]</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postponeBtn}
              onPress={dismissModal}
              activeOpacity={0.7}
            >
              <Text style={styles.postponeBtnText}>Recordar más tarde</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  modalBox: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#0F121E',
    borderRadius: 22,
    borderWidth: 1.8,
    padding: 20,
    gap: 14,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 12,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconSquircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemTag: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  systemSub: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  versionCompareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  versionBox: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  versionBoxNew: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  versionBoxLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  versionBoxVal: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '900',
  },
  arrowBox: {
    paddingHorizontal: 4,
  },
  notesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    maxHeight: 140,
    gap: 6,
  },
  releaseTitle: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  notesScroll: {
    maxHeight: 100,
  },
  notesText: {
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 17,
  },
  safetyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  safetyBadgeText: {
    flex: 1,
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  actionsContainer: {
    gap: 8,
    marginTop: 4,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00F0FF',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  downloadBtnText: {
    color: '#0A0A0F',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  postponeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  postponeBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});
