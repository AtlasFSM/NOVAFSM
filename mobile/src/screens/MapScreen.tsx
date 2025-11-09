import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useJobs } from '../hooks/use-jobs';
import { Job } from '../types';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: jobs = [], isLoading } = useJobs();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required to show the map');
          setLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Could not get your current location');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return '#3b82f6'; // blue
      case 'IN_PROGRESS':
        return '#f59e0b'; // orange
      case 'COMPLETED':
        return '#10b981'; // green
      case 'ON_HOLD':
        return '#6b7280'; // gray
      default:
        return '#3b82f6';
    }
  };

  if (loading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to get location</Text>
        <Text style={styles.errorSubtext}>
          Please enable location services and try again
        </Text>
      </View>
    );
  }

  // Filter jobs that have site coordinates
  const jobsWithLocations = jobs.filter(
    (job: Job) => job.site?.latitude && job.site?.longitude
  );

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {jobsWithLocations.map((job: Job) => (
          <Marker
            key={job.id}
            coordinate={{
              latitude: job.site.latitude!,
              longitude: job.site.longitude!,
            }}
            pinColor={getMarkerColor(job.status)}
            title={job.number}
            description={job.title}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{job.number}</Text>
                <Text style={styles.calloutSubtitle}>{job.title}</Text>
                <Text style={styles.calloutDetail}>
                  Customer: {job.customer.name}
                </Text>
                <Text style={styles.calloutDetail}>
                  Site: {job.site.name}
                </Text>
                <View style={styles.calloutBadge}>
                  <Text
                    style={[
                      styles.calloutBadgeText,
                      { color: getMarkerColor(job.status) },
                    ]}
                  >
                    {job.status}
                  </Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Job Status</Text>
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
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6b7280' }]} />
          <Text style={styles.legendText}>On Hold</Text>
        </View>
      </View>

      {/* Stats Badge */}
      <View style={styles.statsBadge}>
        <Text style={styles.statsText}>
          {jobsWithLocations.length} {jobsWithLocations.length === 1 ? 'job' : 'jobs'} on map
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
  callout: {
    padding: 12,
    minWidth: 200,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  calloutDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  calloutBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  calloutBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  legend: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
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
    marginBottom: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: '#4b5563',
  },
  statsBadge: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});
