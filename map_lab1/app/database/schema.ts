import * as SQLite from 'expo-sqlite';

/**
 * Схема базы данных и операции с таблицами
 */
export class DatabaseSchema {
  private db: SQLite.SQLiteDatabase | null = null;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  /**
   * Инициализация таблиц базы данных
   */
  async initializeTables(): Promise<void> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    try {
      console.log('🔄 Создание таблиц...');
      
      // Таблица маркеров
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS markers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Таблица markers создана');

      // Таблица изображений маркеров
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS marker_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          marker_id INTEGER NOT NULL,
          uri TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Таблица marker_images создана');
      
    } catch (error) {
      console.error('❌ Ошибка создания таблиц:', error);
      throw error;
    }
  }

  /**
   * Проверка существования таблиц
   */
  async checkTablesExist(): Promise<boolean> {
    if (!this.db) return false;

    try {
      const result = await this.db.getFirstAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='markers';`
      );
      
      const exists = !!result;
      console.log('🔍 Проверка таблицы markers:', exists ? 'НАЙДЕНА' : 'НЕ НАЙДЕНА');
      return exists;
      
    } catch (error) {
      console.log('⚠️ Ошибка проверки таблиц:', error);
      return false;
    }
  }

  /**
   * Добавление демонстрационных данных
   */
  async addSampleData(): Promise<void> {
    if (!this.db) return;

    try {
      console.log('📝 Добавление демонстрационных данных...');
      
      // Добавляем несколько маркеров в Перми
      await this.db.runAsync(
        `INSERT INTO markers (title, latitude, longitude) VALUES (?, ?, ?);`,
        ['Пермь, центр', 58.010455, 56.229443]
      );
      
      await this.db.runAsync(
        `INSERT INTO markers (title, latitude, longitude) VALUES (?, ?, ?);`,
        ['Пермь, точка 2', 58.010475, 56.229963]
      );
      
      console.log('✅ Демонстрационные данные добавлены');
    } catch (error) {
      console.log('⚠️ Не удалось добавить демонстрационные данные:', error);
    }
  }

  /**
   * Получить количество маркеров
   */
  async getMarkerCount(): Promise<number> {
    if (!this.db) return 0;
    
    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM markers;`
      );
      return result?.count || 0;
    } catch (error) {
      console.log('⚠️ Не удалось получить количество маркеров');
      return 0;
    }
  }
}