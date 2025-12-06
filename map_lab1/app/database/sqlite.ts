import * as SQLite from 'expo-sqlite';
import { DatabaseSchema } from './schema';
import { DatabaseOperations } from './operations';

/**
 * Главный сервис для работы с SQLite базой данных
 */
export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private dbName: string = 'markers.db';
  private isInitialized: boolean = false;
  private schema: DatabaseSchema | null = null;
  private operations: DatabaseOperations | null = null;

  /**
   * Инициализация базы данных
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔄 Инициализация базы данных...');
      console.log('📁 Имя базы данных:', this.dbName);
      
      // Открываем базу данных
      this.db = SQLite.openDatabaseSync(this.dbName);
      console.log('✅ База данных открыта');

      // Инициализируем компоненты
      this.schema = new DatabaseSchema(this.db);
      this.operations = new DatabaseOperations(this.db);
      
      // Проверяем существование таблиц
      const tablesExist = await this.schema.checkTablesExist();
      console.log('📋 Таблицы существуют:', tablesExist);
      
      if (!tablesExist) {
        console.log('🆕 Создаем таблицы...');
        await this.schema.initializeTables();
        await this.schema.addSampleData();
      } else {
        console.log('✅ Используем существующие таблицы');
        // Проверяем количество маркеров
        const markerCount = await this.schema.getMarkerCount();
        console.log('📍 Маркеров в базе:', markerCount);
      }
      
      this.isInitialized = true;
      console.log('🎉 База данных готова к работе');
      
    } catch (error) {
      console.error('❌ Критическая ошибка инициализации базы данных:', error);
      throw error;
    }
  }

  /**
   * Проверка инициализации перед операциями
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.operations) {
      throw new Error('База данных не инициализирована. Сначала вызовите initialize().');
    }
  }

  /**
   * Добавление нового маркера
   */
  async addMarker(latitude: number, longitude: number, title?: string): Promise<number> {
    this.ensureInitialized();
    return this.operations!.addMarker(latitude, longitude, title);
  }

  /**
   * Удаление маркера
   */
  async deleteMarker(id: number): Promise<void> {
    this.ensureInitialized();
    return this.operations!.deleteMarker(id);
  }

  /**
   * Получение всех маркеров
   */
  async getMarkers(): Promise<any[]> {
    this.ensureInitialized();
    return this.operations!.getMarkers();
  }

  /**
   * Получение маркера по ID
   */
  async getMarker(id: number): Promise<any | null> {
    this.ensureInitialized();
    return this.operations!.getMarker(id);
  }

  /**
   * Добавление изображения к маркеру
   */
  async addImage(markerId: number, uri: string): Promise<number> {
    this.ensureInitialized();
    return this.operations!.addImage(markerId, uri);
  }

  /**
   * Удаление изображения
   */
  async deleteImage(id: number): Promise<void> {
    this.ensureInitialized();
    return this.operations!.deleteImage(id);
  }

  /**
   * Получение всех изображений маркера
   */
  async getMarkerImages(markerId: number): Promise<any[]> {
    this.ensureInitialized();
    return this.operations!.getMarkerImages(markerId);
  }

  /**
   * Закрытие соединения с базой данных
   */
  close(): void {
    if (this.db) {
      this.db.closeAsync();
      this.isInitialized = false;
      this.schema = null;
      this.operations = null;
      console.log('🔒 Соединение с базой данных закрыто');
    }
  }
}

export const databaseService = new DatabaseService();