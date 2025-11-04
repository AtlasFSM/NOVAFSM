import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map View</Text>
      <Text style={styles.subtitle}>
        Jobs would be displayed on a map here using react-native-maps
      </Text>
      <Text style={styles.note}>
        To implement:{'\n'}
        • Install react-native-maps{'\n'}
        • Show job markers clustered by location{'\n'}
        • Tap marker to view job details{'\n'}
        • Navigate to site from map
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  note: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 24,
  },
});
