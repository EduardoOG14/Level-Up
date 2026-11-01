import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { WEEKLY_BOSSES, type WeeklyBoss } from '../../constants/bosses';
import { useBossStore, type DefeatedBossRecord } from '../../stores/bossStore';
import { Haptics } from '../../services/haptics';

interface BossTowerModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToWorkouts?: () => void;
}

type FilterType = 'all' | 'conquered' | 'pending';

export function BossTowerModal({ visible, onClose, onNavigateToWorkouts }: BossTowerModalProps) {
  const { defeatedBossIds, defeatHistory, getActiveBoss } = useBossStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const activeBoss = getActiveBoss();
  const conqueredCount = defeatedBossIds.length;
  const totalFloors = WEEKLY_BOSSES.length;

  const totalXPEarned = useMemo(() => {
    return defeatHistory.reduce((sum, item) => sum + item.xpReward, 0);
  }, [defeatHistory]);

  const totalHPDrained = useMemo(() => {
    return defeatHistory.reduce((sum, item) => sum + item.totalHP, 0);
  }, [defeatHistory]);

  const displayedBosses = useMemo(() => {
    let list = WEEKLY_BOSSES.map((boss, index) => {
      const isDefeated = defeatedBossIds.includes(boss.id);
      const isCurrent = boss.id === activeBoss.id;
      const record = defeatHistory.find((r) => r.bossId === boss.id);
      return {
        boss,
        floorNumber: index + 1,
        isDefeated,
        isCurrent,
        isLocked: !isDefeated && !isCurrent,
        record,
      };
    });

    if (filter === 'conquered') {
      list = list.filter((item) => item.isDefeated);
    } else if (filter === 'pending') {
      list = list.filter((item) => !item.isDefeated);
    }

    if (sortOrder === 'desc') {
      list.reverse();
    }

    return list;
  }, [defeatedBossIds, defeatHistory, activeBoss.id, filter, sortOrder]);

  const handleShareTowerProgress = async () => {
    Haptics.medium();
    const message =
      `🏛️ LA TORRE DE JEFES • REGISTRO DE CAZADOR 🏛️\n\n` +
      `👑 Pisos Conquistados: ${conqueredCount} de ${totalFloors}\n` +
      `⚔️ Piso Actual en Asalto: Escalón ${Math.min(totalFloors, conqueredCount + 1)} (${activeBoss.name})\n` +
      `⚡ XP de Mazmorras: +${totalXPEarned.toLocaleString()} XP\n` +
      `💥 Daño Total al Abismo: ${totalHPDrained.toLocaleString()} HP drenado\n\n` +
      `"Solo los que superan el dolor de cada escalón alcanzan la cúspide." Entrena en FitRise CORTEX.`;

    try {
      await Share.share({ message });
    } catch {
      // Ignorar cancelaciones
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {/* ================= HEADER ANIME ================= */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerBadge}>
              <Ionicons name="shield" size={13} color="#00F0FF" />
              <Text style={styles.headerBadgeText}>SISTEMA CORTEX • MAZMORRA ASCENDENTE</Text>
            </View>
            <Text style={styles.titleMain}>LA TORRE DE JEFES</Text>
            <Text style={styles.titleSub}>Registro Biomecánico de Monarcas Conquistados</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShareTowerProgress} style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="share-social-outline" size={20} color="#00F0FF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= STATS PANEL ================= */}
        <View style={styles.statsPanel}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValGold}>{conqueredCount} / {totalFloors}</Text>
              <Text style={styles.statLbl}>PISOS CONQUISTADOS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValCyan}>+{totalXPEarned.toLocaleString()}</Text>
              <Text style={styles.statLbl}>XP ACUMULADA</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValPurple}>{totalHPDrained.toLocaleString()}</Text>
              <Text style={styles.statLbl}>HP ANIQUILADO</Text>
            </View>
          </View>

          {/* Barra de progreso de la Torre */}
          <View style={styles.towerProgressBarTrack}>
            <View
              style={[
                styles.towerProgressBarFill,
                { width: `${Math.max(4, Math.round((conqueredCount / totalFloors) * 100))}%` },
              ]}
            />
          </View>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressStatusText}>
              Ascensión: {Math.round((conqueredCount / totalFloors) * 100)}% de la Torre Sombría
            </Text>
            <Text style={styles.currentFloorBadge}>
              {conqueredCount >= totalFloors ? '👑 TORRE CONQUISTADA' : `Piso en Asalto: ${activeBoss.name.split(',')[0]}`}
            </Text>
          </View>
        </View>

        {/* ================= TABS DE FILTRO Y ORDEN ================= */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
              onPress={() => {
                Haptics.light();
                setFilter('all');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, filter === 'all' && styles.filterPillTextActive]}>
                Todos ({totalFloors})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filter === 'conquered' && styles.filterPillActiveGold]}
              onPress={() => {
                Haptics.light();
                setFilter('conquered');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, filter === 'conquered' && styles.filterPillTextActiveGold]}>
                👑 Vencidos ({conqueredCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filter === 'pending' && styles.filterPillActiveCyan]}
              onPress={() => {
                Haptics.light();
                setFilter('pending');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, filter === 'pending' && styles.filterPillTextActiveCyan]}>
                Pendientes ({totalFloors - conqueredCount})
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.sortToggleBtn}
            onPress={() => {
              Haptics.light();
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={14} color="#00F0FF" />
            <Text style={styles.sortToggleText}>
              {sortOrder === 'asc' ? 'Piso 1 → 22' : 'Cúspide → 1'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= LISTA DE PISOS DE LA TORRE ================= */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {displayedBosses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🛡️</Text>
              <Text style={styles.emptyTitle}>Sin Monarcas en esta categoría</Text>
              <Text style={styles.emptySub}>
                {filter === 'conquered'
                  ? 'Aún no has derrotado a ningún Monarca en los fines de semana de asalto. ¡Inicia tu primera batalla en la Puerta Roja!'
                  : 'Has conquistado todos los pisos disponibles en la Torre de Jefes. ¡Modo Cazador Absoluto!'}
              </Text>
            </View>
          ) : (
            displayedBosses.map((item) => (
              <BossFloorCard
                key={item.boss.id}
                item={item}
                onChallenge={() => {
                  onClose();
                  if (onNavigateToWorkouts) onNavigateToWorkouts();
                }}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// =========================================================================
// TARJETA DE CADA PISO DE LA TORRE
// =========================================================================
interface FloorItemData {
  boss: WeeklyBoss;
  floorNumber: number;
  isDefeated: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  record?: DefeatedBossRecord;
}

function BossFloorCard({
  item,
  onChallenge,
}: {
  item: FloorItemData;
  onChallenge: () => void;
}) {
  const { boss, floorNumber, isDefeated, isCurrent, isLocked, record } = item;
  const [showRoutine, setShowRoutine] = useState(false);

  // Selector de Rutina: Si está derrotado y hay snapshot, se usa el snapshot histórico. Si no, el circuito base.
  const routineList = record?.routine && record.routine.length > 0 ? record.routine : boss.circuit;

  return (
    <View
      style={[
        styles.cardContainer,
        isDefeated && { borderColor: boss.color || '#F59E0B' },
        isCurrent && styles.cardContainerCurrent,
        isLocked && styles.cardContainerLocked,
      ]}
    >
      {/* 1. Header de Estado del Piso */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.floorBadgeRow}>
          <View
            style={[
              styles.floorNumberBadge,
              { backgroundColor: isDefeated ? (boss.color || '#F59E0B') + '25' : '#141A26' },
            ]}
          >
            <Text
              style={[
                styles.floorNumberText,
                { color: isDefeated ? (boss.color || '#F59E0B') : isCurrent ? '#00F0FF' : '#64748B' },
              ]}
            >
              PISO {floorNumber.toString().padStart(2, '0')}
            </Text>
          </View>
          {boss.rankBadge && (
            <View style={styles.rankTierPill}>
              <Text style={styles.rankTierPillText}>{boss.rankBadge}</Text>
            </View>
          )}
        </View>

        <View style={styles.statusBadgeRow}>
          {isDefeated ? (
            <View style={styles.conqueredBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#10B981" />
              <Text style={styles.conqueredBadgeText}>CONQUISTADO</Text>
            </View>
          ) : isCurrent ? (
            <View style={styles.currentBadge}>
              <Ionicons name="flash" size={13} color="#00F0FF" />
              <Text style={styles.currentBadgeText}>EN ASALTO</Text>
            </View>
          ) : (
            <View style={styles.lockedBadge}>
              <Ionicons name="lock-closed" size={12} color="#64748B" />
              <Text style={styles.lockedBadgeText}>SELLADO</Text>
            </View>
          )}
        </View>
      </View>

      {/* 2. Banner Visual del Jefe (Foto Anime / Ilustración) */}
      <View style={styles.bossArtworkContainer}>
        {boss.imageUrl ? (
          <ExpoImage
            source={{ uri: boss.imageUrl }}
            style={styles.bossImage}
            contentFit="cover"
            cachePolicy="disk"
            transition={300}
          />
        ) : null}

        {/* Overlay Oscuro con Halo de Color */}
        <View
          style={[
            styles.artworkOverlay,
            { backgroundColor: isLocked ? 'rgba(7, 9, 14, 0.85)' : 'rgba(7, 9, 14, 0.55)' },
          ]}
        />

        {/* Kanji de Fondo Estilo Manhwa */}
        {boss.kanjiTitle && (
          <Text style={styles.artworkKanjiWatermark}>{boss.kanjiTitle}</Text>
        )}

        {/* Datos Superpuestos sobre la Foto */}
        <View style={styles.artworkContent}>
          <View style={styles.bossEmojiCircle}>
            <Text style={styles.bossEmoji}>{boss.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bossName, { color: isLocked ? '#94A3B8' : '#FFFFFF' }]}>
              {boss.name}
            </Text>
            <Text style={[styles.bossTitle, { color: isLocked ? '#64748B' : boss.color || '#00F0FF' }]}>
              {boss.title}
            </Text>
          </View>
        </View>

        {/* Badge de HP y Recompensa */}
        <View style={styles.artworkFooter}>
          <View style={styles.hpBadge}>
            <Ionicons name="heart" size={12} color="#EF4444" />
            <Text style={styles.hpBadgeText}>{boss.totalHP.toLocaleString()} HP</Text>
          </View>
          <View style={styles.xpBadge}>
            <Ionicons name="sparkles" size={12} color="#F59E0B" />
            <Text style={styles.xpBadgeText}>+{boss.xpReward} XP</Text>
          </View>
        </View>
      </View>

      {/* 3. Metadatos de Victoria: Fecha Exacta de Derrota */}
      {isDefeated && record && (
        <View style={styles.victoryMetadataBox}>
          <View style={styles.victoryMetadataRow}>
            <Ionicons name="calendar-outline" size={14} color="#10B981" />
            <Text style={styles.victoryDateText}>
              Fecha de Conquista: <Text style={styles.victoryDateHighlight}>{record.formattedDate}</Text>
            </Text>
          </View>
          <View style={styles.victoryStatsRow}>
            <Text style={styles.victorySubText}>
              ⚔️ Blindaje Drenado: {record.totalHP.toLocaleString()} HP • Nivel Cazador: {record.userLevelAtDefeat || 1}
            </Text>
          </View>
        </View>
      )}

      {/* 4. Lore Narrativo */}
      <Text style={styles.bossLore} numberOfLines={isLocked ? 2 : 4}>
        {boss.lore}
      </Text>

      {/* 5. Desglose de Rutina Biomecánica */}
      <View style={styles.routineSection}>
        <TouchableOpacity
          style={styles.routineHeaderBtn}
          onPress={() => {
            Haptics.light();
            setShowRoutine((prev) => !prev);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.routineHeaderLeft}>
            <Ionicons
              name={isDefeated ? 'barbell' : 'shield-half-outline'}
              size={15}
              color={isDefeated ? '#10B981' : '#00F0FF'}
            />
            <Text style={styles.routineHeaderTitle}>
              {isDefeated ? 'Rutina Ejecutada en el Asalto' : 'Circuito Requerido para Desafío'}
            </Text>
            <View style={styles.routineStationCountPill}>
              <Text style={styles.routineStationCountText}>{routineList.length} estaciones</Text>
            </View>
          </View>
          <Ionicons
            name={showRoutine ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.text.secondary}
          />
        </TouchableOpacity>

        {showRoutine && (
          <View style={styles.routineList}>
            {routineList.map((exercise, idx) => (
              <View key={`${exercise.id}-${idx}`} style={styles.exerciseItemRow}>
                <View style={styles.exerciseStepPill}>
                  <Text style={styles.exerciseStepText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseNameText}>{exercise.name}</Text>
                  <Text style={styles.exerciseMetaText}>
                    {exercise.sets || 3} series • {exercise.repsLabel}
                  </Text>
                  {exercise.muscles && exercise.muscles.length > 0 && (
                    <Text style={styles.exerciseMusclesText}>
                      🎯 {exercise.muscles.join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 6. Botón de Acción según Estado */}
      {isCurrent && (
        <TouchableOpacity
          style={[styles.actionBtnCurrent, { backgroundColor: boss.color || '#00F0FF' }]}
          onPress={() => {
            Haptics.heavy();
            onChallenge();
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="skull" size={16} color="#07090E" />
          <Text style={styles.actionBtnCurrentText}>IR A LA PUERTA ROJA (DESAFIAR)</Text>
        </TouchableOpacity>
      )}

      {isLocked && (
        <View style={styles.lockedNoticeBox}>
          <Ionicons name="lock-closed-outline" size={13} color="#64748B" />
          <Text style={styles.lockedNoticeText}>
            Sellado por CORTEX: Requiere conquistar el Piso {floorNumber - 1} para romper el sello.
          </Text>
        </View>
      )}
    </View>
  );
}

// =========================================================================
// ESTILOS VISUALES SOLO LEVELING / CORTEX UI
// =========================================================================
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  headerBadgeText: {
    color: '#00F0FF',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  titleMain: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleSub: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121824',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121824',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Stats Panel
  statsPanel: {
    backgroundColor: '#0D111A',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValGold: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statValCyan: {
    color: '#00F0FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statValPurple: {
    color: '#C084FC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLbl: {
    color: Colors.text.secondary,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  towerProgressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#161D2B',
    borderRadius: 3,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  towerProgressBarFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressStatusText: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontWeight: '500',
  },
  currentFloorBadge: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Filters
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: '#00F0FF',
  },
  filterPillActiveGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  filterPillActiveCyan: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06B6D4',
  },
  filterPillText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  filterPillTextActiveGold: {
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  filterPillTextActiveCyan: {
    color: '#06B6D4',
    fontWeight: 'bold',
  },
  sortToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    backgroundColor: '#121622',
  },
  sortToggleText: {
    color: '#00F0FF',
    fontSize: 10.5,
    fontWeight: 'bold',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
    gap: Spacing.lg,
  },

  // Card
  cardContainer: {
    backgroundColor: '#0E131E',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  cardContainerCurrent: {
    borderColor: '#00F0FF',
    backgroundColor: '#101726',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cardContainerLocked: {
    opacity: 0.75,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#090D14',
  },

  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floorNumberBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
  },
  floorNumberText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  rankTierPill: {
    backgroundColor: '#172033',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankTierPillText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusBadgeRow: {},
  conqueredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  conqueredBadgeText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
  },
  currentBadgeText: {
    color: '#00F0FF',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  lockedBadgeText: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: 'bold',
  },

  // Artwork
  bossArtworkContainer: {
    height: 140,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: '#141824',
  },
  bossImage: {
    ...StyleSheet.absoluteFill,
  },
  artworkOverlay: {
    ...StyleSheet.absoluteFill,
  },
  artworkKanjiWatermark: {
    position: 'absolute',
    right: 10,
    top: 5,
    fontSize: 54,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.08)',
  },
  artworkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  bossEmojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossEmoji: {
    fontSize: 24,
  },
  bossName: {
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bossTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  artworkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  hpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  hpBadgeText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  xpBadgeText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Victory metadata
  victoryMetadataBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: 4,
  },
  victoryMetadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  victoryDateText: {
    color: Colors.text.secondary,
    fontSize: 11,
  },
  victoryDateHighlight: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  victoryStatsRow: {
    marginTop: 2,
  },
  victorySubText: {
    color: '#6EE7B7',
    fontSize: 10,
    fontWeight: '500',
  },

  // Lore
  bossLore: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },

  // Routine
  routineSection: {
    backgroundColor: '#090D15',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  routineHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  routineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  routineHeaderTitle: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  routineStationCountPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
  },
  routineStationCountText: {
    color: Colors.text.secondary,
    fontSize: 9.5,
    fontWeight: '600',
  },
  routineList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  exerciseItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  exerciseStepPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#161D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  exerciseStepText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  exerciseNameText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  exerciseMetaText: {
    color: Colors.text.secondary,
    fontSize: 11,
    marginTop: 1,
  },
  exerciseMusclesText: {
    color: '#00F0FF',
    fontSize: 10,
    marginTop: 2,
  },

  // Actions
  actionBtnCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  actionBtnCurrentText: {
    color: '#07090E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lockedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    borderRadius: Radius.md,
  },
  lockedNoticeText: {
    flex: 1,
    color: '#64748B',
    fontSize: 10.5,
    lineHeight: 14,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySub: {
    color: Colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
