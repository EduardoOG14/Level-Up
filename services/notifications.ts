import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = '@fitrise_notifications_enabled';

// Configurar el comportamiento de notificaciones para Expo SDK 52 / SDK 58
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
      // 1. Canal principal de ALARMAS de entrenamiento (Máxima prioridad acústica y háptica)
      await Notifications.setNotificationChannelAsync('workout-alarms-v2', {
        name: 'Alarmas de Entrenamiento CORTEX',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500, 250, 500],
        lightColor: '#00F0FF',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });

      // 2. Canal de recordatorios de hidratación
      await Notifications.setNotificationChannelAsync('hydration-reminders-v2', {
        name: 'Recordatorios de Hidratación',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00F0FF',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      // 3. Canal de misiones diarias y racha de cazador
      await Notifications.setNotificationChannelAsync('daily-quests-v2', {
        name: 'Directivas Tácticas y Misiones Diarias',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      // 4. Canal por defecto de respaldo
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notificaciones del Sistema',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00F0FF',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    } catch (e) {
      console.warn('Error configurando canales de notificación Android:', e);
    }
  }
}

export async function scheduleWorkoutAlarm(
  hour: number,
  minute: number,
  planTitle: string,
  days?: number[]
): Promise<void> {
  try {
    await setupNotificationChannels();
    await cancelNotificationsByCategory('workout');

    const effectiveDays = days && days.length > 0 ? days : [1, 2, 3, 4, 5, 6, 0];
    const isEveryDay = effectiveDays.length >= 7;

    const notificationContent: Notifications.NotificationContentInput = {
      title: '⚔️ HORA DE ENTRENAR: CORTEX',
      body: `Tu circuito de "${planTitle}" está listo. La disciplina supera a la motivación.`,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 500, 250, 500, 250, 500],
      data: { category: 'workout' },
    };

    if (isEveryDay) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'workout-alarms-v2',
            delivery: 'alarmClock',
          },
        });
      } catch {
        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'workout-alarms-v2',
          },
        });
      }
    } else {
      for (const dayId of effectiveDays) {
        // En Expo WeeklyTriggerInput: 1 = Domingo, 2 = Lunes, ..., 7 = Sábado
        const expoWeekday = dayId === 0 ? 1 : dayId + 1;
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              ...notificationContent,
              data: { category: 'workout', dayId },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: expoWeekday,
              hour,
              minute,
              channelId: 'workout-alarms-v2',
              delivery: 'alarmClock',
            },
          });
        } catch {
          await Notifications.scheduleNotificationAsync({
            content: {
              ...notificationContent,
              data: { category: 'workout', dayId },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: expoWeekday,
              hour,
              minute,
              channelId: 'workout-alarms-v2',
            },
          });
        }
      }
    }
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
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
          data: { category: 'hydration' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: 0,
          channelId: 'hydration-reminders-v2',
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
        body: 'Quedan pocas horas antes de medianoche. Completa tus misiones para proteger tu racha.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        data: { category: 'quests' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'daily-quests-v2',
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
  await setupNotificationChannels();
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 500, 250, 500, 250, 500],
      data: { category: 'test' },
    },
    trigger: {
      channelId: 'workout-alarms-v2',
    },
  });
}

class NotificationsService {
  public async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(granted));
      if (granted) {
        await setupNotificationChannels();
      }
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

    try {
      const storedSettings = await AsyncStorage.getItem('@fitrise_plan_alarm_settings');
      let hour = 8;
      let minute = 0;
      let days = [1, 2, 3, 4, 5, 6, 0];
      let isAlarmEnabled = true;
      let hydration = true;
      let quests = true;

      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (typeof parsed.hour === 'number') hour = parsed.hour;
        if (typeof parsed.minute === 'number') minute = parsed.minute;
        if (Array.isArray(parsed.days)) days = parsed.days;
        if (typeof parsed.enabled === 'boolean') isAlarmEnabled = parsed.enabled;
        if (typeof parsed.hydrationReminder === 'boolean') hydration = parsed.hydrationReminder;
        if (typeof parsed.questsReminder === 'boolean') quests = parsed.questsReminder;
      }

      if (isAlarmEnabled) {
        const storedPlan = await AsyncStorage.getItem('@fitrise_active_plan_id');
        const planTitle = storedPlan ? 'Entrenamiento del Cazador' : 'Directiva Diaria';
        await scheduleWorkoutAlarm(hour, minute, planTitle, days);
      }

      await scheduleHydrationReminders(hydration);
      await scheduleQuestsReminder(quests, 20, 0);
    } catch (e) {
      console.warn('Error en scheduleDailyDirectives:', e);
    }
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
