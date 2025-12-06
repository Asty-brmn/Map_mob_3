import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ActiveNotification, MarkerData } from '../../types';

/**
 * Менеджер локальных уведомлений
 */
export class NotificationManager {
  private activeNotifications: Map<number, ActiveNotification> = new Map();
  private notificationPermission: boolean = false;

  constructor() {
    this.configureNotifications();
  }

  /**
   * Настройка уведомлений для Expo Go
   */
  private async configureNotifications(): Promise<void> {
    try {
      console.log('🔔 Настраиваем локальные уведомления для Expo Go...');
      
      // 1. Запрашиваем разрешения
      const { status } = await Notifications.requestPermissionsAsync();
      this.notificationPermission = status === 'granted';
      
      console.log('🔔 Разрешение на уведомления:', this.notificationPermission);
      
      if (this.notificationPermission) {
        if (Platform.OS === 'android') {
          try {
            // Создаем канал уведомлений 
            await Notifications.setNotificationChannelAsync('proximity-alerts', {
              name: 'Уведомления о приближении',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
              enableVibrate: false, // Без вибрации
              lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
              bypassDnd: true,
              showBadge: true,
            });
            console.log('✅ Канал уведомлений создан');
          } catch (error) {
            console.log('⚠️ Канал уже существует или ошибка создания');
          }
        }
        
        // 3. Настраиваем обработчик уведомлений 
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false, 
            shouldSetBadge: false,
            shouldShowBanner: true, 
            shouldShowList: true,   
            priority: Notifications.AndroidNotificationPriority.MAX,
          }),
        });
        
        console.log('✅ Локальные уведомления настроены для Expo Go');
      }
    } catch (error) {
      console.error('❌ Ошибка настройки уведомлений:', error);
    }
  }

  /**
   * Проверка разрешения на уведомления
   */
  async checkPermission(): Promise<boolean> {
    if (!this.notificationPermission) {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        this.notificationPermission = status === 'granted';
      } catch (error) {
        console.log('⚠️ Ошибка проверки разрешений:', error);
      }
    }
    return this.notificationPermission;
  }

  /**
   * Показать локальное уведомление
   */
  async showNotification(marker: MarkerData): Promise<void> {
    try {
      console.log(`🔔 Пытаемся показать локальное уведомление для маркера ${marker.id}`);
      
      // Проверяем разрешение
      if (!this.notificationPermission) {
        console.log('⚠️ Нет разрешения на уведомления');
        return;
      }

      // Проверяем дубликаты
      if (this.activeNotifications.has(marker.id)) {
        console.log(`⚠️ Уведомление для маркера ${marker.id} уже активно`);
        return;
      }

      // СОЗДАЕМ ЛОКАЛЬНОЕ УВЕДОМЛЕНИЕ
      console.log(`🔔 Создаем локальное уведомление: "${marker.title}"`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📍 Вы рядом с меткой!",
          body: `Вы приблизились к "${marker.title}"`,
          data: { markerId: marker.id },
          sound: false, // БЕЗ ЗВУКА
        },
        trigger: {
          channelId: 'proximity-alerts',
          seconds: 1, // Показываем через 1 секунду
          repeats: false,
        } as any,
      });
      
      console.log(`✅ Локальное уведомление показано для маркера ${marker.id}, ID: ${notificationId}`);

      // Сохраняем информацию
      this.activeNotifications.set(marker.id, {
        markerId: marker.id,
        notificationId: String(notificationId),
        timestamp: Date.now(),
      });

      // Автоматически удаляем запись через 5 минут
      setTimeout(() => {
        this.activeNotifications.delete(marker.id);
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error('❌ Ошибка показа локального уведомления:', error);
      
      // Если не сработало, показываем Alert
      Alert.alert(
        '📍 Вы рядом с меткой!',
        `Вы приблизились к "${marker.title}"`,
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Проверка, активно ли уведомление
   */
  hasActiveNotification(markerId: number): boolean {
    return this.activeNotifications.has(markerId);
  }

  /**
   * Удалить уведомление dismissNotificationAsync
   */
  async removeNotification(markerId: number): Promise<void> {
    try {
      const notification = this.activeNotifications.get(markerId);
      if (notification) {
        await Notifications.cancelScheduledNotificationAsync(notification.notificationId);
      }
      this.activeNotifications.delete(markerId);
      console.log(`🔕 Уведомление удалено для маркера ${markerId}`);
    } catch (error) {
      console.error('❌ Ошибка удаления уведомления:', error);
    }
  }

  /**
   * Очистить все уведомления
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.activeNotifications.clear();
      console.log('🔕 Все уведомления очищены');
    } catch (error) {
      console.error('❌ Ошибка очистки уведомлений:', error);
    }
  }
}

export const notificationManager = new NotificationManager();