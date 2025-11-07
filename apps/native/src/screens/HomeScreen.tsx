import { generateCorrelationId, getAppEnvironment } from '@petspark/shared';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen(): React.JSX.Element {
  const environment = getAppEnvironment();
  const correlationId = generateCorrelationId();

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Pet3 Native</Text>
        <Text style={styles.subtitle}>
          A production-ready Expo app with monorepo support
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Platform Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Platform:</Text>
          <Text style={styles.value}>{Platform.OS}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Version:</Text>
          <Text style={styles.value}>{Platform.Version}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Shared Package Demo</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Environment:</Text>
          <Text style={styles.value}>{environment.env}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Timestamp:</Text>
          <Text style={styles.value}>{environment.timestamp}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Correlation ID:</Text>
          <Text style={styles.valueSmall}>{correlationId}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Features</Text>
        <Text style={styles.feature}>✅ Expo SDK 51</Text>
        <Text style={styles.feature}>✅ React Navigation</Text>
        <Text style={styles.feature}>✅ NativeWind (Tailwind for RN)</Text>
        <Text style={styles.feature}>✅ TypeScript</Text>
        <Text style={styles.feature}>✅ Monorepo with shared packages</Text>
        <Text style={styles.feature}>✅ EAS Build ready</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built with ❤️ for iOS, Android, and Web
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    width: 120,
  },
  value: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  valueSmall: {
    fontSize: 12,
    color: '#1f2937',
    flex: 1,
  },
  feature: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
