import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { MarkerImage } from '../types';

interface ImageListProps {
  images: MarkerImage[];
  onDeleteImage: (imageId: number) => void;
  onAddImage: () => void;
  isAddingImage?: boolean;
  markerTitle?: string;
}

export const ImageList: React.FC<ImageListProps> = ({
  images,
  onDeleteImage,
  onAddImage,
  isAddingImage = false,
  markerTitle = 'маркер'
}) => {
  const handleDeletePress = (imageId: number) => {
    Alert.alert(
      'Удаление изображения',
      'Вы уверены, что хотите удалить это изображение?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => onDeleteImage(imageId),
        },
      ]
    );
  };

  const renderImageItem = ({ item }: { item: MarkerImage }) => (
    <View style={styles.imageItem}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePress(item.id)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Изображения ({images.length})
        </Text>
        <TouchableOpacity 
          style={[styles.addButton, isAddingImage && styles.addButtonDisabled]} 
          onPress={onAddImage}
          disabled={isAddingImage}
        >
          <Text style={styles.addButtonText}>
            {isAddingImage ? '⏳' : '+ Добавить'}
          </Text>
        </TouchableOpacity>
      </View>

      {images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyText}>
            Нет добавленных изображений
          </Text>
          <Text style={styles.emptySubtext}>
            Нажмите "Добавить" чтобы прикрепить фото к маркеру "{markerTitle}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imagesList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  imagesList: {
    paddingRight: 16,
  },
  imageItem: {
    marginRight: 16,
    position: 'relative',
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: 12,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});