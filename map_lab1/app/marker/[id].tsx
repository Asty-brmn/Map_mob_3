// app/marker/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MarkerData } from '../../types';
import { useDatabase } from '../contexts/DatabaseContext';
import { ImageList } from '../../components/ImageList';

export default function MarkerDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getMarker, addImage, deleteImage } = useDatabase();
  
  const [marker, setMarker] = useState<MarkerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingImage, setIsAddingImage] = useState(false);

  useEffect(() => {
    console.log('📱 Экрана деталей маркера, ID:', id);
    if (id) {
      loadMarkerData();
    }
  }, [id]);

  const loadMarkerData = async () => {
    try {
      setIsLoading(true);
      
      if (!id) {
        throw new Error('ID маркера не указан');
      }

      const markerId = parseInt(id);
      const foundMarker = await getMarker(markerId);
      
      if (foundMarker) {
        console.log('✅ Данные маркера загружены:', foundMarker.title);
        setMarker(foundMarker);
      } else {
        console.log('⚠️ Маркер не найден в базе данных, ID:', id);
        Alert.alert('Ошибка', 'Маркер не найден в базе данных');
        router.back();
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки данных маркера:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные маркера из базы данных');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = async () => {
    try {
      setIsAddingImage(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Разрешение на доступ к галерее не предоставлено');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        if (!marker || !id) {
          throw new Error('Маркер не загружен');
        }

        console.log('📸 Изображение выбрано, добавление в базу...');
        await addImage(marker.id, selectedImage.uri);
        
        await loadMarkerData();
        
        Alert.alert('Успех', 'Изображение успешно добавлено к маркеру');
      } else {
        console.log('👤 Пользователь отменил выбор изображения');
      }
    } catch (error) {
      console.error('❌ Ошибка при добавлении изображения:', error);
      Alert.alert('Ошибка', 'Не удалось добавить изображение в базу данных');
    } finally {
      setIsAddingImage(false);
    }
  };

  const handleDeleteImage = (imageId: number) => {
    console.log('🗑️ Удаление изображения:', imageId);
    deleteImage(imageId)
      .then(() => {
        loadMarkerData();
        Alert.alert('Успех', 'Изображение удалено');
      })
      .catch(error => {
        console.error('❌ Ошибка при удалении изображения:', error);
        Alert.alert('Ошибка', 'Не удалось удалить изображение из базы данных');
      });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#71a7e0ff" />
        <Text style={styles.loadingText}>Загрузка данных маркера...</Text>
        <Text style={styles.loadingSubtext}>ID: {id}</Text>
      </View>
    );
  }

  if (!marker) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Маркер не найден</Text>
        <Text style={styles.errorSubtext}>ID: {id}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Назад к карте</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Заголовок и информация о местоположении */}
      <View style={styles.header}>
        <Text style={styles.title}>{marker.title}</Text>
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesLabel}>Координаты:</Text>
          <Text style={styles.coordinates}>
            Широта: {marker.coordinate.latitude.toFixed(6)}
          </Text>
          <Text style={styles.coordinates}>
            Долгота: {marker.coordinate.longitude.toFixed(6)}
          </Text>
        </View>
        <Text style={styles.createdAt}>
          Создан: {new Date(marker.created_at).toLocaleDateString('ru-RU')}
        </Text>
        <Text style={styles.markerId}>
          ID маркера: {marker.id}
        </Text>
      </View>

      {/* Секция изображений через компонент */}
      <ImageList
        images={marker.images}
        onDeleteImage={handleDeleteImage}
        onAddImage={handleAddImage}
        isAddingImage={isAddingImage}
        markerTitle={marker.title}
      />

      {/* Кнопка возврата */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Назад к карте</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  coordinatesContainer: {
    marginBottom: 8,
  },
  coordinatesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  createdAt: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  markerId: {
    fontSize: 12,
    color: '#ccc',
    fontFamily: 'monospace',
  },
  backButton: {
    backgroundColor: '#8E8E93',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});