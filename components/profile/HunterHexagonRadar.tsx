import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { UserStats } from '../../stores/userStore';

interface HexagonRadarProps {
  stats: UserStats;
  hunterLevel: number;
  combatPower: number;
}

export function HunterHexagonRadar({ stats, hunterLevel, combatPower }: HexagonRadarProps) {
  // Atributos de Solo Leveling: Fuerza, Agilidad, Vitalidad, Mente/Disciplina, Percepción, Resistencia
  const attributes = [
    { label: 'FUERZA', val: stats.strength || 10, max: 100, color: '#EF4444', icon: 'barbell' },
    { label: 'AGILIDAD', val: stats.agility || 10, max: 100, color: '#10B981', icon: 'flash' },
    { label: 'VITALIDAD', val: stats.vitality || 10, max: 100, color: '#00F0FF', icon: 'heart' },
    { label: 'DISCIPLINA', val: stats.discipline || 10, max: 100, color: '#A855F7', icon: 'shield' },
    { label: 'PERCEPCIÓN', val: Math.round(((stats.agility + stats.vitality) / 2) + hunterLevel), max: 100, color: '#F59E0B', icon: 'eye' },
    { label: 'PODER SOMBRÍO', val: Math.round(((stats.strength + stats.discipline) / 2) + hunterLevel * 2), max: 100, color: '#EC4899', icon: 'skull' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Ionicons name="hardware-chip-outline" size={14} color="#00F0FF" />
          <Text style={styles.badgeText}>TELEMETRÍA HEXAGONAL DEL CAZADOR</Text>
        </View>
        <Text style={styles.combatPowerText}>Poder: {combatPower.toLocaleString()}</Text>
      </View>

      {/* Grid Hexagonal de Atributos */}
      <View style={styles.grid}>
        {attributes.map((attr, idx) => {
          const percent = Math.min(100, Math.round((attr.val / attr.max) * 100));

          return (
            <View key={attr.label} style={[styles.hexItem, { borderColor: attr.color + '44' }]}>
              <View style={styles.hexItemHeader}>
                <Ionicons name={attr.icon as any} size={12} color={attr.color} />
                <Text style={[styles.hexLabel, { color: attr.color }]}>{attr.label}</Text>
                <Text style={styles.hexValue}>{attr.val}</Text>
              </View>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${percent}%`,
                      backgroundColor: attr.color,
                      shadowColor: attr.color,
                      shadowOpacity: 0.6,
                      shadowRadius: 6,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.classPill}>
          <Text style={styles.classPillText}>CLASE: CAZADOR DE ÉLITE MULTIDISCIPLINAR</Text>
        </View>
        <Text style={styles.footerNote}>Nivel {hunterLevel} • Rango Activo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F121E',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  combatPowerText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  hexItem: {
    width: '48.5%',
    backgroundColor: '#070A14',
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 8,
  },
  hexItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hexLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    marginLeft: 4,
  },
  hexValue: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '900',
  },
  barTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  classPill: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  classPillText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  footerNote: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
});
