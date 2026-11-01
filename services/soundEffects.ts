import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Haptics } from './haptics';

const SOUND_ENABLED_KEY = '@fitrise_sound_effects_enabled';

class SoundEffectsService {
  private isEnabled: boolean = true;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const stored = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
    } catch {
      // Silencioso por defecto
    }
  }

  public async setEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    try {
      await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    } catch {
      // Ignorar error de persistencia
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public async toggleEnabled(): Promise<boolean> {
    const next = !this.isEnabled;
    await this.setEnabled(next);
    return next;
  }

  /**
   * Campana suave de inicio de estación o fin de descanso
   */
  public playChime() {
    if (!this.isEnabled) return;
    Haptics.medium();
  }

  /**
   * Fanfarria sutil de subida de nivel, logro desbloqueado o misión completada
   */
  public playLevelUp() {
    if (!this.isEnabled) return;
    Haptics.triumph();
  }

  /**
   * Tick sutil para conteo de segundos en cadencia
   */
  public playTick() {
    if (!this.isEnabled) return;
    Haptics.light();
  }

  /**
   * Sonido / respuesta táctil de gota de agua para registro de hidratación
   */
  public playWaterDrop() {
    if (!this.isEnabled) return;
    Haptics.light();
  }

  /**
   * Tono suave de notificación o inicio de briefing CORTEX
   */
  public playNotice() {
    if (!this.isEnabled) return;
    Haptics.light();
  }

  /**
   * Zumbido cibernético de advertencia o activación de Zona de Castigo
   */
  public playAlert() {
    if (!this.isEnabled) return;
    Haptics.heavy();
  }
}

export const SoundEffects = new SoundEffectsService();
