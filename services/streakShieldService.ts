import AsyncStorage from '@react-native-async-storage/async-storage';
import { Haptics } from './haptics';

const SHIELD_STORAGE_PREFIX = '@fitrise_streak_shields_';
const SHIELD_ACTIVATED_TODAY_PREFIX = '@fitrise_shield_activated_today_';
const MAX_SHIELDS = 3;

export class StreakShieldService {
  /**
   * Obtiene la cantidad de escudos disponibles para el usuario.
   * Si es la primera vez que se consulta, se le otorga 1 escudo de bienvenida al Cazador.
   */
  static async getShieldCount(uid: string): Promise<number> {
    try {
      const key = `${SHIELD_STORAGE_PREFIX}${uid}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw === null) {
        // Otorgar 1 escudo de bienvenida por defecto
        await AsyncStorage.setItem(key, '1');
        return 1;
      }
      return parseInt(raw, 10) || 0;
    } catch {
      return 1;
    }
  }

  /**
   * Concede escudos al usuario (hasta un máximo de 3)
   */
  static async awardShield(uid: string, count: number = 1): Promise<number> {
    try {
      const current = await this.getShieldCount(uid);
      const updated = Math.min(MAX_SHIELDS, current + count);
      const key = `${SHIELD_STORAGE_PREFIX}${uid}`;
      await AsyncStorage.setItem(key, String(updated));
      return updated;
    } catch {
      return 1;
    }
  }

  /**
   * Consume un escudo protector para salvar la racha del usuario ante un día perdido.
   * Retorna true si se consumió con éxito, false si no había escudos disponibles.
   */
  static async consumeShield(uid: string, dateKey: string): Promise<boolean> {
    try {
      const current = await this.getShieldCount(uid);
      if (current <= 0) return false;

      const updated = current - 1;
      const key = `${SHIELD_STORAGE_PREFIX}${uid}`;
      const activatedKey = `${SHIELD_ACTIVATED_TODAY_PREFIX}${uid}_${dateKey}`;

      await Promise.all([
        AsyncStorage.setItem(key, String(updated)),
        AsyncStorage.setItem(activatedKey, 'true'),
      ]);

      Haptics.triumph();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica si hoy se activó un escudo protector
   */
  static async wasShieldActivatedToday(uid: string, dateKey: string): Promise<boolean> {
    try {
      const activatedKey = `${SHIELD_ACTIVATED_TODAY_PREFIX}${uid}_${dateKey}`;
      const val = await AsyncStorage.getItem(activatedKey);
      return val === 'true';
    } catch {
      return false;
    }
  }
}
