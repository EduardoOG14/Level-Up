import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { Haptics } from '../../services/haptics';

interface MacroCalculatorCardProps {
  weight?: number;
  height?: number;
  age?: number;
  userGoal?: string;
}

type FitnessGoal = 'lose_fat' | 'recomp' | 'build_muscle';

export function MacroCalculatorCard({
  weight = 70,
  height = 175,
  age = 25,
  userGoal,
}: MacroCalculatorCardProps) {
  // Inferir objetivo inicial
  const initialGoal: FitnessGoal =
    userGoal?.includes('lose') || userGoal?.includes('fat') || userGoal?.includes('peso')
      ? 'lose_fat'
      : userGoal?.includes('muscle') || userGoal?.includes('fuerza') || userGoal?.includes('masa')
      ? 'build_muscle'
      : 'recomp';

  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>(initialGoal);

  // Fórmula Mifflin-St Jeor para TMB
  const safeWeight = Math.max(weight || 70, 40);
  const safeHeight = Math.max(height || 175, 120);
  const safeAge = Math.max(age || 25, 14);

  const bmr = Math.round(10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5);
  const tdee = Math.round(bmr * 1.4); // Multiplicador de actividad física moderada-alta

  // Ajuste según el objetivo táctico
  let targetCalories = tdee;
  if (selectedGoal === 'lose_fat') {
    targetCalories = Math.round(tdee * 0.82); // Déficit del 18%
  } else if (selectedGoal === 'build_muscle') {
    targetCalories = Math.round(tdee * 1.12); // Superávit del 12%
  }

  // Distribución de macronutrientes:
  // Proteína: 2.1g por kg (fundamental para el cazador)
  const proteinGrams = Math.round(safeWeight * 2.1);
  const proteinCalories = proteinGrams * 4;

  // Grasas saludables: 0.9g por kg
  const fatGrams = Math.round(safeWeight * 0.9);
  const fatCalories = fatGrams * 9;

  // Carbohidratos: El resto de las calorías
  const remainingCalories = Math.max(targetCalories - (proteinCalories + fatCalories), 400);
  const carbGrams = Math.round(remainingCalories / 4);
  const carbCalories = carbGrams * 4;

  const totalCalculated = proteinCalories + fatCalories + carbCalories;
  const proteinPct = Math.round((proteinCalories / totalCalculated) * 100);
  const fatPct = Math.round((fatCalories / totalCalculated) * 100);
  const carbPct = Math.round((carbCalories / totalCalculated) * 100);

  const handleSelectGoal = (goal: FitnessGoal) => {
    Haptics.light();
    setSelectedGoal(goal);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleBadge}>
          <Ionicons name="nutrition-outline" size={14} color="#00F0FF" />
          <Text style={styles.titleBadgeText}>TELEMETRÍA NUTRICIONAL CORTEX</Text>
        </View>
        <Text style={styles.bmrSub}>TMB: {bmr} kcal</Text>
      </View>

      <Text style={styles.cardTitle}>Calculadora Táctica de Macros</Text>
      <Text style={styles.cardDesc}>
        Calibración biométrica basada en tu peso ({safeWeight} kg) y estatura ({safeHeight} cm).
      </Text>

      {/* Selector de Objetivos */}
      <View style={styles.goalsSelectorRow}>
        <TouchableOpacity
          style={[styles.goalBtn, selectedGoal === 'lose_fat' && styles.goalBtnActive]}
          onPress={() => handleSelectGoal('lose_fat')}
          activeOpacity={0.8}
        >
          <Text style={[styles.goalBtnText, selectedGoal === 'lose_fat' && styles.goalBtnTextActive]}>
            🔻 Pérdida Grasa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.goalBtn, selectedGoal === 'recomp' && styles.goalBtnActive]}
          onPress={() => handleSelectGoal('recomp')}
          activeOpacity={0.8}
        >
          <Text style={[styles.goalBtnText, selectedGoal === 'recomp' && styles.goalBtnTextActive]}>
            ⚖️ Recomposición
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.goalBtn, selectedGoal === 'build_muscle' && styles.goalBtnActive]}
          onPress={() => handleSelectGoal('build_muscle')}
          activeOpacity={0.8}
        >
          <Text style={[styles.goalBtnText, selectedGoal === 'build_muscle' && styles.goalBtnTextActive]}>
            🔺 Masa Muscular
          </Text>
        </TouchableOpacity>
      </View>

      {/* Indicador de Calorías Diarias */}
      <View style={styles.caloriesBanner}>
        <View>
          <Text style={styles.caloriesLabel}>OBJETIVO DIARIO</Text>
          <Text style={styles.caloriesValue}>{targetCalories.toLocaleString()} kcal</Text>
        </View>
        <View style={styles.deficitPill}>
          <Text style={styles.deficitPillText}>
            {selectedGoal === 'lose_fat'
              ? '-18% Déficit'
              : selectedGoal === 'build_muscle'
              ? '+12% Superávit'
              : 'Mantenimiento'}
          </Text>
        </View>
      </View>

      {/* Barra de Distribución Visual */}
      <View style={styles.macroDistributionTrack}>
        <View style={[styles.macroSegment, { width: `${proteinPct}%`, backgroundColor: '#EF4444' }]} />
        <View style={[styles.macroSegment, { width: `${carbPct}%`, backgroundColor: '#00F0FF' }]} />
        <View style={[styles.macroSegment, { width: `${fatPct}%`, backgroundColor: '#F59E0B' }]} />
      </View>

      {/* Tarjetas de Macros Individuales */}
      <View style={styles.macrosGrid}>
        {/* Proteína */}
        <View style={styles.macroBox}>
          <View style={styles.macroBoxTop}>
            <View style={[styles.macroDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.macroBoxTitle}>Proteína</Text>
          </View>
          <Text style={[styles.macroBoxGrams, { color: '#EF4444' }]}>{proteinGrams}g</Text>
          <Text style={styles.macroBoxSub}>
            2.1g/kg • {proteinPct}% ({proteinCalories} kcal)
          </Text>
        </View>

        {/* Carbohidratos */}
        <View style={styles.macroBox}>
          <View style={styles.macroBoxTop}>
            <View style={[styles.macroDot, { backgroundColor: '#00F0FF' }]} />
            <Text style={styles.macroBoxTitle}>Carbos</Text>
          </View>
          <Text style={[styles.macroBoxGrams, { color: '#00F0FF' }]}>{carbGrams}g</Text>
          <Text style={styles.macroBoxSub}>
            Energía • {carbPct}% ({carbCalories} kcal)
          </Text>
        </View>

        {/* Grasas */}
        <View style={styles.macroBox}>
          <View style={styles.macroBoxTop}>
            <View style={[styles.macroDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.macroBoxTitle}>Grasas</Text>
          </View>
          <Text style={[styles.macroBoxGrams, { color: '#F59E0B' }]}>{fatGrams}g</Text>
          <Text style={styles.macroBoxSub}>
            Hormonal • {fatPct}% ({fatCalories} kcal)
          </Text>
        </View>
      </View>

      {/* Directiva Biológica de CORTEX */}
      <View style={styles.directiveBox}>
        <Ionicons name="hardware-chip-outline" size={16} color="#00F0FF" />
        <Text style={styles.directiveText}>
          <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Directiva Biológica: </Text>
          Prioriza alcanzar tus {proteinGrams}g de proteína al día mediante pollo, huevos, pescado o legumbres. La síntesis muscular exige proteína continua tras los circuitos.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F121E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  titleBadgeText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  bmrSub: {
    color: Colors.text.muted,
    fontSize: 11,
  },
  cardTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  cardDesc: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  goalsSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  goalBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#161824',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  goalBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: '#00F0FF',
  },
  goalBtnText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  goalBtnTextActive: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  caloriesBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#131520',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: Spacing.md,
  },
  caloriesLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  caloriesValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  deficitPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  deficitPillText: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  macroDistributionTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  macroSegment: {
    height: '100%',
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  macroBox: {
    flex: 1,
    backgroundColor: '#131520',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  macroBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroBoxTitle: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  macroBoxGrams: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroBoxSub: {
    color: Colors.text.muted,
    fontSize: 9,
    marginTop: 2,
  },
  directiveBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.15)',
  },
  directiveText: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
  },
});
