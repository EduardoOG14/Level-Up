import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  useUserStore,
  type UserProfile,
  DEFAULT_STATS,
  getUserBMI,
  getBMICategory,
  isUserKneeSensitive,
} from '../../stores/userStore';
import { useProgressStore } from '../../stores/progressStore';
import { usePlanStore } from '../../stores/planStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { Card } from '../../components/ui/Card';
import { RankBadge } from '../../components/ui/RankBadge';
import { getRankByXP, getXPForNextLevel } from '../../constants/ranks';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { PlanAlarmModal } from '../../components/plans/PlanAlarmModal';
import { HunterCardModal } from '../../components/profile/HunterCardModal';
import { AchievementsModal } from '../../components/achievements/AchievementsModal';
import { useAchievementStore } from '../../stores/achievementStore';
import { useTitleStore } from '../../stores/titleStore';
import { SoundEffects } from '../../services/soundEffects';
import { CORTEXNotifications } from '../../services/notifications';
import { Haptics } from '../../services/haptics';
import { useSmartwatchStore } from '../../stores/smartwatchStore';
import { SmartwatchSyncModal } from '../../components/smartwatch/SmartwatchSyncModal';
import { SMARTWATCH_BRANDS } from '../../constants/smartwatch';
import { PRESET_AVATARS, renderAvatarContent } from '../../components/ui/Avatar';
import { CortexKeyModal } from '../../components/ai/CortexKeyModal';
import { useCortexEnergyStore } from '../../stores/cortexEnergyStore';
import { useUpdateStore } from '../../stores/updateStore';
import { getCurrentAppVersion } from '../../services/updateService';
import { BossTowerModal } from '../../components/profile/BossTowerModal';
import { useBossStore } from '../../stores/bossStore';
export { PRESET_AVATARS, renderAvatarContent };

const GOALS_MAP: Record<string, string> = {
  lose_weight: '⚖️ Perder peso',
  build_muscle: '💪 Ganar músculo',
  improve_endurance: '🏃 Resistencia',
  stay_active: '⚡ Estilo Activo',
  flexibility: '🧘 Flexibilidad',
  mental_health: '🧠 Foco Mental',
};

const EQUIPMENT_MAP: Record<string, string> = {
  none: '🏠 Peso Corporal',
  dumbbells: '🏋️ Mancuernas',
  resistance_band: '🔗 Bandas',
  gym: '🏟️ Gimnasio',
  barbell: '🏋️‍♂️ Barra Olímpica',
};

const EQUIPMENT_OPTIONS = [
  { id: 'none', label: 'Sin equipo (Peso Corporal)', emoji: '🏠', desc: 'Flexiones, sentadillas, picas, planchas en suelo' },
  { id: 'dumbbells', label: 'Mancuernas', emoji: '🏋️', desc: 'Mancuernas ajustables o de peso fijo' },
  { id: 'resistance_band', label: 'Bandas elásticas', emoji: '🔗', desc: 'Bandas de resistencia y bucles' },
  { id: 'gym', label: 'Gimnasio completo', emoji: '🏟️', desc: 'Acceso a poleas, máquinas y barras olímpicas' },
  { id: 'barbell', label: 'Barra y discos', emoji: '🏋️‍♂️', desc: 'Barra olímpica con discos de peso' },
];

export default function ProfileScreen() {
  const { user, setUser, updateProfile } = useUserStore();
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [selectedEq, setSelectedEq] = useState<string[]>(user?.equipment || ['none']);
  const [isRebirthing, setIsRebirthing] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showHunterCardModal, setShowHunterCardModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const { unlockedIds, isAllCompleted } = useAchievementStore();
  const { currentTitle } = useTitleStore();
  const { defeatedBossIds, getActiveBoss, initialize: initBossStore } = useBossStore();
  const [showBossTowerModal, setShowBossTowerModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(SoundEffects.getIsEnabled());
  const [showSmartwatchModal, setShowSmartwatchModal] = useState(false);
  const [showCortexKeyModal, setShowCortexKeyModal] = useState(false);
  const { dailyManaRemaining, isUnlimited, initialize: initEnergy } = useCortexEnergyStore();
  const { isChecking: isCheckingUpdate, checkUpdate } = useUpdateStore();
  const currentAppVersion = getCurrentAppVersion();

  // Salud, Biomecánica y Protección Articular
  const [showBiometricsModal, setShowBiometricsModal] = useState(false);
  const [editWeight, setEditWeight] = useState(String(user?.weight || 70));
  const [editHeight, setEditHeight] = useState(String(user?.height || 175));
  const [isSavingBio, setIsSavingBio] = useState(false);

  const userBmi = getUserBMI(user?.weight, user?.height);
  const bmiData = getBMICategory(userBmi);
  const isKneeProtected = isUserKneeSensitive(user);

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initEnergy();
    if (user?.uid) {
      initBossStore(user.uid);
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [initEnergy, pulseAnim]);
  const {
    brand: watchBrand,
    deviceName: watchDeviceName,
    isConnected: isConnectedWatch,
    metrics: watchMetrics,
  } = useSmartwatchStore();
  const watchBrandConfig = watchBrand ? SMARTWATCH_BRANDS[watchBrand] : null;
  const router = useRouter();

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  const rank = getRankByXP(user.totalXP);

  const handleToggleEq = (id: string) => {
    setSelectedEq((prev) => {
      if (id === 'none') {
        return prev.includes('none') ? [] : ['none'];
      }
      const withoutNone = prev.filter((e) => e !== 'none');
      return withoutNone.includes(id)
        ? withoutNone.filter((e) => e !== id)
        : [...withoutNone, id];
    });
  };

  const handleSaveEquipment = async () => {
    const finalEq = selectedEq.length === 0 ? ['none'] : selectedEq;
    await updateProfile({ equipment: finalEq });
    setShowEquipmentModal(false);
    Alert.alert(
      'Arsenal Calibrado ⚡',
      finalEq.includes('none')
        ? 'Protocolo calibrado a 100% PESO CORPORAL. CORTEX ha adaptado todos tus circuitos y misiones para eliminar ejercicios de gimnasio.'
        : 'Protocolo calibrado con tu equipamiento disponible.'
    );
  };

  const handleRebirth = () => {
    Alert.alert(
      '⚠️ ¿ACTIVAR PROTOCOLO RENACER?',
      `Esta acción purificará tu avatar y borrará permanentemente todo tu progreso:\n\n• Nivel ${user.level} y Rango ${user.rank} (${user.totalXP} XP acumulados)\n• Historial de peso y circuitos completados\n• Misiones diarias y biometría\n\nTu avatar volverá a Nivel 1 y pasarás a la calibración inicial (Onboarding) para empezar desde cero.\n\n¿Deseas Renacer ahora?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '⚡ Sí, Renacer desde 0',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsRebirthing(true);
              const uid = user.uid;

              // 1. Limpiar almacenamiento local
              try {
                await AsyncStorage.clear();
              } catch (e) {
                console.warn('Error limpiando AsyncStorage:', e);
              }

              // 2. Resetear todos los stores de progreso, planes y entrenamientos
              await useProgressStore.getState().resetProgress(uid);
              usePlanStore.getState().resetPlan();
              await useWorkoutStore.getState().resetWorkoutStore();

              // 3. Crear el nuevo perfil limpio local (Nivel 1, Rango E, 0 XP, goals vacíos)
              const cleanProfile: UserProfile = {
                uid,
                name: user.name || 'Cazador',
                email: '',
                totalXP: 0,
                level: 1,
                rank: 'E',
                stats: { ...DEFAULT_STATS },
                streak: 0,
                lastActiveDate: '',
                goals: [], // Goals vacíos disparan la calibración de Onboarding
                fitnessLevel: 'beginner',
                equipment: ['none'],
                workoutsCompleted: 0,
                questsCompleted: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              // 4. Actualizar el estado global del usuario con el nuevo avatar limpio
              useUserStore.getState().setUser(cleanProfile);

              // 5. Redirigir directamente al Onboarding para calibrar el nuevo avatar desde cero
              router.replace('/(auth)/onboarding');

              Alert.alert(
                '✨ Renacimiento Concluido',
                'Tu progreso ha sido purificado a Nivel 1. Calibra nuevamente los objetivos de tu avatar.'
              );
            } catch (error) {
              console.error('Error durante el protocolo renacer:', error);
              Alert.alert('Error', 'Hubo un inconveniente al reiniciar la cuenta.');
            } finally {
              setIsRebirthing(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenEditProfile = () => {
    setEditName(user?.name || '');
    setEditAvatar(user?.avatar || '');
    setShowEditProfileModal(true);
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Requerimos acceso a tus fotos para elegir una foto de perfil.');
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
        setEditAvatar(formattedUri);
      }
    } catch (err) {
      console.warn('Error seleccionando imagen:', err);
      Alert.alert('Error', 'No se pudo seleccionar la foto de la galería.');
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
        setEditAvatar(formattedUri);
      }
    } catch (err) {
      console.warn('Error capturando foto:', err);
      Alert.alert('Error', 'No se pudo activar la cámara.');
    }
  };

  const handleSaveProfile = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      Alert.alert('Nombre inválido', 'Por favor ingresa un nombre de Cazador válido.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: trimmed,
        avatar: editAvatar,
      });
      setShowEditProfileModal(false);
      Alert.alert('Perfil Actualizado ⚡', 'Tu nuevo nombre y foto de avatar se han sincronizado con CORTEX.');
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      Alert.alert('Error', 'No se pudieron guardar los cambios de tu perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const memberSince = new Date(user.createdAt || Date.now()).toLocaleDateString('es', {
    month: 'short',
    year: 'numeric',
  });

  const xpInfo = getXPForNextLevel(user.totalXP);

  // Aura de Cazador (Solo Leveling Ranks)
  const rankAuraColor =
    rank.key === 'S' || rank.key === 'SS' || rank.key === 'SSS'
      ? '#EF4444' // Carmesí Monarca
      : rank.key === 'A'
      ? '#F59E0B' // Oro Solar
      : rank.key === 'B'
      ? '#8B5CF6' // Violeta
      : rank.key === 'C'
      ? '#3B82F6' // Azul Zafiro
      : rank.key === 'D'
      ? '#10B981' // Verde Esmeralda
      : '#64748B'; // Gris E-Rank

  const auraPulse = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [rankAuraColor + '33', rankAuraColor + 'DD'],
  });

  const auraScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.05],
  });

  // Vitals del Cazador (Solo Leveling)
  const maxHP = (user.stats?.vitality || 10) * 100 + user.level * 50;
  const currentHP = maxHP;
  const maxMP = 100;
  const currentMP = isUnlimited ? 100 : dailyManaRemaining * 20;
  const combatPower =
    (user.stats?.strength || 10) * 12 +
    (user.stats?.agility || 10) * 10 +
    (user.stats?.vitality || 10) * 10 +
    (user.stats?.discipline || 10) * 8 +
    (user.stats?.mind || 10) * 8 +
    user.level * 25;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Superior del Sistema */}
        <View style={styles.header}>
          <View style={styles.headerSystemBadgeRow}>
            <Animated.View style={[styles.headerLiveDot, { transform: [{ scale: auraScale }] }]} />
            <Text style={styles.headerSystemTag}>[ SISTEMA: ESTADO DEL CAZADOR ]</Text>
            <Text style={styles.headerRankSubTag}>CORTEX V1.0</Text>
          </View>
        </View>

        {/* 1. HERO CARD DEL CAZADOR CON AURA ANIMADA */}
        <View style={styles.heroCard}>
          <Animated.View style={[styles.avatarAuraRing, { borderColor: auraPulse, transform: [{ scale: auraScale }] }]}>
            <TouchableOpacity
              style={styles.avatarTouchable}
              onPress={handleOpenEditProfile}
              activeOpacity={0.8}
            >
              {renderAvatarContent(user.avatar, user.name, 90)}
              <View style={styles.avatarCameraBadge}>
                <Ionicons name="camera" size={13} color="#0A0A0F" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.userNameContainer}
            onPress={handleOpenEditProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.editNamePill}>
              <Ionicons name="create-outline" size={13} color="#00F0FF" />
            </View>
          </TouchableOpacity>

          <View style={styles.hunterStatusSubRow}>
            <View style={styles.hunterRankBadgeWrapper}>
              <RankBadge rankKey={rank.key} size="md" />
            </View>
            <Text style={styles.memberSince}>En el Sistema desde {memberSince}</Text>
          </View>

          {/* Título Semanal Otorgado por CORTEX (Estilo Pergamino de Rango) */}
          <View style={[styles.titleDisplayCard, { borderColor: currentTitle.color + '55' }]}>
            <View style={styles.titleDisplayTop}>
              <View style={[styles.titleDisplayTag, { backgroundColor: currentTitle.color + '22' }]}>
                <Text style={[styles.titleDisplayTagText, { color: currentTitle.color }]}>
                  [ TÍTULO ACTIVO DEL SISTEMA ]
                </Text>
              </View>
              <Text style={styles.titleAutoText}>Asignado por CORTEX</Text>
            </View>
            <View style={styles.titleMainRow}>
              <Text style={styles.titleEmoji}>{currentTitle.badgeEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.titleName, { color: currentTitle.color }]}>
                  {currentTitle.name}
                </Text>
                <Text style={styles.titleCriteria}>{currentTitle.criteriaLabel}</Text>
              </View>
            </View>
            <Text style={styles.titleLore}>{currentTitle.lore}</Text>
          </View>

          {/* Botones de Ficha de Cazador & Salón de Logros */}
          <View style={styles.heroActionButtonsRow}>
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => setShowHunterCardModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="card-outline" size={15} color="#00F0FF" />
              <Text style={styles.heroActionBtnText}>Ficha de Cazador</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.heroActionBtn, isAllCompleted() && styles.heroActionBtnGold]}
              onPress={() => setShowAchievementsModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isAllCompleted() ? 'trophy' : 'trophy-outline'}
                size={15}
                color={isAllCompleted() ? '#F59E0B' : '#00F0FF'}
              />
              <Text
                style={[
                  styles.heroActionBtnText,
                  isAllCompleted() && { color: '#F59E0B' },
                ]}
              >
                Logros ({unlockedIds.length}/52)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.heroActionBtn, styles.heroActionBtnPurple]}
              onPress={() => setShowBossTowerModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-half" size={15} color="#C084FC" />
              <Text style={[styles.heroActionBtnText, { color: '#C084FC' }]}>
                Torre ({defeatedBossIds.length}/22)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TARJETA DESTACADA: LA TORRE DE LOS 22 MONARCAS */}
        <TouchableOpacity
          style={styles.bossTowerBannerCard}
          onPress={() => setShowBossTowerModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.bossTowerHeaderRow}>
            <View style={styles.bossTowerTitleRow}>
              <View style={styles.bossTowerIconBox}>
                <Ionicons name="shield" size={16} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.bossTowerTitleBadgeRow}>
                  <Text style={styles.bossTowerTitle}>[ LA TORRE DE JEFES ]</Text>
                  <View style={styles.bossTowerFloorTag}>
                    <Text style={styles.bossTowerFloorTagText}>
                      {defeatedBossIds.length}/22 PISOS
                    </Text>
                  </View>
                </View>
                <Text style={styles.bossTowerSubtitle}>
                  {defeatedBossIds.length >= 22
                    ? '👑 Cúspide Conquistada • Monarcas Sometidos'
                    : `Objetivo Actual: Escalón ${defeatedBossIds.length + 1} (${getActiveBoss().name.split(',')[0]})`}
                </Text>
              </View>
            </View>
            <View style={styles.bossTowerChevronBox}>
              <Ionicons name="chevron-forward" size={18} color="#C084FC" />
            </View>
          </View>

          {/* Barra de progreso de la Torre */}
          <View style={styles.bossTowerProgressTrack}>
            <View
              style={[
                styles.bossTowerProgressFill,
                { width: `${Math.max(5, Math.round((defeatedBossIds.length / 22) * 100))}%` },
              ]}
            />
          </View>
          <View style={styles.bossTowerFooterRow}>
            <Text style={styles.bossTowerFooterText}>
              💥 Registro de Rutinas y Fechas de Conquista
            </Text>
            <Text style={styles.bossTowerActionText}>VER SALÓN DE MONARCAS ›</Text>
          </View>
        </TouchableOpacity>

        {/* 2. LA ICÓNICA [ VENTANA DE ESTADO ] DE SOLO LEVELING */}
        <View style={styles.statusWindowCard}>
          <View style={styles.statusWindowHeader}>
            <View style={styles.statusWindowTitleRow}>
              <View style={styles.questsTitleIconBox}>
                <Ionicons name="hardware-chip-outline" size={17} color="#00F0FF" />
              </View>
              <Text style={styles.statusWindowTitle}>[ VENTANA DE ESTADO ]</Text>
            </View>
            <View style={styles.combatPowerBadge}>
              <Ionicons name="flash" size={11} color="#F59E0B" />
              <Text style={styles.combatPowerText}>PODER: {combatPower.toLocaleString()}</Text>
            </View>
          </View>

          {/* Vitals: HP / MP / EXP */}
          <View style={styles.vitalsContainer}>
            {/* HP Bar */}
            <View style={styles.vitalRow}>
              <View style={styles.vitalLabelRow}>
                <Text style={styles.vitalNameHP}>HP (Salud & Vitalidad)</Text>
                <Text style={styles.vitalValueHP}>{currentHP} / {maxHP}</Text>
              </View>
              <View style={styles.vitalTrack}>
                <View style={[styles.vitalFillHP, { width: '100%' }]} />
              </View>
            </View>

            {/* MP Bar */}
            <View style={styles.vitalRow}>
              <View style={styles.vitalLabelRow}>
                <Text style={styles.vitalNameMP}>MP (Maná Neural CORTEX)</Text>
                <Text style={styles.vitalValueMP}>
                  {isUnlimited ? '∞ / ∞ (Ilimitado)' : `${currentMP} / ${maxMP}`}
                </Text>
              </View>
              <View style={styles.vitalTrack}>
                <View style={[styles.vitalFillMP, { width: `${currentMP}%` }]} />
              </View>
            </View>

            {/* EXP Bar */}
            {xpInfo && (
              <View style={styles.vitalRow}>
                <View style={styles.vitalLabelRow}>
                  <Text style={styles.vitalNameEXP}>EXP (Nivel {user.level})</Text>
                  <Text style={styles.vitalValueEXP}>
                    {xpInfo.current} / {xpInfo.required} XP ({Math.round(xpInfo.progress)}%)
                  </Text>
                </View>
                <View style={styles.vitalTrack}>
                  <View style={[styles.vitalFillEXP, { width: `${xpInfo.progress}%` }]} />
                </View>
              </View>
            )}
          </View>

          {/* The 5 Core Solo Leveling Stats */}
          <View style={styles.statsDivider}>
            <View style={styles.statsDividerLine} />
            <Text style={styles.statsDividerText}>[ ATRIBUTOS DEL CAZADOR ]</Text>
            <View style={styles.statsDividerLine} />
          </View>

          <View style={styles.statsGrid}>
            {[
              { code: 'STR', name: 'FUERZA', value: user.stats?.strength || 10, color: '#EF4444', desc: 'Poder de Empuje & Tracción' },
              { code: 'AGI', name: 'AGILIDAD', value: user.stats?.agility || 10, color: '#F59E0B', desc: 'Cardio, Tren Inferior & Reflejos' },
              { code: 'VIT', name: 'VITALIDAD', value: user.stats?.vitality || 10, color: '#10B981', desc: 'Hidratación, Recuperación & Salud' },
              { code: 'INT', name: 'DISCIPLINA', value: user.stats?.discipline || 10, color: '#3B82F6', desc: 'Rachas Tácticas & Voluntad' },
              { code: 'PER', name: 'PERCEPCIÓN', value: user.stats?.mind || 10, color: '#8B5CF6', desc: 'Foco Mental & Descanso Biológico' },
            ].map((st) => (
              <View key={st.code} style={styles.statCard}>
                <View style={styles.statCardTop}>
                  <View style={[styles.statCodeBadge, { borderColor: st.color + '66', backgroundColor: st.color + '15' }]}>
                    <Text style={[styles.statCodeText, { color: st.color }]}>{st.code}</Text>
                  </View>
                  <Text style={styles.statNameText}>{st.name}</Text>
                  <Text style={[styles.statValueText, { color: st.color }]}>{st.value}</Text>
                </View>
                <Text style={styles.statDescText}>{st.desc}</Text>
                <View style={styles.statMiniBarTrack}>
                  <View style={[styles.statMiniBarFill, { backgroundColor: st.color, width: `${Math.min(st.value * 3, 100)}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 3. CALIBRACIÓN DEL AVATAR: ARSENAL & TELEMETRÍA (Estilo Misiones Diarias) */}
        <View style={styles.cyberCard}>
          <View style={styles.cyberCardHeader}>
            <View style={styles.cyberCardTitleRow}>
              <View style={styles.questsTitleIconBox}>
                <Ionicons name="barbell-outline" size={17} color="#00F0FF" />
              </View>
              <Text style={styles.cyberCardTitle}>[ ARSENAL & TELEMETRÍA ]</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedEq(user.equipment || ['none']);
                setShowEquipmentModal(true);
              }}
              style={styles.calibrarBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.calibrarBtnText}>⚙️ Calibrar</Text>
            </TouchableOpacity>
          </View>

          {/* Biometría Row en Píldoras Tácticas */}
          {(user.age || user.weight || user.height) && (
            <View style={styles.bodyRow}>
              {user.age && (
                <View style={styles.bodyItem}>
                  <Text style={styles.bodyValue}>{user.age}</Text>
                  <Text style={styles.bodyLabel}>Años</Text>
                </View>
              )}
              {user.weight && (
                <View style={styles.bodyItem}>
                  <Text style={styles.bodyValue}>{user.weight}</Text>
                  <Text style={styles.bodyLabel}>kg</Text>
                </View>
              )}
              {user.height && (
                <View style={styles.bodyItem}>
                  <Text style={styles.bodyValue}>{user.height}</Text>
                  <Text style={styles.bodyLabel}>cm</Text>
                </View>
              )}
            </View>
          )}

          {/* Arsenal Tags */}
          <View style={styles.tagsRow}>
            {user.equipment?.map((e) => {
              const isNone = e === 'none';
              return (
                <View
                  key={e}
                  style={[
                    styles.tag,
                    isNone && { borderColor: '#00F0FF88', backgroundColor: 'rgba(0, 240, 255, 0.12)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      isNone && { color: '#00F0FF', fontWeight: 'bold' },
                    ]}
                  >
                    {EQUIPMENT_MAP[e] || e}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Objetivos Tags */}
          {user.goals && user.goals.length > 0 && (
            <View style={styles.tagsRow}>
              {user.goals.map((g) => (
                <View key={g} style={styles.tag}>
                  <Text style={styles.tagText}>{GOALS_MAP[g] || g}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 4. NEXO SMARTWATCH BIOMÉTRICO */}
        <View style={styles.cyberCard}>
          <View style={styles.cyberCardHeader}>
            <View style={styles.cyberCardTitleRow}>
              <View style={[styles.questsTitleIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
                <Ionicons name="watch-outline" size={17} color="#10B981" />
              </View>
              <Text style={styles.cyberCardTitle}>[ BIO-NEXO SMARTWATCH ]</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowSmartwatchModal(true)}
              style={styles.calibrarBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.calibrarBtnText}>{isConnectedWatch ? '⚙️ Gestionar' : '⚡ Vincular'}</Text>
            </TouchableOpacity>
          </View>

          {isConnectedWatch && watchBrandConfig ? (
            <View style={styles.smartwatchProfileConnected}>
              <View style={styles.smartwatchProfileHeaderRow}>
                <View style={[styles.smartwatchProfileDot, { backgroundColor: watchBrandConfig.accentColor }]} />
                <Text style={[styles.smartwatchProfileBrandName, { color: watchBrandConfig.accentColor }]}>
                  {watchBrandConfig.name.toUpperCase()} • {watchDeviceName}
                </Text>
                <Text style={styles.smartwatchProfileBattery}>🔋 {watchMetrics.batteryLevel}%</Text>
              </View>
              <Text style={styles.smartwatchProfileProtocol}>{watchBrandConfig.protocolName}</Text>
              <View style={styles.smartwatchProfileStatsRow}>
                <Text style={styles.smartwatchProfileStatText}>👟 {watchMetrics.steps.toLocaleString()} pasos</Text>
                <Text style={styles.smartwatchProfileStatText}>💓 {watchMetrics.currentHeartRate} BPM</Text>
                <Text style={styles.smartwatchProfileStatText}>🔥 {watchMetrics.activeCalories} kcal</Text>
                <Text style={styles.smartwatchProfileStatText}>💤 {watchMetrics.sleepHours}h ({watchMetrics.readinessScore}%)</Text>
              </View>
            </View>
          ) : (
            <View style={styles.smartwatchProfileUnconnected}>
              <Text style={styles.smartwatchProfileUnconnectedText}>
                Vincula tu reloj Samsung, Apple, Cubitt o Xiaomi para sincronizar pulso, pasos y descanso, adaptando tus misiones en tiempo real.
              </Text>
              <View style={styles.smartwatchBrandsLogosRow}>
                <Text style={styles.brandBadgePill}>Samsung</Text>
                <Text style={styles.brandBadgePill}>Apple</Text>
                <Text style={styles.brandBadgePill}>Cubitt</Text>
                <Text style={styles.brandBadgePill}>Xiaomi</Text>
              </View>
            </View>
          )}
        </View>

        {/* 4.5. SALUD, BIOMECÁNICA & PROTECCIÓN ARTICULAR */}
        <View style={styles.cyberCard}>
          <View style={styles.cyberCardHeader}>
            <View style={styles.cyberCardTitleRow}>
              <View style={[styles.questsTitleIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)' }]}>
                <Ionicons name="shield-checkmark" size={17} color="#10B981" />
              </View>
              <Text style={styles.cyberCardTitle}>[ SALUD & BIOMECÁNICA ARTICULAR ]</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditWeight(String(user?.weight || 70));
                setEditHeight(String(user?.height || 175));
                setShowBiometricsModal(true);
              }}
              style={styles.editBioBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={13} color="#00F0FF" />
              <Text style={styles.editBioBtnText}>EDITAR</Text>
            </TouchableOpacity>
          </View>

          {/* Estadísticas de IMC y Biometría */}
          <View style={styles.bioMetricsRow}>
            <View style={styles.bioMetricCol}>
              <Text style={styles.bioMetricLabel}>PESO CORPORAL</Text>
              <Text style={styles.bioMetricVal}>{user?.weight || 70} kg</Text>
            </View>
            <View style={styles.bioMetricDivider} />
            <View style={styles.bioMetricCol}>
              <Text style={styles.bioMetricLabel}>ESTATURA</Text>
              <Text style={styles.bioMetricVal}>{user?.height || 175} cm</Text>
            </View>
            <View style={styles.bioMetricDivider} />
            <View style={styles.bioMetricCol}>
              <Text style={styles.bioMetricLabel}>IMC CLÍNICO</Text>
              <Text style={[styles.bioMetricVal, { color: bmiData.color }]}>{userBmi}</Text>
            </View>
          </View>

          {/* Aviso Clínico del IMC */}
          <View style={[styles.bmiNoticeBox, { borderColor: `${bmiData.color}40`, backgroundColor: `${bmiData.color}10` }]}>
            <Ionicons name="information-circle-outline" size={16} color={bmiData.color} />
            <Text style={styles.bmiNoticeText}>
              <Text style={{ fontWeight: 'bold', color: bmiData.color }}>{bmiData.label}: </Text>
              {bmiData.recommendation}
            </Text>
          </View>

          {/* Interruptor de Protección Articular */}
          <TouchableOpacity
            style={styles.settingCardItem}
            onPress={async () => {
              Haptics.medium();
              const nextVal = !user?.kneeFriendly;
              await updateProfile({ kneeFriendly: nextVal });
              Alert.alert(
                nextVal ? '🛡️ Protección Articular Activada' : 'Protección Articular Desactivada',
                nextVal
                  ? 'CORTEX adaptará automáticamente todas tus rutinas sustituyendo saltos y burpees por ejercicios de cero cizallamiento patelar (Box Squats, Glute Bridges y flexiones inclinadas).'
                  : 'Las rutinas volverán a incluir la variante estándar y movimientos pliométricos.'
              );
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIconBox, { backgroundColor: isKneeProtected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)', borderColor: isKneeProtected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)' }]}>
              <Ionicons name="shield-checkmark" size={18} color={isKneeProtected ? '#10B981' : '#64748B'} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Protección Articular (Rodillas Seguras)</Text>
              <Text style={styles.settingSubtitle}>
                {isKneeProtected
                  ? 'Activo: Filtra saltos y sentadillas balísticas'
                  : 'Inactivo: Rutinas con saltos estándar'}
              </Text>
            </View>
            <View style={[styles.statusTogglePill, isKneeProtected && styles.statusTogglePillActive]}>
              <Text style={[styles.statusToggleText, isKneeProtected && styles.statusToggleTextActive]}>
                {isKneeProtected ? 'ACTIVO 🛡️' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 5. CONFIGURACIÓN DEL SISTEMA (Formato QuestItem) */}
        <View style={styles.cyberCard}>
          <View style={styles.cyberCardHeader}>
            <View style={styles.cyberCardTitleRow}>
              <View style={styles.questsTitleIconBox}>
                <Ionicons name="settings-outline" size={17} color="#00F0FF" />
              </View>
              <Text style={styles.cyberCardTitle}>[ CONFIGURACIÓN DEL SISTEMA ]</Text>
            </View>
          </View>

          <View style={styles.settingsList}>
            {/* Núcleo CORTEX & Maná */}
            <TouchableOpacity
              style={styles.settingCardItem}
              onPress={() => setShowCortexKeyModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(0, 240, 255, 0.12)', borderColor: 'rgba(0, 240, 255, 0.3)' }]}>
                <Ionicons name="hardware-chip-outline" size={18} color="#00F0FF" />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Núcleo CORTEX (IA Gemini)</Text>
                <Text style={styles.settingSubtitle}>
                  {isUnlimited
                    ? 'Clave personal vinculada • Modo Ilimitado'
                    : `${dailyManaRemaining}/5 Maná diario disponible (Toca para BYOK)`}
                </Text>
              </View>
              {isUnlimited ? (
                <View style={styles.statusPillGold}>
                  <Text style={styles.statusPillGoldText}>👑 Ilimitado</Text>
                </View>
              ) : (
                <View style={styles.statusPillCyan}>
                  <Text style={styles.statusPillCyanText}>⚡ {dailyManaRemaining}/5</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Alarmas */}
            <TouchableOpacity
              style={styles.settingCardItem}
              onPress={() => setShowAlarmModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                <Ionicons name="alarm-outline" size={18} color="#F59E0B" />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Alarmas & Misiones</Text>
                <Text style={styles.settingSubtitle}>Recordatorios de agua y rutinas</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* Sonidos */}
            <TouchableOpacity
              style={styles.settingCardItem}
              onPress={async () => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                await SoundEffects.setEnabled(next);
                if (next) SoundEffects.playChime();
                Haptics.light();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                <Ionicons name="volume-high-outline" size={18} color="#8B5CF6" />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Efectos de Sonido</Text>
                <Text style={styles.settingSubtitle}>Acústica táctica en ejercicios</Text>
              </View>
              <View style={[styles.statusTogglePill, soundEnabled && styles.statusTogglePillActive]}>
                <Text style={[styles.statusToggleText, soundEnabled && styles.statusToggleTextActive]}>
                  {soundEnabled ? 'ACTIVO' : 'OFF'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Notificaciones Push */}
            <TouchableOpacity
              style={styles.settingCardItem}
              onPress={async () => {
                Haptics.medium();
                const granted = await CORTEXNotifications.requestPermissions();
                if (granted) {
                  await CORTEXNotifications.scheduleDailyDirectives();
                  await CORTEXNotifications.sendImmediateNotification(
                    '⚡ DIRECTIVAS CORTEX VINCULADAS',
                    'Canal táctico local sincronizado. Recibirás tus misiones y recordatorios.'
                  );
                  Alert.alert('Directivas CORTEX', 'Notificaciones del sistema programadas exitosamente.');
                } else {
                  Alert.alert('Permiso Requerido', 'Activa las notificaciones en los ajustes de tu dispositivo para recibir las directivas.');
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                <Ionicons name="notifications-outline" size={18} color="#10B981" />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Directivas Push</Text>
                <Text style={styles.settingSubtitle}>Alertas locales en tu teléfono</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* Actualizaciones del Sistema (GitHub OTA) */}
            <TouchableOpacity
              style={styles.settingCardItem}
              onPress={() => {
                Haptics.light();
                checkUpdate(true);
              }}
              disabled={isCheckingUpdate}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(0, 240, 255, 0.12)', borderColor: 'rgba(0, 240, 255, 0.3)' }]}>
                {isCheckingUpdate ? (
                  <ActivityIndicator size="small" color="#00F0FF" />
                ) : (
                  <Ionicons name="cloud-download-outline" size={18} color="#00F0FF" />
                )}
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Actualizaciones del Sistema</Text>
                <Text style={styles.settingSubtitle}>
                  {isCheckingUpdate
                    ? 'Sincronizando con satélite GitHub...'
                    : `Versión v${currentAppVersion} • Comprobar parches CORTEX`}
                </Text>
              </View>
              <View style={styles.statusPillCyan}>
                <Text style={styles.statusPillCyanText}>
                  {isCheckingUpdate ? 'ESCANEANDO' : 'BUSCAR'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. GESTIÓN DEL CAZADOR (Protocolo Renacer) */}
        <View style={styles.rebirthCard}>
          <TouchableOpacity
            style={styles.rebirthBtn}
            onPress={handleRebirth}
            disabled={isRebirthing}
            activeOpacity={0.75}
          >
            <View style={styles.rebirthIconBox}>
              <Ionicons name="refresh-circle-outline" size={22} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rebirthTitle}>[ PROTOCOLO RENACER ]</Text>
              <Text style={styles.rebirthSubDesc}>Purifica tu avatar y reinicia a Nivel 1 desde cero</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Level Up System v{currentAppVersion} • Impulsado por CORTEX AI</Text>
      </ScrollView>

      <PlanAlarmModal visible={showAlarmModal} onClose={() => setShowAlarmModal(false)} />

      {/* Modal de Calibración de Equipamiento */}
      <Modal
        visible={showEquipmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEquipmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Calibrar Arsenal Táctico</Text>
                <Text style={styles.modalSubtitle}>
                  CORTEX adaptará en tiempo real todos los circuitos y misiones según tus implementos.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEquipmentModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {EQUIPMENT_OPTIONS.map((item) => {
                const isSelected = selectedEq.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.eqOptionCard,
                      isSelected && styles.eqOptionCardSelected,
                    ]}
                    onPress={() => handleToggleEq(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.eqOptionEmoji}>{item.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.eqOptionLabel,
                          isSelected && styles.eqOptionLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.eqOptionDesc}>{item.desc}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isSelected ? '#00F0FF' : Colors.text.muted}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveEqBtn}
                onPress={handleSaveEquipment}
                activeOpacity={0.85}
              >
                <Text style={styles.saveEqBtnText}>GUARDAR CALIBRACIÓN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Calibración de Biometría & Salud */}
      <Modal
        visible={showBiometricsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBiometricsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Calibración Biométrica</Text>
                  <Text style={styles.modalSubtitle}>
                    Ajusta tu peso y estatura. CORTEX recalibrará tus macros, hidratación y riesgo articular.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowBiometricsModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={{ paddingVertical: Spacing.md, gap: Spacing.md }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Peso Corporal (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. 75.5"
                    placeholderTextColor={Colors.text.muted}
                    value={editWeight}
                    onChangeText={setEditWeight}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Estatura (cm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. 175"
                    placeholderTextColor={Colors.text.muted}
                    value={editHeight}
                    onChangeText={setEditHeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.saveEqBtn, isSavingBio && { opacity: 0.7 }]}
                  disabled={isSavingBio}
                  onPress={async () => {
                    const w = parseFloat(editWeight.replace(',', '.'));
                    const h = parseFloat(editHeight.replace(',', '.'));
                    if (isNaN(w) || w <= 30 || w >= 300) {
                      Alert.alert('Valor inválido', 'Introduce un peso válido entre 30 y 300 kg.');
                      return;
                    }
                    if (isNaN(h) || h <= 100 || h >= 250) {
                      Alert.alert('Valor inválido', 'Introduce una estatura válida entre 100 y 250 cm.');
                      return;
                    }
                    setIsSavingBio(true);
                    Haptics.medium();
                    const newBmi = getUserBMI(w, h);
                    const autoKnee = newBmi >= 27.5 || w >= 90;
                    await updateProfile({
                      weight: w,
                      height: h,
                      kneeFriendly: user?.kneeFriendly !== undefined ? user.kneeFriendly : autoKnee,
                    });
                    setIsSavingBio(false);
                    setShowBiometricsModal(false);
                    Alert.alert(
                      'Biometría Actualizada',
                      `Datos guardados: ${w} kg, ${h} cm (IMC: ${newBmi}). CORTEX ha adaptado tus directivas.`
                    );
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveEqBtnText}>
                    {isSavingBio ? 'CALIBRANDO...' : 'GUARDAR PARÁMETROS'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Edición de Perfil (Nombre y Foto) */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editProfileBox}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Editar Perfil de Cazador</Text>
                  <Text style={styles.modalSubtitle}>
                    Personaliza tu nombre de combate y tu foto de avatar.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowEditProfileModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Vista Previa del Avatar */}
                <View style={styles.avatarPreviewCenter}>
                  <View style={styles.avatarPreviewGlow}>
                    {renderAvatarContent(editAvatar, editName, 96)}
                  </View>
                  <Text style={styles.avatarPreviewHint}>Vista previa de tu avatar</Text>
                </View>

                {/* Acciones de Foto */}
                <View style={styles.photoActionsRow}>
                  <TouchableOpacity
                    style={styles.photoActionBtn}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="images-outline" size={18} color="#00F0FF" />
                    <Text style={styles.photoActionBtnText}>Galería</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoActionBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={18} color="#00F0FF" />
                    <Text style={styles.photoActionBtnText}>Cámara</Text>
                  </TouchableOpacity>

                  {!!editAvatar && (
                    <TouchableOpacity
                      style={[styles.photoActionBtn, styles.photoActionRemoveBtn]}
                      onPress={() => setEditAvatar('')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      <Text style={styles.photoActionRemoveBtnText}>Quitar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Avatares Tácticos CORTEX */}
                <Text style={styles.inputSectionLabel}>🎭 Avatares Tácticos CORTEX</Text>
                <View style={styles.presetGrid}>
                  {PRESET_AVATARS.map((p) => {
                    const isSelected = editAvatar === `preset:${p.id}`;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.presetChip,
                          { borderColor: isSelected ? p.color : '#1E293B' },
                          isSelected && { backgroundColor: p.color + '25' },
                        ]}
                        onPress={() => setEditAvatar(`preset:${p.id}`)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.presetChipEmoji}>{p.emoji}</Text>
                        <Text style={[styles.presetChipLabel, isSelected && { color: p.color, fontWeight: 'bold' }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Input de Nombre */}
                <Text style={[styles.inputSectionLabel, { marginTop: 18 }]}>👤 Nombre de Guerrero</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Ej. Jin-Woo, Cazador X"
                    placeholderTextColor="#64748B"
                    maxLength={25}
                    autoCapitalize="words"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.saveEqBtn, isSavingProfile && { opacity: 0.6 }]}
                  onPress={handleSaveProfile}
                  disabled={isSavingProfile}
                  activeOpacity={0.85}
                >
                  {isSavingProfile ? (
                    <ActivityIndicator size="small" color="#0A0A0F" />
                  ) : (
                    <Text style={styles.saveEqBtnText}>GUARDAR CAMBIOS</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Ficha de Cazador */}
      <HunterCardModal
        visible={showHunterCardModal}
        onClose={() => setShowHunterCardModal(false)}
      />

      {/* Modal de Salón de Logros */}
      <AchievementsModal
        visible={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
      />

      {/* Modal de La Torre de Jefes */}
      <BossTowerModal
        visible={showBossTowerModal}
        onClose={() => setShowBossTowerModal(false)}
        onNavigateToWorkouts={() => router.push('/workouts')}
      />

      {/* Modal de Gestión y Sincronización Smartwatch */}
      <SmartwatchSyncModal
        visible={showSmartwatchModal}
        onClose={() => setShowSmartwatchModal(false)}
      />

      {/* Modal de Configuración Clave CORTEX (BYOK) */}
      <CortexKeyModal
        visible={showCortexKeyModal}
        onClose={() => setShowCortexKeyModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  container: { padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl'] },

  // Header del Sistema
  header: {
    marginBottom: 2,
  },
  headerSystemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F121E',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  headerLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00F0FF',
  },
  headerSystemTag: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  headerRankSubTag: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },

  // Hero Card del Cazador
  heroCard: {
    backgroundColor: '#0F121E',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  avatarAuraRing: {
    padding: 5,
    borderRadius: 60,
    borderWidth: 2.5,
  },
  avatarTouchable: { position: 'relative' },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0F',
  },
  userNameContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  userName: { color: Colors.text.primary, fontSize: Fonts.sizes['2xl'], fontWeight: 'bold' },
  editNamePill: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  hunterStatusSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  hunterRankBadgeWrapper: {
    alignItems: 'center',
  },
  memberSince: { color: Colors.text.muted, fontSize: Fonts.sizes.xs },

  heroActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  heroActionBtnGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  heroActionBtnPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  heroActionBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Tarjeta de la Torre de los 22 Monarcas
  bossTowerBannerCard: {
    backgroundColor: '#0D0E1A',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    padding: Spacing.md,
    gap: 10,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bossTowerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bossTowerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bossTowerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossTowerTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bossTowerTitle: {
    color: '#F8FAFC',
    fontSize: 13.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bossTowerFloorTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  bossTowerFloorTagText: {
    color: '#C084FC',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  bossTowerSubtitle: {
    color: Colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  bossTowerChevronBox: {
    marginLeft: 6,
  },
  bossTowerProgressTrack: {
    width: '100%',
    height: 5,
    backgroundColor: '#161828',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bossTowerProgressFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 3,
  },
  bossTowerFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bossTowerFooterText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
  },
  bossTowerActionText: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Solo Leveling [ Ventana de Estado ]
  statusWindowCard: {
    backgroundColor: '#0C101F',
    borderWidth: 1.8,
    borderColor: 'rgba(0, 240, 255, 0.45)',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  statusWindowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusWindowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questsTitleIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  editBioBtnText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  bioMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bioMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  bioMetricLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bioMetricVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bioMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bmiNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  bmiNoticeText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
  },
  statusWindowTitle: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  combatPowerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  combatPowerText: {
    color: '#F59E0B',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  vitalsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  vitalRow: {
    gap: 4,
  },
  vitalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vitalNameHP: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  vitalValueHP: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  vitalTrack: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  vitalFillHP: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  vitalNameMP: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  vitalValueMP: {
    color: '#A5F3FC',
    fontSize: 11,
    fontWeight: 'bold',
  },
  vitalFillMP: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 4,
  },
  vitalNameEXP: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  vitalValueEXP: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: 'bold',
  },
  vitalFillEXP: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  statsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  statsDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
  },
  statsDividerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statsGrid: {
    gap: 8,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statCodeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statNameText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  statValueText: {
    fontSize: 14,
    fontWeight: '900',
  },
  statDescText: {
    color: '#64748B',
    fontSize: 10,
  },
  statMiniBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  statMiniBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Cyber Card (Formato Misiones Diarias)
  cyberCard: {
    backgroundColor: '#0F121E',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cyberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cyberCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cyberCardTitle: {
    color: '#00F0FF',
    fontSize: 13.5,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },

  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  avatarText: { color: Colors.text.primary, fontSize: Fonts.sizes['3xl'], fontWeight: 'bold' },
  email: { color: Colors.text.secondary, fontSize: Fonts.sizes.sm },
  sectionTitle: { color: Colors.text.primary, fontSize: Fonts.sizes.base, fontWeight: 'bold', marginBottom: Spacing.sm },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: { color: Colors.text.secondary, fontSize: Fonts.sizes.xs },
  tagTextGreen: { color: Colors.brand.success, fontSize: Fonts.sizes.xs, fontWeight: 'bold' },
  calibrarBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#00F0FF15',
    borderWidth: 1,
    borderColor: '#00F0FF44',
  },
  calibrarBtnText: {
    color: '#00F0FF',
    fontSize: Fonts.sizes.xs,
    fontWeight: 'bold',
  },
  bodyweightBadgeNote: {
    color: '#00F0FF',
    fontSize: 11,
    marginTop: 10,
    lineHeight: 16,
    opacity: 0.9,
  },
  bodyRow: { flexDirection: 'row', justifyContent: 'space-around' },
  bodyItem: { alignItems: 'center' },
  bodyValue: { color: Colors.text.primary, fontSize: Fonts.sizes.xl, fontWeight: 'bold' },
  bodyLabel: { color: Colors.text.muted, fontSize: Fonts.sizes.xs },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingText: { color: Colors.text.primary, fontSize: Fonts.sizes.sm },
  settingSubDesc: { color: Colors.text.muted, fontSize: 10, marginTop: 1 },

  // Nuevos estilos de menús estéticos
  settingsList: {
    gap: 8,
    marginTop: 4,
  },
  settingCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F121E',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  settingTextCol: {
    flex: 1,
  },
  settingTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold',
  },
  settingSubtitle: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 1,
  },
  statusPillGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusPillGreenText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusPillGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  statusPillGoldText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusPillCyan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  statusPillCyanText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusTogglePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusTogglePillActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  statusToggleText: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusToggleTextActive: {
    color: '#A78BFA',
  },
  chevron: { color: Colors.text.muted, fontSize: Fonts.sizes.lg },
  signOutBtn: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    padding: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.brand.danger + '55',
  },
  signOutText: { color: Colors.brand.danger, fontWeight: 'bold' },
  // Protocolo Renacer
  rebirthCard: {
    backgroundColor: '#160E14',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  rebirthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'transparent',
  },
  rebirthIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rebirthTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  rebirthSubDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  rebirthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rebirthIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rebirthDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  rebirthBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  version: { color: Colors.text.muted, fontSize: Fonts.sizes.xs, textAlign: 'center' },
  // Modal de Equipamiento
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#0D0E1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    marginLeft: 10,
  },
  eqOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131525',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  eqOptionCardSelected: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  eqOptionEmoji: {
    fontSize: 26,
  },
  eqOptionLabel: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  eqOptionLabelSelected: {
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  eqOptionDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  modalFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  saveEqBtn: {
    backgroundColor: '#00F0FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveEqBtnText: {
    color: '#0A0A0F',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#131525',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  // Modal de Edición de Perfil
  editProfileBox: {
    backgroundColor: '#0D0E1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    maxHeight: '90%',
  },
  avatarPreviewCenter: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarPreviewGlow: {
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarPreviewHint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
  },
  photoActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#131525',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  photoActionBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600',
  },
  photoActionRemoveBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  photoActionRemoveBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  inputSectionLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#131525',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetChipEmoji: {
    fontSize: 16,
  },
  presetChipLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131525',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  // Título Semanal Otorgado Card
  titleDisplayCard: {
    width: '100%',
    backgroundColor: '#0D0E18',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  titleDisplayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleDisplayTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  titleDisplayTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  titleAutoText: {
    color: Colors.text.muted,
    fontSize: 10,
  },
  titleMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 6,
  },
  titleEmoji: {
    fontSize: 26,
  },
  titleName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  titleCriteria: {
    color: Colors.text.secondary,
    fontSize: 11,
    marginTop: 1,
  },
  titleLore: {
    color: Colors.text.muted,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  tagTextMuted: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  smartwatchProfileConnected: {
    backgroundColor: '#0A0E17',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 4,
  },
  smartwatchProfileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  smartwatchProfileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  smartwatchProfileBrandName: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  smartwatchProfileBattery: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  smartwatchProfileProtocol: {
    color: Colors.text.muted,
    fontSize: 10,
    marginBottom: 8,
  },
  smartwatchProfileStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  smartwatchProfileStatText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '500',
  },
  smartwatchProfileUnconnected: {
    paddingVertical: 4,
  },
  smartwatchProfileUnconnectedText: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  smartwatchBrandsLogosRow: {
    flexDirection: 'row',
    gap: 6,
  },
  brandBadgePill: {
    backgroundColor: '#161D2B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
});
