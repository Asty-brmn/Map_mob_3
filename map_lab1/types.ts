import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

/**
 * Интерфейс для географических координат
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Интерфейс для данных изображения маркера
 */
export interface MarkerImage {
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
}

/**
 * Интерфейс для данных маркера
 */
export interface MarkerData {
  id: number;
  title: string;
  coordinate: Coordinate;
  images: MarkerImage[];
  created_at: string;
}

/**
 * Тип для параметров навигации к экрану деталей маркера
 */
export type MarkerDetailsParams = {
  id: string;
};

/**
 * Интерфейс для ошибок при выборе изображений
 */
export interface ImagePickerError {
  code: string;
  message: string;
  exception?: any;
}

/**
 * Интерфейс для ошибок навигации
 */
export interface NavigationError {
  route: string;
  message: string;
}

/**
 * Интерфейс для ошибок базы данных
 */
export interface DatabaseError {
  code: string;
  message: string;
  sql?: string;
  exception?: any;
}

/**
 * Типы для навигации Expo Router
 */
export type RootStackParamList = {
  index: undefined;
  'marker/[id]': { id: string };
};

// =========== ТИПЫ ДЛЯ ГЕОЛОКАЦИИ ===========

/**
 * Состояние геолокации пользователя
 */
export interface LocationState {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  permissionGranted: boolean;
}

/**
 * Конфигурация для отслеживания местоположения
 */
export interface LocationConfig {
  accuracy: Location.Accuracy;
  timeInterval: number;
  distanceInterval: number;
}

/**
 * Координаты пользователя для отображения на карте
 */
export interface UserLocation {
  latitude: number;
  longitude: number;
}

// =========== ТИПЫ ДЛЯ УВЕДОМЛЕНИЙ ===========

/**
 * Активное уведомление
 */
export interface ActiveNotification {
  markerId: number;
  notificationId: string;
  timestamp: number;
}

/**
 * Состояние менеджера уведомлений
 */
export interface NotificationManagerState {
  activeNotifications: Map<number, ActiveNotification>;
  permissionGranted: boolean;
}

/**
 * Контент для локального уведомления (БЕЗ ЗВУКА)
 */
export interface LocalNotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
  // ЗВУК УБРАН: sound?: boolean | string;
}

// =========== КОНСТАНТЫ ===========

/**
 * Порог приближения для уведомлений (в метрах)
 */
export const PROXIMITY_THRESHOLD = 100;

/**
 * Конфигурация по умолчанию для отслеживания местоположения
 */
export const DEFAULT_LOCATION_CONFIG: LocationConfig = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 5000,
  distanceInterval: 5,
};

// =========== РАСШИРЕННЫЙ ИНТЕРФЕЙС КОНТЕКСТА БАЗЫ ДАННЫХ ===========

/**
 * Расширенный интерфейс контекста базы данных с поддержкой геолокации и уведомлений
 */
export interface ExtendedDatabaseContextType {
  // Операции с маркерами
  addMarker: (latitude: number, longitude: number, title?: string) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<MarkerData[]>;
  getMarker: (id: number) => Promise<MarkerData | null>;
  
  // Операции с изображениями
  addImage: (markerId: number, uri: string) => Promise<number>;
  deleteImage: (id: number) => Promise<void>;
  getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;
  
  // Геолокация и уведомления
  locationState: LocationState;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  getNearbyMarkers: (radius?: number) => Promise<MarkerData[]>;
  
  // Статусы
  isLoading: boolean;
  error: DatabaseError | null;
  initializeDatabase: () => Promise<void>;
}

/**
 * Алиас для обратной совместимости
 */
export type DatabaseContextType = ExtendedDatabaseContextType;

// =========== ТИПЫ ДЛЯ КОМПОНЕНТОВ ===========

/**
 * Пропсы для компонента Map с поддержкой геолокации
 */
export interface MapPropsWithLocation {
  markers: MarkerData[];
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onMapLongPress: (event: any) => void;
  onMarkerPress: (marker: MarkerData) => void;
  isAddingMarker?: boolean;
  userLocation?: UserLocation | null;
  showProximityZones?: boolean;
}

/**
 * Пропсы для компонента ImageList
 */
export interface ImageListProps {
  images: MarkerImage[];
  onDeleteImage: (imageId: number) => void;
  onAddImage: () => void;
  isAddingImage?: boolean;
  markerTitle?: string;
}

/**
 * Пропсы для компонента MarkerList
 */
export interface MarkerListProps {
  markers: MarkerData[];
  selectedMarker: MarkerData | null;
  onMarkerSelect: (marker: MarkerData) => void;
  onMarkerDelete: (marker: MarkerData) => void;
  onShowDetails: (marker: MarkerData) => void;
}

// =========== ТИПЫ ДЛЯ СЕРВИСОВ ===========

/**
 * Интерфейс сервиса геолокации
 */
export interface LocationServiceInterface {
  requestPermissions(): Promise<boolean>;
  getCurrentLocation(): Promise<Location.LocationObject | null>;
  startTracking(
    markers: MarkerData[],
    onLocationUpdate?: (location: Location.LocationObject) => void
  ): Promise<void>;
  stopTracking(): void;
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
  updateMarkers(markers: MarkerData[]): void;
  getState(): LocationState;
  cleanup(): void;
}

/**
 * Интерфейс менеджера уведомлений (БЕЗ ЗВУКА)
 */
export interface NotificationManagerInterface {
  checkPermission(): Promise<boolean>;
  showNotification(marker: MarkerData): Promise<void>;
  removeNotification(markerId: number): Promise<void>;
  clearAllNotifications(): Promise<void>;
  hasActiveNotification(markerId: number): boolean;
  getActiveNotificationsCount(): number;
}

/**
 * Конфигурация уведомлений для Android (БЕЗ ЗВУКА)
 */
export const ANDROID_NOTIFICATION_CONFIG = {
  channelId: 'proximity-alerts',
  channelName: 'Уведомления о приближении',
  importance: Notifications.AndroidImportance.HIGH,
  enableVibrate: false, // Без вибрации
  // ЗВУК УБРАН
} as const;

// В интерфейсе NotificationManagerInterface добавьте:
export interface NotificationManagerInterface {
  checkPermission(): Promise<boolean>; // ✅ Убедитесь, что этот метод есть
  showNotification(marker: MarkerData): Promise<void>;
  removeNotification(markerId: number): Promise<void>;
  clearAllNotifications(): Promise<void>;
  hasActiveNotification(markerId: number): boolean;
  getActiveNotificationsCount(): number;
}