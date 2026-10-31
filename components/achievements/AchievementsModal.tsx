import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import {
  ACHIEVEMENTS_LIST,
  type Achievement,
  type AchievementCategory,
} from '../../constants/achievements';
import { useAchievementStore } from '../../stores/achievementStore';
import { useUserStore } from '../../stores/userStore';

interface AchievementsModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORY_TABS: { key: AchievementCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Todos', icon: 'grid-outline' },
  { key: 'progression', label: 'Nivel', icon: 'trending-up-outline' },
  { key: 'quests', label: 'Misiones', icon: 'checkmark-circle-outline' },
  { key: 'workouts', label: 'Circuitos', icon: 'barbell-outline' },
  { key: 'exercises', label: 'Técnica', icon: 'body-outline' },
  { key: 'discipline', label: 'Disciplina', icon: 'flame-outline' },
  { key: 'legendary', label: 'Leyendas', icon: 'star-outline' },
];

export function AchievementsModal({ visible, onClose }: AchievementsModalProps) {
  const { user } = useUserStore();
  const { unlockedIds, isAllCompleted } = useAchievementStore();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  if (!visible) return null;

  const totalCount = ACHIEVEMENTS_LIST.length;
  const unlockedCount = unlockedIds.length;
  const isTranscendenceUnlocked = isAllCompleted();

  const filteredAchievements =
    selectedCategory === 'all'
      ? ACHIEVEMENTS_LIST
      : ACHIEVEMENTS_LIST.filter((a) => a.category === selectedCategory);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalBox, isTranscendenceUnlocked && styles.transcendenceBox]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, isTranscendenceUnlocked && styles.transcendenceTitle]}>
                {isTranscendenceUnlocked
                  ? '🏛️ PANTEÓN DEL MONARCA SUPREMO'
                  : '🏆 Salón de Logros Tácticos'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isTranscendenceUnlocked
                  ? 'Trascendencia Absoluta alcanzada • 52 de 52 Logros Conquistados'
                  : `${unlockedCount} de ${totalCount} logros desbloqueados (${Math.round((unlockedCount / totalCount) * 100)}%)`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Menú Especial de Trascendencia (Si se completaron los 52 logros) */}
          {isTranscendenceUnlocked ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              <View style={styles.monarchCard}>
                <View style={styles.monarchCrownGlow}>
                  <Text style={styles.monarchCrown}>👑</Text>
                </View>
                <Text style={styles.monarchHeader}>¡HONOR AL MONARCA SUPREMO!</Text>
                <Text style={styles.monarchName}>{user?.name || 'Cazador'}</Text>
                <Text style={styles.monarchTribute}>
                  Has conquistado cada uno de los 52 desafíos del Sistema CORTEX. Tu constancia
                  inquebrantable, fuerza indómita y dedicación absoluta te han elevado por encima
                  de todo límite humano.
                </Text>

                <View style={styles.monarchStatRow}>
                  <View style={styles.monarchStatItem}>
                    <Text style={styles.monarchStatVal}>52 / 52</Text>
                    <Text style={styles.monarchStatLabel}>Logros Completos</Text>
                  </View>
                  <View style={styles.monarchStatItem}>
                    <Text style={styles.monarchStatVal}>RANGO SSS</Text>
                    <Text style={styles.monarchStatLabel}>Estado Vitalicio</Text>
                  </View>
                  <View style={styles.monarchStatItem}>
                    <Text style={styles.monarchStatVal}>100%</Text>
                    <Text style={styles.monarchStatLabel}>Disciplina</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionHeader}>Vitrina de Hazañas Conquistadas</Text>

              {ACHIEVEMENTS_LIST.map((ach) => (
                <View key={ach.id} style={styles.monarchAchCard}>
                  <Text style={styles.achEmoji}>{ach.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.monarchAchTitle}>{ach.title}</Text>
                    <Text style={styles.achDesc}>{ach.description}</Text>
                  </View>
                  <View style={styles.monarchBadge}>
                    <Text style={styles.monarchBadgeText}>✓</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <>
              {/* Barra de Progreso Global */}
              <View style={styles.globalProgressTrack}>
                <View
                  style={[
                    styles.globalProgressBar,
                    { width: `${Math.min(100, Math.round((unlockedCount / totalCount) * 100))}%` },
                  ]}
                />
              </View>

              {/* Categorías / Filtros */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORY_TABS.map((cat) => {
                  const isActive = selectedCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                      onPress={() => setSelectedCategory(cat.key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={isActive ? '#0A0A0F' : '#94A3B8'}
                      />
                      <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Lista de Logros */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {filteredAchievements.map((ach) => {
                  const isUnlocked = unlockedIds.includes(ach.id);
                  return (
                    <View
                      key={ach.id}
                      style={[
                        styles.achievementCard,
                        isUnlocked && styles.achievementCardUnlocked,
                      ]}
                    >
                      <View style={[styles.emojiBox, isUnlocked && styles.emojiBoxUnlocked]}>
                        <Text style={styles.achEmoji}>{isUnlocked ? ach.emoji : '🔒'}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.achTitle,
                            isUnlocked && styles.achTitleUnlocked,
                          ]}
                        >
                          {ach.title}
                        </Text>
                        <Text style={styles.achDesc}>{ach.description}</Text>
                      </View>

                      <View style={[styles.rewardBadge, isUnlocked && styles.rewardBadgeUnlocked]}>
                        <Text style={[styles.rewardText, isUnlocked && styles.rewardTextUnlocked]}>
                          {isUnlocked ? '✓ Obtenido' : `+${ach.xpReward} XP`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#0D0E1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    maxHeight: '92%',
    gap: 12,
  },
  transcendenceBox: {
    borderColor: '#F59E0B',
    backgroundColor: '#120E08',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transcendenceTitle: {
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    marginLeft: 10,
  },
  globalProgressTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  globalProgressBar: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 3,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#131525',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  categoryTabActive: {
    backgroundColor: '#00F0FF',
    borderColor: '#00F0FF',
  },
  categoryTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#0A0A0F',
    fontWeight: 'bold',
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131525',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
    opacity: 0.6,
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    backgroundColor: '#111827',
  },
  emojiBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBoxUnlocked: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  achEmoji: {
    fontSize: 20,
  },
  achTitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  achTitleUnlocked: {
    color: '#F8FAFC',
  },
  achDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  rewardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#1E293B',
  },
  rewardBadgeUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  rewardText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  rewardTextUnlocked: {
    color: '#10B981',
  },
  // Panteón del Monarca
  monarchCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  monarchCrownGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  monarchCrown: {
    fontSize: 32,
  },
  monarchHeader: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  monarchName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  monarchTribute: {
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  monarchStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  monarchStatItem: {
    alignItems: 'center',
  },
  monarchStatVal: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  monarchStatLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeader: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  monarchAchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    gap: 12,
  },
  monarchAchTitle: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  monarchBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monarchBadgeText: {
    color: '#0A0A0F',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
