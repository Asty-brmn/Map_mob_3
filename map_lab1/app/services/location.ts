import * as Location from 'expo-location';
import { LocationConfig, LocationState, PROXIMITY_THRESHOLD } from '../../types';
import { notificationManager } from './notifications';
import { MarkerData } from '../../types';

/**
 * Сервис для работы с геолокацией
 */
export class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private locationState: LocationState = {
    location: null,
    errorMsg: null,
    permissionGranted: false,
  };
  private config: LocationConfig;
  private onLocationUpdate?: (location: Location.LocationObject) => void;
  private markers: MarkerData[] = [];

  constructor(config: LocationConfig) {
    this.config = config;
  }

  /**
   * Запрос разрешения на доступ к местоположению
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('📍 Запрос разрешения на доступ к местоположению...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      
      this.locationState.permissionGranted = granted;
      
      if (granted) {
        console.log('✅ Разрешение на местоположение получено');
        this.locationState.errorMsg = null;
      } else {
        this.locationState.errorMsg = 'Доступ к местоположению не разрешён';
        console.warn('⚠️ Разрешение на местоположение не получено');
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Ошибка запроса разрешения:', error);
      this.locationState.errorMsg = 'Ошибка при запросе разрешения';
      return false;
    }
  }

  /**
   * Получить текущее местоположение (однократно)
   */
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: this.config.accuracy,
      });
      
      this.locationState.location = location;
      console.log('📍 Текущее местоположение получено:', location.coords);
      
      return location;
    } catch (error) {
      console.error('❌ Ошибка получения местоположения:', error);
      this.locationState.errorMsg = 'Не удалось получить местоположение';
      return null;
    }
  }

  /**
   * Начать отслеживание местоположения
   */
  async startTracking(
    markers: MarkerData[],
    onLocationUpdate?: (location: Location.LocationObject) => void
  ): Promise<void> {
    try {
      console.log('📍 Начало отслеживания местоположения...');
      
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        throw new Error('Нет разрешения на доступ к местоположению');
      }

      this.markers = markers;
      this.onLocationUpdate = onLocationUpdate;

      // Запускаем отслеживание
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: this.config.accuracy,
          timeInterval: this.config.timeInterval,
          distanceInterval: this.config.distanceInterval,
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      console.log('📍 Отслеживание местоположения запущено');
    } catch (error) {
      console.error('❌ Ошибка запуска отслеживания:', error);
      throw error;
    }
  }

  /**
   * Остановить отслеживание местоположения
   */
  stopTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      console.log('📍 Отслеживание местоположения остановлено');
    }
  }

  /**
   * Обработка обновления местоположения
   */
  private handleLocationUpdate(location: Location.LocationObject): void {
    console.log('📍 Обновление местоположения:', location.coords);
    
    this.locationState.location = location;
    
    // Вызываем callback, если он установлен
    if (this.onLocationUpdate) {
      this.onLocationUpdate(location);
    }
    
    // Проверяем приближение к маркерам
    this.checkProximityToMarkers(location);
  }

  /**
   * Проверка приближения к маркерам
   */
  private checkProximityToMarkers(userLocation: Location.LocationObject): void {
    const userCoords = userLocation.coords;
    
    this.markers.forEach(marker => {
      const distance = this.calculateDistance(
        userCoords.latitude,
        userCoords.longitude,
        marker.coordinate.latitude,
        marker.coordinate.longitude
      );

      console.log(`📍 Расстояние до маркера ${marker.id} (${marker.title}): ${distance.toFixed(2)} м`);

      if (distance <= PROXIMITY_THRESHOLD) {
        // Пользователь вблизи маркера
        if (!notificationManager.hasActiveNotification(marker.id)) {
          console.log(`📍 Пользователь приблизился к маркеру ${marker.id} (${distance.toFixed(2)} м)`);
          notificationManager.showNotification(marker);
        }
      } else {
        // Пользователь вышел из зоны маркера
        if (notificationManager.hasActiveNotification(marker.id)) {
          console.log(`📍 Пользователь вышел из зоны маркера ${marker.id}`);
          notificationManager.removeNotification(marker.id);
        }
      }
    });
  }

  /**
   * Расчет расстояния между двумя точками (формула Хаверсина)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Радиус Земли в метрах
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Расстояние в метрах
  }

  /**
   * Проверка разрешения
   */
  private async checkPermission(): Promise<boolean> {
    if (!this.locationState.permissionGranted) {
      return await this.requestPermissions();
    }
    return true;
  }

  /**
   * Получить текущее состояние
   */
  getState(): LocationState {
    return { ...this.locationState };
  }

  /**
   * Обновить список маркеров для отслеживания
   */
  updateMarkers(markers: MarkerData[]): void {
    this.markers = markers;
    console.log(`📍 Обновлен список маркеров для отслеживания: ${markers.length}`);
    
    // Если есть текущее местоположение, проверяем сразу
    if (this.locationState.location) {
      this.checkProximityToMarkers(this.locationState.location);
    }
  }

  /**
   * Очистка ресурсов
   */
  cleanup(): void {
    this.stopTracking();
    this.locationState = {
      location: null,
      errorMsg: null,
      permissionGranted: false,
    };
  }
}

// Создаем глобальный экземпляр сервиса геолокации
export const locationService = new LocationService({
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 5000,
  distanceInterval: 5,
});

