import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class CortexVoiceService {
  private selectedVoiceIdentifier: string | null = null;
  private isInitialized = false;

  /**
   * Inicializa y detecta la mejor voz natural humana disponible en el dispositivo
   */
  async init() {
    if (this.isInitialized) return;
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (voices && voices.length > 0) {
        // Buscar voces en español con mayor calidad / naturales
        // En Android suelen llamarse "-network", "high", o "es-es", "es-us", "es-mx"
        const spanishVoices = voices.filter(
          (v) =>
            v.language &&
            (v.language.startsWith('es') || v.language.includes('spa'))
        );

        // Priorizar voces naturales / neurales / de red de alta calidad
        const bestVoice =
          spanishVoices.find((v) =>
            v.identifier.toLowerCase().includes('network') ||
            v.identifier.toLowerCase().includes('enhanced') ||
            v.quality === Speech.VoiceQuality.Enhanced
          ) ||
          spanishVoices.find((v) =>
            v.language.includes('es-ES') || v.language.includes('es-MX') || v.language.includes('es-US')
          ) ||
          spanishVoices[0];

        if (bestVoice) {
          this.selectedVoiceIdentifier = bestVoice.identifier;
        }
      }
    } catch (err) {
      console.warn('CortexVoice: no se pudieron listar las voces, usando fallback estándar:', err);
    } finally {
      this.isInitialized = true;
    }
  }

  /**
   * Limpia el texto de emojis, marcas de agua y markdown para que la voz
   * suene fluida, conversacional y humana (evita que el motor pronuncie símbolos o asteriscos)
   */
  private cleanTextForHumanSpeech(text: string): string {
    return text
      // Eliminar markdown en negrita, cursiva, títulos
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/#+\s*/g, '')
      .replace(/`[^`]*`/g, '')
      // Eliminar emojis para que no los lea de forma robótica ("espada cruzada", "fuego", etc.)
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu,
        ''
      )
      // Ajustar pausas naturales
      .replace(/•/g, ', ')
      .replace(/\.{2,}/g, '.')
      .replace(/,\s*,+/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private currentSafetyTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Reproduce el mensaje con tono humano, cálido y modulado
   */
  async speak(
    text: string,
    options?: {
      onStart?: () => void;
      onDone?: () => void;
      onError?: (error: any) => void;
      rate?: number;
      pitch?: number;
    }
  ) {
    if (!this.isInitialized) {
      await this.init();
    }

    // Detener cualquier habla y temporizador previo
    await this.stop();

    const naturalText = this.cleanTextForHumanSpeech(text);
    if (!naturalText) {
      options?.onDone?.();
      return;
    }

    // Parámetros calibrados para entonación humana natural
    const naturalPitch = options?.pitch ?? 1.01;
    const naturalRate = options?.rate ?? (Platform.OS === 'android' ? 0.98 : 1.0);

    let callbackExecuted = false;

    const safeOnDone = () => {
      if (callbackExecuted) return;
      callbackExecuted = true;
      if (this.currentSafetyTimer) {
        clearTimeout(this.currentSafetyTimer);
        this.currentSafetyTimer = null;
      }
      options?.onDone?.();
    };

    const safeOnError = (err: any) => {
      if (callbackExecuted) return;
      callbackExecuted = true;
      if (this.currentSafetyTimer) {
        clearTimeout(this.currentSafetyTimer);
        this.currentSafetyTimer = null;
      }
      if (options?.onError) {
        options.onError(err);
      } else {
        options?.onDone?.();
      }
    };

    // Temporizador de seguridad generoso y calibrado al ritmo del habla humana:
    // Solo se activa como red de rescate si el motor nativo de Android TTS no devuelve el evento onDone.
    // Tasa humana en español: ~12-14 caracteres/seg. Calculamos tiempo suficiente + 4s de margen.
    const maxAllowedMs = Math.max(Math.round(naturalText.length * 110) + 4000, 4500);
    this.currentSafetyTimer = setTimeout(() => {
      safeOnDone();
    }, maxAllowedMs);

    const speechOptions: Speech.SpeechOptions = {
      language: 'es-ES',
      pitch: naturalPitch,
      rate: naturalRate,
      volume: 1.0,
      onStart: options?.onStart,
      onDone: safeOnDone,
      onError: safeOnError,
    };

    if (this.selectedVoiceIdentifier) {
      speechOptions.voice = this.selectedVoiceIdentifier;
    }

    try {
      Speech.speak(naturalText, speechOptions);
    } catch (err) {
      console.warn('CortexVoice speak error:', err);
      safeOnError(err);
    }
  }

  async stop() {
    if (this.currentSafetyTimer) {
      clearTimeout(this.currentSafetyTimer);
      this.currentSafetyTimer = null;
    }
    try {
      await Speech.stop();
    } catch {}
  }

  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }
}

export const CortexVoice = new CortexVoiceService();
