import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { useShadowArmyStore, ShadowArmySoldier } from '../../stores/shadowArmyStore';
import { Haptics } from '../../services/haptics';

interface ShadowArmyModalProps {
  visible: boolean;
  onClose: () => void;
  uid: string;
}

export function ShadowArmyModal({ visible, onClose, uid }: ShadowArmyModalProps) {
  const { soldiers, equippedShadowId, equipShadow, unequipShadow } = useShadowArmyStore();
  const [selectedSoldier, setSelectedSoldier] = useState<ShadowArmySoldier | null>(null);

  if (!visible) return null;

  const equippedSoldier = soldiers.find((s) => s.bossId === equippedShadowId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBox}>
                <Ionicons name="skull" size={18} color="#C084FC" />
              </View>
              <View>
                <Text style={styles.headerTitle}>EJÉRCITO DE SOMBRAS</Text>
                <Text style={styles.headerSub}>
                  {soldiers.length} Monarcas y Bestias Extraídas
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Sombra Activa / Comandante Equipado */}
          {equippedSoldier ? (
            <View style={styles.equippedCard}>
              <View style={styles.equippedHeader}>
                <Ionicons name="shield-checkmark" size={13} color="#C084FC" />
                <Text style={styles.equippedBadgeText}>SOMBRA COMANDANTE ACTIVA</Text>
              </View>
              <View style={styles.equippedBody}>
                <Text style={styles.equippedEmoji}>{equippedSoldier.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.equippedName}>{equippedSoldier.shadowTitle}</Text>
                  <Text style={styles.equippedBuff}>{equippedSoldier.buffDescription}</Text>
                </View>
                <TouchableOpacity
                  style={styles.unequipBtn}
                  onPress={() => unequipShadow(uid)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.unequipBtnText}>Desequipar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noEquippedCard}>
              <Ionicons name="alert-circle-outline" size={16} color="#94A3B8" />
              <Text style={styles.noEquippedText}>
                No tienes ninguna sombra equipada. Elige una abajo para activar su buff pasivo en combate.
              </Text>
            </View>
          )}

          {/* Lista de Sombras Extraídas */}
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {soldiers.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🌑</Text>
                <Text style={styles.emptyTitle}>Ninguna Sombra en tus Filas</Text>
                <Text style={styles.emptyDesc}>
                  Derrota a los Monarcas Semanales en la Torre de Jefes para usar «Surge» y extraer sus sombras con buffs pasivos permanentes.
                </Text>
              </View>
            ) : (
              soldiers.map((soldier) => {
                const isEquipped = soldier.bossId === equippedShadowId;

                return (
                  <View
                    key={soldier.bossId}
                    style={[styles.soldierCard, isEquipped && styles.soldierCardEquipped]}
                  >
                    <View style={styles.soldierTop}>
                      {soldier.imageUrl ? (
                        <ExpoImage
                          source={{ uri: soldier.imageUrl }}
                          style={styles.soldierAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.soldierAvatarPlaceholder}>
                          <Text style={{ fontSize: 22 }}>{soldier.emoji}</Text>
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        <View style={styles.soldierNameRow}>
                          <Text style={styles.soldierName}>{soldier.shadowTitle}</Text>
                          <View style={styles.gradeBadge}>
                            <Text style={styles.gradeBadgeText}>{soldier.grade.toUpperCase()}</Text>
                          </View>
                        </View>
                        <Text style={styles.soldierOriginalName}>Origen: {soldier.name}</Text>
                        <Text style={styles.soldierBuffText}>✨ {soldier.buffDescription}</Text>
                      </View>
                    </View>

                    <View style={styles.soldierFooter}>
                      <Text style={styles.extractedDateText}>
                        Extraído: {new Date(soldier.extractedAt).toLocaleDateString('es-ES')}
                      </Text>
                      <TouchableOpacity
                        style={[styles.equipBtn, isEquipped && styles.equipBtnActive]}
                        onPress={() => {
                          if (isEquipped) {
                            unequipShadow(uid);
                          } else {
                            equipShadow(soldier.bossId, uid);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isEquipped ? 'checkmark-circle' : 'flash-outline'}
                          size={13}
                          color={isEquipped ? '#10B981' : '#0A0A0F'}
                        />
                        <Text style={[styles.equipBtnText, isEquipped && styles.equipBtnTextActive]}>
                          {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 17, 0.94)',
    justifyContent: 'flex-end',
  },
  card: {
    height: '85%',
    backgroundColor: '#0A0D18',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1.5,
    borderColor: '#C084FC',
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerSub: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  equippedCard: {
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.35)',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: Spacing.md,
  },
  equippedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  equippedBadgeText: {
    color: '#C084FC',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  equippedBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  equippedEmoji: {
    fontSize: 26,
  },
  equippedName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  equippedBuff: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  unequipBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  unequipBtnText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  noEquippedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  noEquippedText: {
    color: '#94A3B8',
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  listContent: {
    gap: 10,
    paddingBottom: 40,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  soldierCard: {
    backgroundColor: '#0F121E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.md,
    padding: 12,
  },
  soldierCardEquipped: {
    borderColor: '#C084FC',
    backgroundColor: 'rgba(192, 132, 252, 0.06)',
  },
  soldierTop: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  soldierAvatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#070A14',
  },
  soldierAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soldierName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  gradeBadge: {
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeBadgeText: {
    color: '#C084FC',
    fontSize: 8.5,
    fontWeight: '900',
  },
  soldierOriginalName: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 1,
  },
  soldierBuffText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  soldierFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  extractedDateText: {
    color: '#64748B',
    fontSize: 9.5,
  },
  equipBtn: {
    backgroundColor: '#00F0FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  equipBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  equipBtnText: {
    color: '#0A0A0F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  equipBtnTextActive: {
    color: '#10B981',
  },
});
