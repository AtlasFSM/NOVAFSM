import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useJobs } from '../hooks/use-jobs';

interface JobLocation {
  id: string;
  number: string;
  title: string;
  customerName: string;
  status: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export default function MapScreen({ navigation }: any) {
  const { jobs, isLoading } = useJobs();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [jobLocations, setJobLocations] = useState<JobLocation[]>([]);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  useEffect(() => {
    // Convert jobs to map markers (filter jobs with valid coordinates)
    const locations: JobLocation[] = jobs
      .filter((job: any) => job.siteLatitude && job.siteLongitude)
      .map((job: any) => ({
        id: job.id,
        number: job.number,
        title: job.title,
        customerName: job.customerName,
        status: job.status,
        latitude: parseFloat(job.siteLatitude),
        longitude: parseFloat(job.siteLongitude),
        address: job.siteAddress,
      }));
    setJobLocations(locations);
  }, [jobs]);

  const handleMarkerPress = (jobId: string) => {
    const job = jobs.find((j: any) => j.id === jobId);
    if (job) {
      navigation.navigate('Jobs', {
        screen: 'JobDetail',
        params: { jobId },
      });
    }
  };

  const openInMaps = (latitude: number, longitude: number, label: string) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const centerOnMyLocation = async () => {
    if (hasPermission) {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    } else {
      Alert.alert(
        'Permission Needed',
        'Location permission is required to show your position on the map.'
      );
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return '#3b82f6';
      case 'IN_PROGRESS':
        return '#f59e0b';
      case 'COMPLETED':
        return '#10b981';
      case 'ON_HOLD':
        return '#6b7280';
      default:
        return '#8b5cf6';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  const initialRegion = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }
    : {
        latitude: 43.6532, // Default to Toronto
        longitude: -79.3832,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={hasPermission}
        showsMyLocationButton={false}
      >
        {jobLocations.map((job) => (
          <Marker
            key={job.id}
            coordinate={{
              latitude: job.latitude,
              longitude: job.longitude,
            }}
            pinColor={getMarkerColor(job.status)}
            onPress={() => handleMarkerPress(job.id)}
          >
            <Callout
              onPress={() => handleMarkerPress(job.id)}
              style={styles.callout}
            >
              <View style={styles.calloutContent}>
                <Text style={styles.calloutTitle}>{job.number}</Text>
                <Text style={styles.calloutCustomer}>{job.customerName}</Text>
                <Text style={styles.calloutJob}>{job.title}</Text>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() =>
                    openInMaps(job.latitude, job.longitude, job.customerName)
                  }
                >
                  <Text style={styles.directionsText}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={centerOnMyLocation}
        >
          <Text style={styles.locationButtonText}>📍 My Location</Text>
        </TouchableOpacity>
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Job Status:</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Scheduled</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>In Progress</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  controls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 12,
  },
  locationButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  legend: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  callout: {
    width: 200,
  },
  calloutContent: {
    padding: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  calloutCustomer: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  calloutJob: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 8,
  },
  directionsButton: {
    backgroundColor: '#3b82f6',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  directionsText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
