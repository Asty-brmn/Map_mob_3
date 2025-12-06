import * as SQLite from 'expo-sqlite';
import { MarkerData, MarkerImage } from '../../types';

/**
 * Операции с данными в базе данных
 */
export class DatabaseOperations {
  private db: SQLite.SQLiteDatabase | null = null;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  /**
   * Добавление нового маркера
   */
  async addMarker(latitude: number, longitude: number, title?: string): Promise<number> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    // Получаем количество маркеров для порядкового номера
    let markerCount = 0;
    try {
      const countResult = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM markers;`
      );
      markerCount = countResult?.count || 0;
    } catch (error) {
      console.log('Не удалось получить количество маркеров, используем 0');
    }

    const markerTitle = title || `Маркер ${markerCount + 1}`;

    try {
      const result = await this.db.runAsync(
        `INSERT INTO markers (title, latitude, longitude) VALUES (?, ?, ?);`,
        [markerTitle, latitude, longitude]
      );
      
      console.log('✅ Маркер добавлен, ID:', result.lastInsertRowId);
      return result.lastInsertRowId as number;
      
    } catch (error) {
      console.error('❌ Ошибка добавления маркера:', error);
      throw error;
    }
  }

  /**
   * Удаление маркера
   */
  async deleteMarker(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    try {
      await this.db.runAsync(
        `DELETE FROM markers WHERE id = ?;`,
        [id]
      );
      
      console.log('✅ Маркер удален, ID:', id);
      
    } catch (error) {
      console.error('❌ Ошибка удаления маркера:', error);
      throw error;
    }
  }

  /**
   * Получение всех маркеров
   */
  async getMarkers(): Promise<MarkerData[]> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    try {
      const result = await this.db.getAllAsync<{
        id: number;
        title: string;
        latitude: number;
        longitude: number;
        created_at: string;
      }>(
        `SELECT * FROM markers ORDER BY created_at DESC;`
      );

      const markers: MarkerData[] = result.map(item => ({
        id: item.id,
        title: item.title,
        coordinate: {
          latitude: item.latitude,
          longitude: item.longitude
        },
        images: [],
        created_at: item.created_at
      }));

      console.log('✅ Получено маркеров:', markers.length);
      return markers;
      
    } catch (error) {
      console.error('❌ Ошибка получения маркеров:', error);
      throw error;
    }
  }

  /**
   * Получение маркера по ID
   */
  async getMarker(id: number): Promise<MarkerData | null> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    try {
      const result = await this.db.getFirstAsync<{
        id: number;
        title: string;
        latitude: number;
        longitude: number;
        created_at: string;
      }>(
        `SELECT * FROM markers WHERE id = ?;`,
        [id]
      );

      if (result) {
        const marker: MarkerData = {
          id: result.id,
          title: result.title,
          coordinate: {
            latitude: result.latitude,
            longitude: result.longitude
          },
          images: [],
          created_at: result.created_at
        };
        console.log('✅ Маркер найден:', marker.title);
        return marker;
      } else {
        console.log('⚠️ Маркер не найден, ID:', id);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Ошибка получения маркера:', error);
      throw error;
    }
  }

  /**
   * Добавление изображения к маркеру
   */
  async addImage(markerId: number, uri: string): Promise<number> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    try {
      const result = await this.db.runAsync(
        `INSERT INTO marker_images (marker_id, uri) VALUES (?, ?);`,
        [markerId, uri]
      );
      
      console.log('✅ Изображение добавлено, ID:', result.lastInsertRowId);
      return result.lastInsertRowId as number;
      
    } catch (error) {
      console.error('❌ Ошибка добавления изображения:', error);
      throw error;
    }
  }

  /**
   * Удаление изображения
   */
  async deleteImage(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    try {
      await this.db.runAsync(
        `DELETE FROM marker_images WHERE id = ?;`,
        [id]
      );
      
      console.log('✅ Изображение удалено, ID:', id);
      
    } catch (error) {
      console.error('❌ Ошибка удаления изображения:', error);
      throw error;
    }
  }

  /**
   * Получение всех изображений маркера
   */
  async getMarkerImages(markerId: number): Promise<MarkerImage[]> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    try {
      const result = await this.db.getAllAsync<{
        id: number;
        marker_id: number;
        uri: string;
        created_at: string;
      }>(
        `SELECT * FROM marker_images WHERE marker_id = ? ORDER BY created_at DESC;`,
        [markerId]
      );

      const images: MarkerImage[] = result.map(item => ({
        id: item.id,
        marker_id: item.marker_id,
        uri: item.uri,
        created_at: item.created_at
      }));

      console.log('✅ Получено изображений для маркера', markerId + ':', images.length);
      return images;
      
    } catch (error) {
      console.error('❌ Ошибка получения изображений:', error);
      throw error;
    }
  }
}