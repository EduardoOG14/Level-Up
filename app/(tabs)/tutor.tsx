import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendMessageToTutor, type ChatMessage, type UserContext } from '../../services/gemini';
import { useUserStore } from '../../stores/userStore';
import { useSmartwatchStore } from '../../stores/smartwatchStore';
import { useWaterStore } from '../../stores/waterStore';
import { useTitleStore } from '../../stores/titleStore';
import { usePenaltyStore } from '../../stores/penaltyStore';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { CortexAvatar } from '../../components/ai/CortexAvatar';
import { useCortexEnergyStore } from '../../stores/cortexEnergyStore';
import { CortexKeyModal } from '../../components/ai/CortexKeyModal';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: '⚔️ Rutina de Combate', message: 'CORTEX, formula una sesión de entrenamiento de alta intensidad adaptada a mis atributos actuales.' },
  { label: '🥗 Protocolo Nutricional', message: 'CORTEX, analiza mi perfil y dame las directivas clave de nutrición y proteína para hoy.' },
  { label: '📊 Diagnóstico de Atributos', message: 'CORTEX, evalúa mis stats de Fuerza, Agilidad y Vitalidad. ¿Cuál es mi eslabón débil a corregir?' },
  { label: '⚡ Recuperación Neural', message: 'Siento fatiga acumulada. Dame una estrategia de recuperación activa para no perder el ritmo.' },
];

export default function TutorScreen() {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'model',
      content: `Enlace neural establecido, Cazador ${user?.name || ''}. 🧠⚡\n\nSoy **CORTEX**, tu Inteligencia Táctica de Alto Rendimiento. Estoy conectada a tu telemetría física, tus stats y tu registro de combate.\n\n¿Cuál es tu objetivo para la sesión de hoy?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<any>(null);

  const { brand: watchBrand, deviceName: watchDeviceName, isConnected: isWatchConnected, metrics: watchMetrics } = useSmartwatchStore();
  const { currentMl, targetMl } = useWaterStore();
  const { currentTitle } = useTitleStore();
  const { isPenaltyActive } = usePenaltyStore();
  const { dailyManaRemaining, isUnlimited, initialize: initEnergy } = useCortexEnergyStore();
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Pulso continuo del Sistema Solo Leveling
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const liveScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  useEffect(() => {
    initEnergy();
  }, [initEnergy]);

  const userContext: UserContext | null = user
    ? {
        name: user.name,
        level: user.level,
        rank: user.rank,
        totalXP: user.totalXP,
        stats: user.stats,
        streak: user.streak,
        goals: user.goals,
        fitnessLevel: user.fitnessLevel,
        equipment: user.equipment,
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        kneeFriendly: user.kneeFriendly,
        bmi: user.weight && user.height ? user.weight / Math.pow(user.height / 100, 2) : undefined,
        activeTitle: currentTitle?.name,
        penaltyActive: isPenaltyActive,
        waterIntakeMl: currentMl,
        waterTargetMl: targetMl,
        smartwatch: isWatchConnected && watchBrand ? {
          brand: watchBrand,
          deviceName: watchDeviceName || watchBrand,
          steps: watchMetrics.steps,
          stepGoal: watchMetrics.stepGoal,
          heartRate: watchMetrics.currentHeartRate,
          restingHeartRate: watchMetrics.restingHeartRate,
          activeCalories: watchMetrics.activeCalories,
          sleepHours: watchMetrics.sleepHours,
          readinessScore: watchMetrics.readinessScore,
          stressLevel: watchMetrics.stressLevel,
        } : undefined,
      }
    : null;

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !userContext || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history: ChatMessage[] = messages
        .filter((m) => m.id !== '0')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await sendMessageToTutor(text, userContext, history);

      const cortexMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, cortexMsg]);
    } catch (err: any) {
      if (err?.message === 'MANA_DEPLETED') {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content:
              '⚡ **Maná Neural Agotado por Hoy (0/5)**\n\nHas consumido tus 5 consultas gratuitas diarias de CORTEX. Se recargarán automáticamente a medianoche.\n\n👑 **¿Deseas consultas 100% ilimitadas y gratuitas?**\nToca el botón superior de Maná para vincular tu propia clave gratuita de Google Gemini (Google AI Studio) en 1 minuto.',
            timestamp: new Date(),
          },
        ]);
        setShowKeyModal(true);
      } else if (err?.message === 'INVALID_PERSONAL_KEY') {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content:
              '⚠️ **Error de Autenticación Neural**\n\nTu clave personal de Google Gemini no fue aceptada o ha expirado. Toca el botón superior para verificarla o actualizarla.',
            timestamp: new Date(),
          },
        ]);
        setShowKeyModal(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: 'Interferencia en la señal cuántica con el núcleo de CORTEX. Verifica la conexión y retransmite la consulta. 📡',
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header Estilo Solo Leveling HUD */}
      <View style={styles.header}>
        <CortexAvatar size="md" showPulse={true} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <View style={styles.titleRow}>
            <Text style={styles.cortexName}>[ CORTEX ]</Text>
            <View style={styles.tag}>
              <Animated.View style={[styles.statusDot, { transform: [{ scale: liveScale }] }]} />
              <Text style={styles.tagText}>ONLINE</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>[ ENLACE NEURAL CUÁNTICO ]</Text>
          </View>
        </View>

        {/* Botón de Maná / Modo Ilimitado */}
        <TouchableOpacity
          style={isUnlimited ? styles.manaBadgeUnlimited : styles.manaBadgeStandard}
          onPress={() => setShowKeyModal(true)}
          activeOpacity={0.75}
        >
          <Ionicons
            name={isUnlimited ? 'key' : 'flash'}
            size={12}
            color={isUnlimited ? '#F59E0B' : '#00F0FF'}
          />
          <Text style={isUnlimited ? styles.manaBadgeUnlimitedText : styles.manaBadgeStandardText}>
            {isUnlimited ? 'ILIMITADO' : `${dailyManaRemaining}/5 MANÁ`}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.cortexBubble]}>
              {msg.role === 'model' && (
                <View style={styles.avatarMini}>
                  <CortexAvatar size="sm" showPulse={false} />
                </View>
              )}
              <View style={[styles.bubbleContent, msg.role === 'user' ? styles.userContent : styles.cortexContent]}>
                <Text style={[styles.bubbleText, msg.role === 'user' && styles.userText]}>
                  {msg.content}
                </Text>
                <Text style={styles.bubbleTime}>{formatTime(msg.timestamp)}</Text>
              </View>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.bubble, styles.cortexBubble]}>
              <View style={styles.avatarMini}>
                <CortexAvatar size="sm" showPulse={true} />
              </View>
              <View style={[styles.bubbleContent, styles.cortexContent]}>
                <ActivityIndicator size="small" color="#06B6D4" />
                <Text style={styles.typingText}>CORTEX procesando telemetría neural...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActions}
          contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.base }}
        >
          {QUICK_ACTIONS.map((qa) => (
            <TouchableOpacity
              key={qa.label}
              style={styles.quickBtn}
              onPress={() => sendMessage(qa.message)}
              disabled={isLoading}
            >
              <Text style={styles.quickBtnText}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.textInput}
            placeholder="Consulta o directiva a CORTEX..."
            placeholderTextColor={Colors.text.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Text style={styles.sendIcon}>⚡</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CortexKeyModal
        visible={showKeyModal}
        onClose={() => setShowKeyModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: '#0F121E',
  },
  manaBadgeUnlimited: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  manaBadgeUnlimitedText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  manaBadgeStandard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  manaBadgeStandardText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cortexName: {
    color: '#00F0FF',
    fontSize: Fonts.sizes.base,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  tagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusText: { color: '#64748B', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  messageList: { flex: 1 },
  messageListContent: { padding: Spacing.base, gap: Spacing.md },
  bubble: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  userBubble: { flexDirection: 'row-reverse' },
  cortexBubble: {},
  avatarMini: {
    marginBottom: 4,
  },
  bubbleContent: {
    maxWidth: '82%',
    borderRadius: 18,
    padding: Spacing.md,
    gap: 5,
  },
  userContent: {
    backgroundColor: '#16192E',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  cortexContent: {
    backgroundColor: '#0F121E',
    borderBottomLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  bubbleText: { color: '#F1F5F9', fontSize: 13.5, lineHeight: 21 },
  userText: { color: '#FFFFFF' },
  bubbleTime: { color: '#64748B', fontSize: 10, alignSelf: 'flex-end' },
  typingText: { color: '#00F0FF', fontSize: 11, fontStyle: 'italic', marginLeft: Spacing.xs },
  quickActions: { maxHeight: 44, marginBottom: Spacing.sm },
  quickBtn: {
    backgroundColor: '#0F121E',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  quickBtnText: { color: '#00F0FF', fontSize: 11.5, fontWeight: 'bold' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.base,
    gap: Spacing.sm,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 240, 255, 0.25)',
    backgroundColor: '#0F121E',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#131525',
    borderRadius: 16,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    color: '#F8FAFC',
    fontSize: Fonts.sizes.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: '#00F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 20 },
});
