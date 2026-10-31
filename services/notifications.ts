import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = '@fitrise_notifications_enabled';

// Configurar el comportamiento de notificaciones para Expo SDK 58
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Directivas Tácticas CORTEX',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00F0FF',
        sound: 'default',
      });
    } catch {
      // Ignorar de forma segura en Expo Go o entornos sin soporte nativo de canales
    }
  }
}

export async function scheduleWorkoutAlarm(
  hour: number,
  minute: number,
  planTitle: string
): Promise<void> {
  try {
    await setupNotificationChannels();
    await cancelNotificationsByCategory('workout');

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚔️ HORA DE ENTRENAR: CORTEX',
        body: `Tu circuito de "${planTitle}" está listo. La disciplina supera a la motivación.`,
        data: { category: 'workout' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch (err) {
    console.warn('Error programando alarma de entrenamiento:', err);
  }
}

export async function scheduleHydrationReminders(enabled: boolean): Promise<void> {
  try {
    await cancelNotificationsByCategory('hydration');
    if (!enabled) return;
    await setupNotificationChannels();

    const hours = [11, 15, 18];
    for (const h of hours) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 VITALIDAD CELULAR CORTEX',
          body: 'Tu rendimiento muscular requiere agua. Registra tu hidratación para ganar +10 XP.',
          data: { category: 'hydration' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: 0,
        },
      });
    }
  } catch (err) {
    console.warn('Error programando recordatorios de agua:', err);
  }
}

export async function scheduleQuestsReminder(
  enabled: boolean,
  hour: number = 20,
  minute: number = 0
): Promise<void> {
  try {
    await cancelNotificationsByCategory('quests');
    if (!enabled) return;
    await setupNotificationChannels();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 DIRECTIVAS DIARIAS PENDIENTES',
        body: 'Quedan pocas horas antes de medianoche. Completa tus misiones para no entrar en la Zona de Castigo.',
        data: { category: 'quests' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch (err) {
    console.warn('Error programando recordatorio de misiones:', err);
  }
}

export async function cancelNotificationsByCategory(category: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (item.content.data?.category === category) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch (err) {
    console.warn('Error cancelando notificaciones por categoría:', err);
  }
}

export async function sendTestNotification(
  title: string = '⚡ SISTEMA CORTEX ACTIVO',
  body: string = 'Telemetría y canal de directivas tácticas sincronizados con éxito.'
): Promise<void> {
  try {
    await setupNotificationChannels();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { category: 'test' },
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('Error enviando notificación de prueba:', err);
  }
}

class NotificationsService {
  public async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(granted));
      return granted;
    } catch (e) {
      console.warn('Error solicitando permisos:', e);
      return false;
    }
  }

  public async isEnabled(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      if (stored !== null) return stored === 'true';
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  public async scheduleDailyDirectives(): Promise<void> {
    const enabled = await this.isEnabled();
    if (!enabled) return;

    await scheduleWorkoutAlarm(8, 30, 'Programa del Cazador');
    await scheduleHydrationReminders(true);
    await scheduleQuestsReminder(true, 20, 30);
  }

  public async sendImmediateNotification(title: string, body: string): Promise<void> {
    await sendTestNotification(title, body);
  }

  public async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
  }
}

export const CORTEXNotifications = new NotificationsService();
