import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { usePlanStore } from '../../stores/planStore';
import { sendTestNotification, CORTEXNotifications } from '../../services/notifications';

interface PlanAlarmModalProps {
  visible: boolean;
  onClose: () => void;
}

const WEEKDAYS = [
  { id: 1, label: 'L' },
  { id: 2, label: 'M' },
  { id: 3, label: 'X' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 0, label: 'D' },
];

const QUICK_HOURS = [
  { hour: 6, minute: 0, label: '06:00 AM' },
  { hour: 7, minute: 0, label: '07:00 AM' },
  { hour: 8, minute: 30, label: '08:30 AM' },
  { hour: 18, minute: 0, label: '06:00 PM' },
  { hour: 19, minute: 30, label: '07:30 PM' },
  { hour: 21, minute: 0, label: '09:00 PM' },
];

export function PlanAlarmModal({ visible, onClose }: PlanAlarmModalProps) {
  const { alarmSettings, updateAlarmSettings, getActivePlan } = usePlanStore();
  const activePlan = getActivePlan();

  const [enabled, setEnabled] = useState(alarmSettings.enabled);
  const [hour, setHour] = useState(alarmSettings.hour);
  const [minute, setMinute] = useState(alarmSettings.minute);
  const [selectedDays, setSelectedDays] = useState<number[]>(alarmSettings.days);
  const [hydration, setHydration] = useState(alarmSettings.hydrationReminder);
  const [quests, setQuests] = useState(alarmSettings.questsReminder);
  const [testing, setTesting] = useState(false);

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) return; // Keep at least one day
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      const granted = await CORTEXNotifications.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permiso de Notificación Denegado',
          'Debes permitir las notificaciones de la app en los ajustes de tu sistema para que la alarma y los avisos puedan sonar.'
        );
        return;
      }
      await sendTestNotification(
        '⚔️ ALERTA ACÚSTICA CORTEX',
        `Prueba de sonido completada. Tu alarma de las ${formatTime(hour, minute)} sonará puntualmente con este canal prioritario.`
      );
      Alert.alert('¡Alerta de Prueba Enviada!', 'El canal de audio y vibración ha sido disparado. Revisa la barra superior de tu dispositivo.');
    } catch {
      Alert.alert('Permiso Requerido', 'Asegúrate de permitir las notificaciones y alarmas exactas en los ajustes de tu teléfono.');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (enabled || hydration || quests) {
      const granted = await CORTEXNotifications.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permiso Requerido para Alarmas',
          'Para que la alarma de las ' + formatTime(hour, minute) + ' suene en tu dispositivo, debes autorizar las notificaciones de la app.',
          [
            {
              text: 'Guardar de todos modos',
              onPress: async () => {
                await doSaveSettings();
              },
            },
            {
              text: 'Dar Permisos',
              onPress: async () => {
                await CORTEXNotifications.requestPermissions();
                await doSaveSettings();
              },
            },
          ]
        );
        return;
      }
    }
    await doSaveSettings();
  };

  const doSaveSettings = async () => {
    await updateAlarmSettings({
      enabled,
      hour,
      minute,
      days: selectedDays,
      hydrationReminder: hydration,
      questsReminder: quests,
    });
    Alert.alert(
      'Alarma Sincronizada',
      enabled
        ? `Directiva de combate programada para las ${formatTime(hour, minute)} con alerta acústica CORTEX.`
        : 'Alarmas desactivadas correctamente.'
    );
    onClose();
  };

  const formatTime = (h: number, m: number) => {
    const padH = h.toString().padStart(2, '0');
    const padM = m.toString().padStart(2, '0');
    return `${padH}:${padM}`;
  };

  const adjustHour = (delta: number) => {
    setHour((prev) => (prev + delta + 24) % 24);
  };

  const adjustMinute = (delta: number) => {
    setMinute((prev) => (prev + delta + 60) % 60);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>⏰ Alarmas & Telemetría</Text>
              <Text style={styles.subtitle}>Plan activo: {activePlan?.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Main Workout Alarm Toggle */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Alarma de Entrenamiento</Text>
                <Text style={styles.sectionDesc}>CORTEX te alertará con alta prioridad a la hora indicada</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: Colors.bg.elevated, true: '#06B6D4' }}
                thumbColor={enabled ? '#FFFFFF' : Colors.text.muted}
              />
            </View>

            {enabled && (
              <>
                {/* Time Picker */}
                <View style={styles.timeContainer}>
                  <View style={styles.timeBox}>
                    <TouchableOpacity onPress={() => adjustHour(1)} style={styles.arrowBtn}>
                      <Text style={styles.arrowText}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeDigit}>{hour.toString().padStart(2, '0')}</Text>
                    <TouchableOpacity onPress={() => adjustHour(-1)} style={styles.arrowBtn}>
                      <Text style={styles.arrowText}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.colon}>:</Text>

                  <View style={styles.timeBox}>
                    <TouchableOpacity onPress={() => adjustMinute(5)} style={styles.arrowBtn}>
                      <Text style={styles.arrowText}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeDigit}>{minute.toString().padStart(2, '0')}</Text>
                    <TouchableOpacity onPress={() => adjustMinute(-5)} style={styles.arrowBtn}>
                      <Text style={styles.arrowText}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Hours */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickHoursRow}>
                  {QUICK_HOURS.map((q) => (
                    <TouchableOpacity
                      key={q.label}
                      style={[
                        styles.quickHourBtn,
                        hour === q.hour && minute === q.minute && styles.quickHourBtnActive,
                      ]}
                      onPress={() => {
                        setHour(q.hour);
                        setMinute(q.minute);
                      }}
                    >
                      <Text
                        style={[
                          styles.quickHourText,
                          hour === q.hour && minute === q.minute && styles.quickHourTextActive,
                        ]}
                      >
                        {q.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Days of Week */}
                <Text style={styles.subLabel}>Días Activos de Alarma</Text>
                <View style={styles.daysRow}>
                  {WEEKDAYS.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.dayChip, selectedDays.includes(d.id) && styles.dayChipActive]}
                      onPress={() => toggleDay(d.id)}
                    >
                      <Text style={[styles.dayText, selectedDays.includes(d.id) && styles.dayTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Extra Reminders Section */}
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Recordatorios Tácticos de CORTEX</Text>

            {/* Hydration */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>💧 Poción de Vitalidad (Agua)</Text>
                <Text style={styles.sectionDesc}>3 recordatorios diarios (10:00, 14:00, 17:00)</Text>
              </View>
              <Switch
                value={hydration}
                onValueChange={setHydration}
                trackColor={{ false: Colors.bg.elevated, true: '#38BDF8' }}
                thumbColor={hydration ? '#FFFFFF' : Colors.text.muted}
              />
            </View>

            {/* Quests */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>🎯 Misiones Incompletas (8:00 PM)</Text>
                <Text style={styles.sectionDesc}>Alerta preventiva nocturna para no perder tu racha</Text>
              </View>
              <Switch
                value={quests}
                onValueChange={setQuests}
                trackColor={{ false: Colors.bg.elevated, true: '#F59E0B' }}
                thumbColor={quests ? '#FFFFFF' : Colors.text.muted}
              />
            </View>

            {/* Test Notification Button */}
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestNotification}
              disabled={testing}
            >
              <Text style={styles.testBtnText}>
                {testing ? 'Transmitiendo...' : '🔔 Probar Notificación Ahora (2 seg)'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Guardar Alarma ⚡</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.bg.secondary,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.base,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#38BDF8',
    fontSize: Fonts.sizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  content: {
    gap: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sectionLabel: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  itemTitle: {
    color: Colors.text.primary,
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
  sectionDesc: {
    color: Colors.text.muted,
    fontSize: Fonts.sizes.xs,
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  timeBox: {
    alignItems: 'center',
    width: 60,
  },
  arrowBtn: {
    padding: 6,
  },
  arrowText: {
    color: '#06B6D4',
    fontSize: 14,
  },
  timeDigit: {
    color: Colors.text.primary,
    fontSize: 36,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  colon: {
    color: '#06B6D4',
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: 10,
    marginBottom: 6,
  },
  quickHoursRow: {
    flexDirection: 'row',
  },
  quickHourBtn: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickHourBtnActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: '#06B6D4',
  },
  quickHourText: {
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
  },
  quickHourTextActive: {
    color: '#38BDF8',
    fontWeight: 'bold',
  },
  subLabel: {
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayChipActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.secondary,
  },
  dayText: {
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
  dayTextActive: {
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  testBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    marginTop: Spacing.xs,
  },
  testBtnText: {
    color: '#38BDF8',
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#06B6D4',
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  saveText: {
    color: '#0A0A0F',
    fontWeight: 'bold',
    fontSize: Fonts.sizes.base,
  },
});
