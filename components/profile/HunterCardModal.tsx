import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../stores/userStore';
import { getRankByXP, getXPForNextLevel } from '../../constants/ranks';
import { renderAvatarContent } from '../ui/Avatar';
import { Haptics } from '../../services/haptics';
import { useTitleStore } from '../../stores/titleStore';

interface HunterCardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HunterCardModal({ visible, onClose }: HunterCardModalProps) {
  const { user } = useUserStore();
  const { currentTitle } = useTitleStore();

  if (!user || !visible) return null;

  const totalXP = user.totalXP || 0;
  const rank = getRankByXP(totalXP);
  const xpInfo = getXPForNextLevel(totalXP);

  const safeTitle = currentTitle || {
    id: 'cortex_initiate',
    name: 'Iniciado de CORTEX',
    badgeEmoji: '🪨',
    color: '#9CA3AF',
    lore: 'El despertar del cazador ha comenzado.',
    criteriaLabel: 'Título base del Sistema',
    priority: 10,
  };

  const hunterId = `CORTEX-KR-${user.uid ? user.uid.slice(0, 6).toUpperCase() : '8849'}`;

  const handleShare = async () => {
    Haptics.medium();
    try {
      const message = `⚔️ LICENCIA DE CAZADOR CORTEX ⚔️\n\n` +
        `👤 Cazador: ${user.name || 'Cazador'}\n` +
        `🎖️ Rango: ${rank.label} (${rank.key})\n` +
        `👑 Título: ${safeTitle.name}\n` +
        `⚡ Nivel: ${user.level || 1} (${totalXP.toLocaleString()} XP)\n` +
        `🔥 Racha: ${user.streak || 0} días\n` +
        `💪 Circuitos: ${user.workoutsCompleted || 0}\n\n` +
        `"La disciplina supera a la motivación." Entrena con CORTEX en Level Up.`;

      await Share.share({
        message,
        title: `Ficha de Cazador - ${user.name || 'Cazador'}`,
      });
    } catch (err) {
      console.warn('Error compartiendo ficha:', err);
      Alert.alert('Error', 'No se pudo abrir el menú de compartir.');
    }
  };

  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInfo.progress || 0) * 100)));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="card-outline" size={18} color="#00F0FF" />
              <Text style={styles.modalTitle}>[ CREDENCIAL DE CAZADOR ]</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Tarjeta de Licencia Minimalista y Elegante */}
            <View style={styles.hunterCard}>
              {/* Encabezado de la Tarjeta */}
              <View style={styles.cardTopRow}>
                <View style={styles.watermarkBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#00F0FF" />
                  <Text style={styles.watermarkText}>ASOCIACIÓN DE CAZADORES</Text>
                </View>
                <Text style={styles.hunterIdText}>{hunterId}</Text>
              </View>

              {/* Avatar + Datos Principales */}
              <View style={styles.profileRow}>
                <View style={styles.avatarBorder}>
                  {renderAvatarContent(user.avatar, user.name, 64)}
                  <View style={[styles.rankBadgeMini, { backgroundColor: rank.color }]}>
                    <Text style={styles.rankBadgeMiniText}>{rank.key}</Text>
                  </View>
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.hunterName} numberOfLines={1}>
                    {user.name || 'Cazador'}
                  </Text>
                  <Text style={styles.hunterClass}>Cazador Calisténico</Text>
                  <View style={styles.tagsRow}>
                    <View style={[styles.rankPill, { borderColor: rank.color + '55' }]}>
                      <Text style={[styles.rankPillText, { color: rank.color }]}>
                        {rank.label} • LVL {user.level || 1}
                      </Text>
                    </View>
                    <View style={[styles.titlePill, { borderColor: safeTitle.color + '55' }]}>
                      <Text style={styles.titlePillEmoji}>{safeTitle.badgeEmoji}</Text>
                      <Text style={[styles.titlePillText, { color: safeTitle.color }]}>
                        {safeTitle.name}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Barra de EXP Simplificada */}
              <View style={styles.xpSection}>
                <View style={styles.xpRow}>
                  <Text style={styles.xpLabel}>Experiencia de Rango</Text>
                  <Text style={styles.xpValue}>
                    {(xpInfo.current || 0).toLocaleString()} / {(xpInfo.required || 1000).toLocaleString()} XP
                  </Text>
                </View>
                <View style={styles.xpTrack}>
                  <View style={[styles.xpBar, { width: `${progressPercent}%` }]} />
                </View>
              </View>

              {/* Atributos / Stats */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>💪</Text>
                  <Text style={styles.statVal}>{user.stats?.strength || 1}</Text>
                  <Text style={styles.statName}>Fuerza</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>⚡</Text>
                  <Text style={styles.statVal}>{user.stats?.agility || 1}</Text>
                  <Text style={styles.statName}>Agilidad</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>💚</Text>
                  <Text style={styles.statVal}>{user.stats?.vitality || 1}</Text>
                  <Text style={styles.statName}>Vitalidad</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>🛡️</Text>
                  <Text style={styles.statVal}>{user.stats?.discipline || 1}</Text>
                  <Text style={styles.statName}>Disciplina</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>🧠</Text>
                  <Text style={styles.statVal}>{user.stats?.mind || 1}</Text>
                  <Text style={styles.statName}>Mente</Text>
                </View>
              </View>

              {/* Registro de Combate */}
              <View style={styles.recordsRow}>
                <View style={styles.recordItem}>
                  <Text style={styles.recordNum}>{user.streak || 0}</Text>
                  <Text style={styles.recordLabel}>Racha Días</Text>
                </View>
                <View style={styles.recordDivider} />
                <View style={styles.recordItem}>
                  <Text style={styles.recordNum}>{user.workoutsCompleted || 0}</Text>
                  <Text style={styles.recordLabel}>Circuitos</Text>
                </View>
                <View style={styles.recordDivider} />
                <View style={styles.recordItem}>
                  <Text style={styles.recordNum}>{user.questsCompleted || 0}</Text>
                  <Text style={styles.recordLabel}>Misiones</Text>
                </View>
              </View>

              {/* Footer de Autenticidad */}
              <View style={styles.cardFooter}>
                <Ionicons name="finger-print-outline" size={13} color="#64748B" />
                <Text style={styles.footerNote}>Certificación CORTEX Neural System</Text>
              </View>
            </View>
          </ScrollView>

          {/* Botón Compartir */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social-outline" size={17} color="#0A0A0F" />
            <Text style={styles.shareBtnText}>COMPARTIR FICHA</Text>
          </TouchableOpacity>
        </View>
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
  modalContent: {
    backgroundColor: '#0F121E',
    borderRadius: 20,
    width: '100%',
    maxWidth: 390,
    maxHeight: '88%',
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#1E293B',
  },
  scrollBody: {
    paddingBottom: 4,
  },
  hunterCard: {
    backgroundColor: '#141724',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    padding: 16,
    gap: 13,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  watermarkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  watermarkText: {
    color: '#00F0FF',
    fontSize: 8.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  hunterIdText: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '600',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    position: 'relative',
    borderRadius: 36,
    padding: 2,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
  },
  rankBadgeMini: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F111A',
  },
  rankBadgeMiniText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 9.5,
  },
  profileInfo: {
    flex: 1,
  },
  hunterName: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: 'bold',
  },
  hunterClass: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  rankPill: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 1,
  },
  rankPillText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  titlePillEmoji: {
    fontSize: 10,
  },
  titlePillText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  xpSection: {
    gap: 4,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpLabel: {
    color: '#64748B',
    fontSize: 10.5,
  },
  xpValue: {
    color: '#00F0FF',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  xpTrack: {
    height: 5,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0D0E17',
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 13,
  },
  statVal: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statName: {
    color: '#64748B',
    fontSize: 8.5,
    marginTop: 1,
  },
  recordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
  },
  recordItem: {
    alignItems: 'center',
  },
  recordNum: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recordLabel: {
    color: '#64748B',
    fontSize: 9.5,
    marginTop: 1,
  },
  recordDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#1E293B',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 8,
  },
  footerNote: {
    color: '#64748B',
    fontSize: 8.5,
  },
  shareBtn: {
    backgroundColor: '#00F0FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  shareBtnText: {
    color: '#0A0A0F',
    fontSize: 12.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
});
