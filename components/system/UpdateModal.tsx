import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUpdateStore } from '../../stores/updateStore';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';

export function UpdateModal() {
  const {
    isModalVisible,
    updateInfo,
    isDownloading,
    downloadProgress,
    downloadProgressText,
    isInstalling,
    downloadError,
    dismissModal,
    startInAppUpdate,
    downloadLatestApk,
  } = useUpdateStore();

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
                <Ionicons
                  name={isInstalling ? 'checkmark-circle' : 'cloud-download'}
                  size={20}
                  color={isInstalling ? '#10B981' : '#00F0FF'}
                />
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text style={styles.systemTag}>
                  {isInstalling
                    ? '[ SISTEMA: INSTALADOR ACTIVO ]'
                    : isDownloading
                    ? '[ SISTEMA: DESCARGANDO PARCHE ]'
                    : '[ SISTEMA: ACTUALIZACIÓN DISPONIBLE ]'}
                </Text>
                <Text style={styles.systemSub}>ACTUALIZACIÓN DIRECTA EN LA APP</Text>
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

          {/* Barra de Progreso Holográfica en Descarga */}
          {isDownloading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <View style={styles.downloadStatusRow}>
                  <ActivityIndicator size="small" color="#00F0FF" />
                  <Text style={styles.progressStatusText}>DESCARGANDO PARCHE CORTEX...</Text>
                </View>
                <Text style={styles.progressPercentText}>{Math.round(downloadProgress * 100)}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(5, Math.round(downloadProgress * 100))}%` },
                  ]}
                />
              </View>

              <Text style={styles.progressBytesText}>
                {downloadProgressText || 'Descargando datos...'}
              </Text>
            </View>
          )}

          {/* Estado de Instalación Lanzada */}
          {isInstalling && (
            <View style={styles.installingContainer}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.installingTitle}>Instalador nativo ejecutándose</Text>
                <Text style={styles.installingSubtitle}>
                  Confirma la actualización en el cuadro del sistema. Tus datos no se perderán.
                </Text>
              </View>
            </View>
          )}

          {/* Mensaje de Error en caso de falla */}
          {!!downloadError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{downloadError}</Text>
            </View>
          )}

          {/* Indicador de Seguridad Local */}
          {!isDownloading && !isInstalling && (
            <View style={styles.safetyBadgeRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#10B981" />
              <Text style={styles.safetyBadgeText}>
                Sin páginas externas: Se descarga e instala directamente desde tu dispositivo.
              </Text>
            </View>
          )}

          {/* Botones de Acción Tácticos */}
          <View style={styles.actionsContainer}>
            {isDownloading ? (
              <View style={[styles.downloadBtn, styles.downloadBtnActive]}>
                <ActivityIndicator size="small" color="#0A0A0F" />
                <Text style={styles.downloadBtnText}>
                  [ DESCARGANDO... {Math.round(downloadProgress * 100)}% ]
                </Text>
              </View>
            ) : isInstalling ? (
              <>
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={startInAppUpdate}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={18} color="#0A0A0F" />
                  <Text style={styles.downloadBtnText}>[ REABRIR INSTALADOR ]</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.postponeBtn}
                  onPress={dismissModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.postponeBtnText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            ) : downloadError ? (
              <>
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={startInAppUpdate}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={18} color="#0A0A0F" />
                  <Text style={styles.downloadBtnText}>[ REINTENTAR EN LA APP ]</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={downloadLatestApk}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryBtnText}>Abrir descarga en navegador</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.postponeBtn}
                  onPress={dismissModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.postponeBtnText}>Recordar más tarde</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={startInAppUpdate}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flash" size={18} color="#0A0A0F" />
                  <Text style={styles.downloadBtnText}>[ ACTUALIZAR DIRECTO EN LA APP ]</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.postponeBtn}
                  onPress={dismissModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.postponeBtnText}>Recordar más tarde</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  systemSub: {
    color: '#64748B',
    fontSize: 9.5,
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
    maxHeight: 120,
    gap: 6,
  },
  releaseTitle: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  notesScroll: {
    maxHeight: 85,
  },
  notesText: {
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 17,
  },
  progressContainer: {
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressStatusText: {
    color: '#00F0FF',
    fontSize: 10.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  progressPercentText: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 4,
  },
  progressBytesText: {
    color: '#64748B',
    fontSize: 10.5,
    textAlign: 'right',
  },
  installingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  installingTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  installingSubtitle: {
    color: '#94A3B8',
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    flex: 1,
  },
  safetyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
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
  downloadBtnActive: {
    backgroundColor: '#38BDF8',
  },
  downloadBtnText: {
    color: '#0A0A0F',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: '#00F0FF',
    fontSize: 11.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  postponeBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  postponeBtnText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
