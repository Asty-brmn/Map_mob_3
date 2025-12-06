import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, LongPressEvent, Circle } from 'react-native-maps';
import { MarkerData, PROXIMITY_THRESHOLD } from '../types';

interface MapProps {
  markers: MarkerData[];
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onMapLongPress: (event: LongPressEvent) => void;
  onMarkerPress: (marker: MarkerData) => void;
  isAddingMarker?: boolean;
  userLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  showProximityZones?: boolean;
}

export const Map: React.FC<MapProps> = ({
  markers,
  initialRegion,
  onMapLongPress,
  onMarkerPress,
  isAddingMarker = false,
  userLocation = null,
  showProximityZones = false,
}) => {
  const renderMarkers = () => {
    return markers.map((marker) => (
      <React.Fragment key={marker.id}>
        <Marker
          coordinate={marker.coordinate}
          title={marker.title}
          description={`Нажмите для выбора`}
          onPress={() => onMarkerPress(marker)}
        />
        
        {showProximityZones && (
          <Circle
            center={marker.coordinate}
            radius={PROXIMITY_THRESHOLD}
            strokeWidth={1}
            strokeColor="rgba(0, 122, 255, 0.3)"
            fillColor="rgba(0, 122, 255, 0.1)"
          />
        )}
      </React.Fragment>
    ));
  };

  const renderUserLocation = () => {
    if (!userLocation) return null;

    return (
      <Marker
        coordinate={userLocation}
        title="Ваше местоположение"
        description="Текущие координаты"
        pinColor="#007AFF"
      />
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onLongPress={isAddingMarker ? undefined : onMapLongPress}
        showsUserLocation={false} 
        showsMyLocationButton={true}
      >
        {renderMarkers()}
        {renderUserLocation()}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});