import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { useLogbookStore } from '../../stores/logbookStore';

interface ExerciseLogbookCardProps {
  exerciseId: string;
  exerciseName: string;
  currentSet: number;
  totalSets: number;
  uid: string;
  targetRepsLabel?: string;
}

export function ExerciseLogbookCard({
  exerciseId,
  exerciseName,
  currentSet,
  totalSets,
  uid,
  targetRepsLabel,
}: ExerciseLogbookCardProps) {
  const { getLastSession, saveSetLog, initialize } = useLogbookStore();

  const [weight, setWeight] = useState<string>('0');
  const [reps, setReps] = useState<string>('10');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (uid) {
      initialize(uid);
      const last = getLastSession(exerciseId);
      if (last) {
        if (last.weightKg > 0) setWeight(last.weightKg.toString());
        if (last.reps > 0) setReps(last.reps.toString());
      }
    }
  }, [exerciseId, uid]);

  const lastSession = getLastSession(exerciseId);

  const handleSaveSet = async () => {
    const numWeight = parseFloat(weight) || 0;
    const numReps = parseInt(reps, 10) || 0;
    await saveSetLog(exerciseId, currentSet, numWeight, numReps, uid);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const adjustWeight = (delta: number) => {
    const cur = parseFloat(weight) || 0;
    const next = Math.max(0, cur + delta);
    setWeight(next.toString());
  };

  const adjustReps = (delta: number) => {
    const cur = parseInt(reps, 10) || 0;
    const next = Math.max(1, cur + delta);
    setReps(next.toString());
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBadge}>
          <Ionicons name="barbell-outline" size={13} color="#00F0FF" />
          <Text style={styles.titleBadgeText}>LOGBOOK TÁCTICO • SERIE {currentSet}/{totalSets}</Text>
        </View>

        {lastSession && (lastSession.weightKg > 0 || lastSession.reps > 0) ? (
          <View style={styles.lastSessionPill}>
            <Text style={styles.lastSessionText}>
              Última vez: {lastSession.weightKg > 0 ? `${lastSession.weightKg} kg × ` : ''}{lastSession.reps} reps
            </Text>
          </View>
        ) : (
          <Text style={styles.noLastSessionText}>Sin registro previo</Text>
        )}
      </View>

      <View style={styles.inputsRow}>
        {/* Input Carga / Peso */}
        <View style={styles.inputCol}>
          <Text style={styles.inputLabel}>CARGA (KG)</Text>
          <View style={styles.stepperBox}>
            <TouchableOpacity onPress={() => adjustWeight(-2.5)} style={styles.stepBtn}>
              <Text style={styles.stepBtnText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
              selectTextOnFocus
            />
            <TouchableOpacity onPress={() => adjustWeight(2.5)} style={styles.stepBtn}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Repeticiones Reales */}
        <View style={styles.inputCol}>
          <Text style={styles.inputLabel}>REPS REALES</Text>
          <View style={styles.stepperBox}>
            <TouchableOpacity onPress={() => adjustReps(-1)} style={styles.stepBtn}>
              <Text style={styles.stepBtnText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={reps}
              onChangeText={setReps}
              selectTextOnFocus
            />
            <TouchableOpacity onPress={() => adjustReps(1)} style={styles.stepBtn}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón Guardar Serie */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaved && styles.saveBtnSuccess]}
          onPress={handleSaveSet}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isSaved ? 'checkmark-circle' : 'save-outline'}
            size={16}
            color={isSaved ? '#10B981' : '#0A0A0F'}
          />
          <Text style={[styles.saveBtnText, isSaved && styles.saveBtnTextSuccess]}>
            {isSaved ? 'OK' : 'ANOTAR'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F121E',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleBadgeText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lastSessionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  lastSessionText: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '600',
  },
  noLastSessionText: {
    color: '#64748B',
    fontSize: 9,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070A14',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Radius.sm,
    height: 36,
  },
  stepBtn: {
    width: 28,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  stepBtnText: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '800',
  },
  textInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
  },
  saveBtn: {
    backgroundColor: '#00F0FF',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  saveBtnSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  saveBtnText: {
    color: '#0A0A0F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  saveBtnTextSuccess: {
    color: '#10B981',
  },
});
