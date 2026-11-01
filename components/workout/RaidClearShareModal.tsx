import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { Haptics } from '../../services/haptics';

interface RaidClearModalProps {
  visible: boolean;
  onClose: () => void;
  bossName: string;
  bossTitle: string;
  rankBadge: string;
  bossImageUrl?: string;
  hunterName: string;
  hunterLevel: number;
  xpEarned: number;
  totalTimeMinutes: number;
  streakDays: number;
  dateStr?: string;
}

export function RaidClearShareModal({
  visible,
  onClose,
  bossName,
  bossTitle,
  rankBadge,
  bossImageUrl,
  hunterName,
  hunterLevel,
  xpEarned,
  totalTimeMinutes,
  streakDays,
  dateStr,
}: RaidClearModalProps) {
  if (!visible) return null;

  const now = dateStr || new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleShare = async () => {
    Haptics.medium();
    const shareText =
      `⚔️ ¡MAZMORRA CONQUISTADA EN LEVEL UP! 🏆\n\n` +
      `👑 Monarca Derrotado: ${bossName} (${rankBadge})\n` +
      `👤 Cazador: ${hunterName} • Nivel ${hunterLevel}\n` +
      `⚡ Recompensa: +${xpEarned} XP\n` +
      `🔥 Racha Implacable: ${streakDays} Días\n` +
      `⏱️ Tiempo de Asalto: ${totalTimeMinutes} min\n` +
      `📅 Fecha: ${now}\n\n` +
      `¡Entrena con el Sistema de Cazadores Level Up! Descarga la app y sube de rango.`;

    try {
      await Share.share({
        message: shareText,
        title: `Victoria de Cazador - ${bossName}`,
      });
    } catch {
      // Ignorar cancelaciones
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeClear}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.badgeClearText}>RAID CLEAR • PROTOCOLO CONCLUIDO</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Tarjeta Visual de Poster Anime */}
          <View style={styles.poster}>
            {bossImageUrl ? (
              <ExpoImage
                source={{ uri: bossImageUrl }}
                style={styles.bossImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.bossImage, { backgroundColor: '#1E1B4B' }]} />
            )}

            <View style={styles.posterGradientOverlay}>
              <View style={styles.bossRankTag}>
                <Text style={styles.bossRankTagText}>{rankBadge}</Text>
              </View>

              <Text style={styles.bossName}>{bossName}</Text>
              <Text style={styles.bossTitle}>{bossTitle}</Text>

              <View style={styles.conqueredBanner}>
                <Text style={styles.conqueredBannerText}>[ MONARCA ANIQUILADO ]</Text>
              </View>
            </View>
          </View>

          {/* Estadísticas de la Victoria */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>CAZADOR</Text>
              <Text style={styles.statValue} numberOfLines={1}>{hunterName}</Text>
              <Text style={styles.statSub}>Nivel {hunterLevel}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>EXPERIENCIA</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>+{xpEarned} XP</Text>
              <Text style={styles.statSub}>Fuerza & Rango</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DURACIÓN</Text>
              <Text style={styles.statValue}>{totalTimeMinutes} min</Text>
              <Text style={styles.statSub}>Intensidad 100%</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>RACHA</Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>🔥 {streakDays}d</Text>
              <Text style={styles.statSub}>Pacto Intacto</Text>
            </View>
          </View>

          {/* Botón Compartir */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={18} color="#0A0A0F" />
            <Text style={styles.shareBtnText}>COMPARTIR HAZAÑA DE COMBATE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 17, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0F121E',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  badgeClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeClearText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  poster: {
    width: '100%',
    height: 180,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#040711',
    marginBottom: Spacing.md,
  },
  bossImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  posterGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 10, 20, 0.65)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  bossRankTag: {
    backgroundColor: '#EF4444',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  bossRankTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bossName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  bossTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  conqueredBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: Radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  conqueredBannerText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  statBox: {
    width: '48.5%',
    backgroundColor: '#070A14',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  statSub: {
    color: '#94A3B8',
    fontSize: 9.5,
    marginTop: 1,
  },
  shareBtn: {
    width: '100%',
    backgroundColor: '#00F0FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    shadowColor: '#00F0FF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  shareBtnText: {
    color: '#0A0A0F',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
