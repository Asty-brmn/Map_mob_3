import { useEffect } from 'react';
import { Stack } from "expo-router";
import { DatabaseProvider } from '../app/contexts/DatabaseContext';
import * as Notifications from 'expo-notifications';

/**
 * Настраивает навигацию и предоставляет контексты
 */
export default function RootLayout() {
  //уведомления при загрузке приложения
  useEffect(() => {
    let notificationSubscription: Notifications.Subscription;
    let responseSubscription: Notifications.Subscription;

    const setupNotifications = async () => {
      try {
        //обработчик нажатий на уведомления
        responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          if (data?.markerId) {
            // Здесь можно добавить навигацию к маркеру при нажатии на уведомление
            console.log('🔔 Нажато уведомление для маркера:', data.markerId);
          }
        });

        // Слушаем входящие уведомления
        notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
          console.log('🔔 Получено уведомление:', notification.request.content.title);
        });

        console.log('🔔 Уведомления настроены');
      } catch (error) {
        console.error('❌ Ошибка настройки уведомлений:', error);
      }
    };

    setupNotifications();

    return () => {
      // Очищаем слушатели при размонтировании
      if (responseSubscription) {
        responseSubscription.remove();
      }
      if (notificationSubscription) {
        notificationSubscription.remove();
      }
    };
  }, []);

  return (
    <DatabaseProvider>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Карта маркеров',
            headerStyle: {
              backgroundColor: '#bd70f0ff',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        
        <Stack.Screen 
          name="marker/[id]" 
          options={{ 
            title: 'Детали маркера',
            headerStyle: {
              backgroundColor: '#71a7e0ff',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
      </Stack>
    </DatabaseProvider>
  );
}