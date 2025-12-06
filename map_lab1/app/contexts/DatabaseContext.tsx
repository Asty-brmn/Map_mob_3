// contexts/DatabaseContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { databaseService } from '../database/sqlite';
import { DatabaseContextType, MarkerData, MarkerImage, DatabaseError, LocationState } from '../../types';
import { locationService } from '../services/location';
import { notificationManager } from '../services/notifications';
import { PROXIMITY_THRESHOLD } from '../../types';

/**
 * Создание контекста базы данных
 */
const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

/**
 * Провайдер контекста базы данных
 * Обеспечивает доступ к операциям с базой данных во всем приложении
 */
export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<DatabaseError | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [locationState, setLocationState] = useState<LocationState>({
    location: null,
    errorMsg: null,
    permissionGranted: false,
  });

  /**
   * Инициализация базы данных при монтировании компонента
   */
  useEffect(() => {
    console.log('🏁 DatabaseProvider mounted - initializing database');
    initializeDatabase();
    
    // Очистка при размонтировании
    return () => {
      console.log('🧹 DatabaseProvider unmounted - closing database');
      databaseService.close();
      locationService.stopTracking();
    };
  }, []);

  /**
   * Инициализация базы данных
   */
  const initializeDatabase = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🚀 Starting database initialization...');
      await databaseService.initialize();
      console.log('🎊 Database initialization completed successfully');
    } catch (err) {
      const dbError: DatabaseError = {
        code: 'INIT_FAILED',
        message: 'Не удалось инициализировать базу данных',
        exception: err
      };
      setError(dbError);
      console.error('💥 Database initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Добавление нового маркера
   */
  const addMarker = async (latitude: number, longitude: number, title?: string): Promise<number> => {
    try {
      setError(null);
      console.log(`📍 Adding marker at ${latitude}, ${longitude}`);
      const markerId = await databaseService.addMarker(latitude, longitude, title);
      
      // Обновляем локальные маркеры
      await loadMarkersFromDatabase();
      
      return markerId;
    } catch (err) {
      const dbError: DatabaseError = {
        code: 'ADD_MARKER_FAILED',
        message: 'Не удалось добавить маркер',
        exception: err
      };
      setError(dbError);
      throw err;
    }
  };

  /**
   * Удаление маркера
   */
  const deleteMarker = async (id: number): Promise<void> => {
    try {
      setError(null);
      console.log(`🗑️ Deleting marker ${id}`);
      await databaseService.deleteMarker(id);
      
      // Удаляем возможное уведомление для этого маркера
      await notificationManager.removeNotification(id);
      
      // Обновляем локальные маркеры
      setMarkers(prev => prev.filter(marker => marker.id !== id));
    } catch (err) {
      const dbError: DatabaseError = {
        code: 'DELETE_MARKER_FAILED',
        message: 'Не удалось удалить маркер',
        exception: err
      };
      setError(dbError);
      throw err;
    }
  };

  /**
   * Получение всех маркеров
   */
  const getMarkers = async (): Promise<MarkerData[]> => {
    try {
      setError(null);
      console.log('📥 Fetching all markers from database');
      const markers = await databaseService.getMarkers();
      
      // Загружаем изображения для каждого маркера
      console.log('🖼️ Loading images for markers');
      const markersWithImages = await Promise.all(
        markers.map(async (marker) => {
          const images = await databaseService.getMarkerImages(marker.id);
          return {
            ...marker,
            images
          };
        })
      );
      
      console.log(`✅ Successfully loaded ${markersWithImages.length} markers with images`);
      setMarkers(markersWithImages);
      return markersWithImages;
    } catch (err) {
      const dbError: DatabaseError = {
        code: 'GET_MARKERS_FAILED',
        message: 'Не удалось загрузить маркеры',
        exception: err
      };
      setError(dbError);
      console.error('❌ Failed to get markers:', err);
      throw err;
    }
  };

  /**
   * Получение маркера по ID
   */
  const getMarker = async (id: number): Promise<MarkerData | null> => {
    try {
      setError(null);
      console.log(`🔍 Fetching marker ${id}`);
      const marker = await databaseService.getMarker(id);
      
      if (marker) {
        const images = await databaseService.getMarkerImages(id);
        return {
          ...marker,
          images
        };
      }
      
      return null;
    } catch (err) {
      const dbError: DatabaseError = {
        code: 'GET_MARKER_FAILED',
        message: 'Не удалось загрузить маркер',
        exception: err
      };
      setError(dbError);
      throw err;
    }
  };

  /**
   * Добавление изображения к маркеру
   */
  const addImage = async (markerId: number, uri: string): Promise<number> => {
    try {
      setError(null);
      console.log(`🖼️ Adding image to marker ${markerId}`);
      const imageId = await databaseService.addImage(markerId, uri);
      return imageId;
    } catch (err) {
      const dbError: DatabaseError = {
        code: 'ADD_IMAGE_FAILED',
        message: 'Не удалось добавить изображение',
        exception: err
      };
      setError(dbError);
      throw err;
    }
  };

  /**
   * Удаление изображения
   */
  const deleteImage = async (id: number): Promise<void> => {
    try {
      setError(null);
      console.log(`🗑️ Deleting image ${id}`);
      await databaseService.deleteImage(id);
    } catch (err) {
      const dbError: DatabaseError = {
        code: 'DELETE_IMAGE_FAILED',
        message: 'Не удалось удалить изображение',
        exception: err
      };
      setError(dbError);
      throw err;
    }
  };

  /**
   * Получение изображений маркера
   */
  const getMarkerImages = async (markerId: number): Promise<MarkerImage[]> => {
    try {
      setError(null);
      return await databaseService.getMarkerImages(markerId);
    } catch (err) {
      const dbError: DatabaseError = {
        code: 'GET_IMAGES_FAILED',
        message: 'Не удалось загрузить изображения',
        exception: err
      };
      setError(dbError);
      throw err;
    }
  };

  /**
   * Загрузка маркеров из базы данных (внутренняя функция)
   */
  const loadMarkersFromDatabase = async (): Promise<void> => {
    try {
      const loadedMarkers = await getMarkers();
      setMarkers(loadedMarkers);
      // Обновляем маркеры в сервисе геолокации
      locationService.updateMarkers(loadedMarkers);
    } catch (error) {
      console.error('❌ Ошибка загрузки маркеров:', error);
    }
  };

  /**
   * Запуск отслеживания местоположения
   */
  const startLocationTracking = async (): Promise<void> => {
    try {
      console.log('📍 Запуск отслеживания местоположения...');
      
      // Проверяем разрешение на уведомления
      const hasNotificationPermission = await notificationManager.checkPermission();
      if (!hasNotificationPermission) {
        console.log('⚠️ Нет разрешения на уведомления');
      }

      // Запускаем отслеживание
      await locationService.startTracking(markers, (location) => {
        setLocationState({
          location,
          errorMsg: null,
          permissionGranted: true,
        });
      });
      
      console.log('📍 Отслеживание местоположения запущено');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ошибка отслеживания';
      setLocationState(prev => ({
        ...prev,
        errorMsg,
      }));
      console.error('❌ Ошибка запуска отслеживания:', error);
    }
  };

  /**
   * Остановка отслеживания местоположения
   */
  const stopLocationTracking = (): void => {
    locationService.stopTracking();
    setLocationState(prev => ({
      ...prev,
      location: null,
    }));
    console.log('📍 Отслеживание местоположения остановлено');
  };

  /**
   * Получение маркеров вблизи текущего местоположения
   */
  const getNearbyMarkers = async (radius: number = PROXIMITY_THRESHOLD): Promise<MarkerData[]> => {
    if (!locationState.location) {
      return [];
    }

    const userCoords = locationState.location.coords;
    
    return markers.filter(marker => {
      const distance = locationService.calculateDistance(
        userCoords.latitude,
        userCoords.longitude,
        marker.coordinate.latitude,
        marker.coordinate.longitude
      );
      return distance <= radius;
    });
  };

  /**
   * Значение контекста
   */
  const contextValue: DatabaseContextType = {
    // Операции с маркерами
    addMarker,
    deleteMarker,
    getMarkers,
    getMarker,
    
    // Операции с изображениями
    addImage,
    deleteImage,
    getMarkerImages,
    
    // Геолокация и уведомления
    locationState,
    startLocationTracking,
    stopLocationTracking,
    getNearbyMarkers,
    
    // Статусы
    isLoading,
    error,
    initializeDatabase
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

/**
 * Хук для использования контекста базы данных
 */
export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};