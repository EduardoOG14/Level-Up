import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore, createUserProfile } from '../../stores/userStore';
import { PRESET_AVATARS, renderAvatarContent } from '../../components/ui/Avatar';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { SafeScreen } from '../../components/ui/SafeScreen';

const GOALS = [
  { id: 'lose_weight', label: 'Perder peso', emoji: '⚖️' },
  { id: 'build_muscle', label: 'Ganar músculo', emoji: '💪' },
  { id: 'improve_endurance', label: 'Mejorar resistencia', emoji: '🏃' },
  { id: 'stay_active', label: 'Mantenerme activo', emoji: '⚡' },
  { id: 'flexibility', label: 'Mejorar flexibilidad', emoji: '🧘' },
  { id: 'mental_health', label: 'Salud mental', emoji: '🧠' },
];

const FITNESS_LEVELS = [
  { id: 'beginner', label: 'Principiante', desc: 'Menos de 3 meses de experiencia', emoji: '🌱' },
  { id: 'intermediate', label: 'Intermedio', desc: '3 meses a 2 años entrenando', emoji: '🌿' },
  { id: 'advanced', label: 'Avanzado', desc: 'Más de 2 años de experiencia', emoji: '🌳' },
];

const EQUIPMENT_OPTIONS = [
  { id: 'none', label: 'Sin equipo (Corporal)', emoji: '🏠' },
  { id: 'dumbbells', label: 'Mancuernas', emoji: '🏋️' },
  { id: 'resistance_band', label: 'Bandas elásticas', emoji: '🔗' },
  { id: 'gym', label: 'Gimnasio completo', emoji: '🏟️' },
  { id: 'barbell', label: 'Barra y discos', emoji: '🏋️‍♂️' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateProfile } = useUserStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState<string>(user?.avatar || '');
  const [goals, setGoals] = useState<string[]>(user?.goals || []);
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [kneeFriendly, setKneeFriendly] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleGoal = (id: string) => {
    setGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const toggleEquipment = (id: string) => {
    setEquipment((prev) => {
      if (id === 'none') {
        return prev.includes('none') ? [] : ['none'];
      }
      const withoutNone = prev.filter((e) => e !== 'none');
      return withoutNone.includes(id)
        ? withoutNone.filter((e) => e !== id)
        : [...withoutNone, id];
    });
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Requerimos acceso a tus fotos para elegir tu foto de perfil.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const formattedUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setAvatar(formattedUri);
      }
    } catch (err) {
      console.warn('Error seleccionando imagen:', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Requerimos acceso a la cámara para tomar tu foto de perfil.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const formattedUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setAvatar(formattedUri);
      }
    } catch (err) {
      console.warn('Error capturando foto:', err);
    }
  };

  const handleChoosePhotoOptions = () => {
    Alert.alert(
      'Foto de Perfil (Opcional)',
      'Elige una opción para tu avatar de Cazador:',
      [
        { text: '📷 Tomar Foto', onPress: handleTakePhoto },
        { text: '🖼️ Elegir de Galería', onPress: handlePickFromGallery },
        ...(avatar
          ? [
              {
                text: '❌ Quitar Foto',
                style: 'destructive' as const,
                onPress: () => setAvatar(''),
              },
            ]
          : []),
        { text: 'Cancelar', style: 'cancel' as const },
      ]
    );
  };

  const handleNext = () => {
    if (step === 0) {
      if (!name.trim()) {
        Alert.alert('Nombre Requerido ⚡', 'Por favor ingresa un nombre para registrar a tu Cazador en el Sistema.');
        return;
      }
    } else if (step === 1) {
      if (goals.length === 0) {
        Alert.alert('Objetivo Requerido', 'Selecciona al menos un objetivo para calibrar tus misiones.');
        return;
      }
    } else if (step === 3) {
      if (equipment.length === 0) {
        Alert.alert('Equipamiento Requerido', 'Selecciona tu equipamiento (puedes elegir "Sin equipo (Corporal)").');
        return;
      }
    }

    if (step < 4) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const profileData: any = {
        name: name.trim() || 'Cazador',
        avatar: avatar || undefined,
        goals,
        fitnessLevel,
        equipment,
        updatedAt: new Date().toISOString(),
      };
      if (age) profileData.age = parseInt(age, 10);
      if (weight) profileData.weight = parseFloat(weight);
      if (height) profileData.height = parseFloat(height);

      const parsedW = profileData.weight || 70;
      const parsedH = (profileData.height || 175) / 100;
      const computedBmi = parsedH > 0 ? parsedW / (parsedH * parsedH) : 22.8;

      profileData.kneeFriendly =
        kneeFriendly || computedBmi >= 27.5 || parsedW >= 90;

      if (user) {
        await updateProfile(profileData);
      } else {
        await createUserProfile(undefined, profileData);
      }
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'No se pudo guardar tu perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreen style={styles.container}>
      <View style={styles.progressBar}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* PASO 0: NOMBRE DE USUARIO Y FOTO DE PERFIL */}
        {step === 0 && (
          <View style={styles.stepBox}>
            <View style={styles.heroBadgeBox}>
              <TouchableOpacity
                style={styles.avatarTouchable}
                onPress={handleChoosePhotoOptions}
                activeOpacity={0.8}
              >
                <View style={styles.avatarGlowWrapper}>
                  {renderAvatarContent(avatar, name, 88)}
                </View>
                <View style={styles.avatarCameraBadge}>
                  <Ionicons name="camera" size={15} color="#0A0A0F" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChoosePhotoOptions}
                style={styles.changePhotoBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={14} color="#00F0FF" />
                <Text style={styles.changePhotoBtnText}>
                  {avatar ? 'Cambiar foto de perfil' : 'Agregar foto de perfil (Opcional)'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selector Rápido de Avatares Tácticos */}
            <View style={styles.presetsContainer}>
              <Text style={styles.presetsLabel}>O elige un avatar táctico CORTEX:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsRow}
              >
                {PRESET_AVATARS.map((p) => {
                  const isSelected = avatar === `preset:${p.id}`;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.presetPill,
                        { borderColor: isSelected ? p.color : 'rgba(255, 255, 255, 0.1)' },
                        isSelected && { backgroundColor: p.color + '25' },
                      ]}
                      onPress={() => setAvatar(`preset:${p.id}`)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetEmoji}>{p.emoji}</Text>
                      <Text
                        style={[
                          styles.presetText,
                          isSelected && { color: p.color, fontWeight: 'bold' },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <Text style={styles.stepTitle}>¿Cómo te llamarás? ⚡</Text>
            <Text style={styles.stepSubtitle}>
              El Sistema CORTEX registrará tus misiones, estadísticas y ascensos de rango bajo este nombre.
            </Text>

            <View style={styles.nameInputContainer}>
              <Text style={styles.inputLabel}>NOMBRE DE CAZADOR / USUARIO *</Text>
              <TextInput
                style={styles.nameTextInput}
                placeholder="Ej. Sung Jin-Woo, Shadow, Carlos..."
                placeholderTextColor={Colors.text.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                maxLength={25}
                returnKeyType="done"
              />
              <Text style={styles.nameHint}>
                ✓ Modo 100% Offline. Podrás cambiar tu nombre y foto en cualquier momento desde tu Perfil.
              </Text>
            </View>
          </View>
        )}

        {/* PASO 1: OBJETIVOS */}
        {step === 1 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>¿Cuál es tu objetivo? 🎯</Text>
            <Text style={styles.stepSubtitle}>
              Selecciona uno o varios para calibrar tus directivas diarias y circuitos
            </Text>
            <View style={styles.grid}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.optionCard, goals.includes(g.id) && styles.optionSelected]}
                  onPress={() => toggleGoal(g.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.optionEmoji}>{g.emoji}</Text>
                  <Text style={[styles.optionLabel, goals.includes(g.id) && styles.optionLabelSelected]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* PASO 2: NIVEL ACTUAL */}
        {step === 2 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>¿Cuál es tu nivel actual? 💪</Text>
            <Text style={styles.stepSubtitle}>CORTEX adaptará la intensidad para evitar sobrecarga</Text>
            {FITNESS_LEVELS.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={[styles.levelCard, fitnessLevel === l.id && styles.optionSelected]}
                onPress={() => setFitnessLevel(l.id as any)}
                activeOpacity={0.75}
              >
                <Text style={styles.levelEmoji}>{l.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.levelLabel, fitnessLevel === l.id && styles.optionLabelSelected]}>
                    {l.label}
                  </Text>
                  <Text style={styles.levelDesc}>{l.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* PASO 3: EQUIPAMIENTO */}
        {step === 3 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>¿Con qué equipo cuentas? 🏋️</Text>
            <Text style={styles.stepSubtitle}>Elige lo que tienes disponible a tu alcance</Text>
            <View style={styles.grid}>
              {EQUIPMENT_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.optionCard, equipment.includes(e.id) && styles.optionSelected]}
                  onPress={() => toggleEquipment(e.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.optionEmoji}>{e.emoji}</Text>
                  <Text style={[styles.optionLabel, equipment.includes(e.id) && styles.optionLabelSelected]}>
                    {e.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* PASO 4: PARÁMETROS DEL AVATAR */}
        {step === 4 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>Parámetros de tu Avatar 📊</Text>
            <Text style={styles.stepSubtitle}>Opcionales — ayudan a CORTEX a calibrar hidratación y calorías</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Edad (años)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 24"
                placeholderTextColor={Colors.text.muted}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Peso actual (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 72.5"
                placeholderTextColor={Colors.text.muted}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 175"
                placeholderTextColor={Colors.text.muted}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>

            {/* Protección Articular (Rodillas Seguras / Bajo Impacto) */}
            <TouchableOpacity
              style={[
                styles.jointToggleCard,
                kneeFriendly && styles.jointToggleCardActive,
              ]}
              onPress={() => setKneeFriendly(!kneeFriendly)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={kneeFriendly ? 'shield-checkmark' : 'shield-outline'}
                size={22}
                color={kneeFriendly ? '#10B981' : Colors.text.muted}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.jointToggleTitle, kneeFriendly && { color: '#10B981' }]}>
                  Protección Articular (Rodillas Seguras) 🛡️
                </Text>
                <Text style={styles.jointToggleSub}>
                  Recomendado para sobrepeso o molestias. CORTEX elimina saltos e impactos bruscos de tus rutinas.
                </Text>
              </View>
              <Ionicons
                name={kneeFriendly ? 'checkbox' : 'square-outline'}
                size={20}
                color={kneeFriendly ? '#10B981' : Colors.text.muted}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.nav}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.backText}>← Atrás</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, loading && { opacity: 0.7 }]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextText}>
            {step < 4 ? 'Siguiente →' : loading ? 'Registrando...' : '¡Despertar Cazador! ⚡'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: Spacing.lg,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.bg.elevated,
  },
  progressDotActive: { backgroundColor: Colors.brand.primary, width: 28 },
  content: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  stepBox: { gap: 4 },
  heroBadgeBox: {
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  avatarTouchable: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlowWrapper: {
    borderRadius: 50,
    padding: 3,
    borderWidth: 2,
    borderColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00F0FF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0F',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    marginTop: 4,
  },
  changePhotoBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
  },
  presetsContainer: {
    marginVertical: 12,
    gap: 8,
  },
  presetsLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F121E',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  presetEmoji: {
    fontSize: 16,
  },
  presetText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  stepTitle: {
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    color: Colors.text.secondary,
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: Spacing.xl,
  },
  nameInputContainer: {
    backgroundColor: '#0F121E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    gap: 10,
    marginTop: 4,
  },
  nameTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  nameHint: {
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionCard: {
    width: '47%',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary + '22',
  },
  optionEmoji: { fontSize: 28 },
  optionLabel: {
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  optionLabelSelected: { color: Colors.text.primary },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  levelEmoji: { fontSize: 32 },
  levelLabel: {
    color: Colors.text.secondary,
    fontSize: Fonts.sizes.base,
    fontWeight: 'bold',
  },
  levelDesc: {
    color: Colors.text.muted,
    fontSize: Fonts.sizes.xs,
    marginTop: 2,
  },
  inputGroup: { marginBottom: Spacing.base },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: Spacing.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    color: Colors.text.primary,
    fontSize: Fonts.sizes.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jointToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: Spacing.xs,
  },
  jointToggleCardActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  jointToggleTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  jointToggleSub: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  nav: {
    flexDirection: 'row',
    padding: Spacing.base,
    paddingBottom: 28,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg.secondary,
  },
  backBtn: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  backText: { color: Colors.text.secondary, fontWeight: '600' },
  nextBtn: {
    flex: 2,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  nextText: { color: Colors.text.primary, fontWeight: 'bold', fontSize: Fonts.sizes.base },
});
