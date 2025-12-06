import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  ScrollView 
} from 'react-native';
import { MarkerData } from '../types';

interface MarkerListProps {
  markers: MarkerData[];
  selectedMarker: MarkerData | null;
  onMarkerSelect: (marker: MarkerData) => void;
  onMarkerDelete: (marker: MarkerData) => void;
  onShowDetails: (marker: MarkerData) => void;
}

export const MarkerList: React.FC<MarkerListProps> = ({
  markers,
  selectedMarker,
  onMarkerSelect,
  onMarkerDelete,
  onShowDetails
}) => {
  if (markers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Нет маркеров</Text>
        <Text style={styles.emptySubtext}>Добавьте маркеры на карту</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {markers.map((marker) => (
        <View 
          key={marker.id} 
          style={[
            styles.markerItem,
            selectedMarker?.id === marker.id && styles.selectedMarker
          ]}
        >
          <TouchableOpacity 
            style={styles.markerInfo}
            onPress={() => onMarkerSelect(marker)}
          >
            <Text style={styles.markerTitle}>{marker.title}</Text>
            <Text style={styles.markerCoordinates}>
              {marker.coordinate.latitude.toFixed(4)}, {marker.coordinate.longitude.toFixed(4)}
            </Text>
            <Text style={styles.markerImages}>
              Изображений: {marker.images.length}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.markerActions}>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => onShowDetails(marker)}
            >
              <Text style={styles.buttonText}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => onMarkerDelete(marker)}
            >
              <Text style={styles.buttonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  markerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  selectedMarker: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  markerInfo: {
    flex: 1,
  },
  markerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  markerCoordinates: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  markerImages: {
    fontSize: 12,
    color: '#999',
  },
  markerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});