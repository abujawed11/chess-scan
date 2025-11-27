// app/diagnostics.tsx - Backend Connection Diagnostics
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/ui/Button';
import { API_CONFIG } from '@/constants/config';
import { checkVisionApiHealth } from '@/services/visionApi';
import { initializeEngine } from '@/services/chessEngine';

interface DiagnosticResult {
  status: 'checking' | 'success' | 'error';
  message: string;
  details?: string;
}

export default function Diagnostics() {
  const [visionApiStatus, setVisionApiStatus] = useState<DiagnosticResult>({
    status: 'checking',
    message: 'Checking...',
  });
  const [engineStatus, setEngineStatus] = useState<DiagnosticResult>({
    status: 'checking',
    message: 'Checking...',
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    // Check Vision API
    setVisionApiStatus({ status: 'checking', message: 'Checking vision API...' });
    try {
      const isHealthy = await checkVisionApiHealth();
      if (isHealthy) {
        setVisionApiStatus({
          status: 'success',
          message: 'Vision API is running',
          details: API_CONFIG.VISION_API_URL,
        });
      } else {
        setVisionApiStatus({
          status: 'error',
          message: 'Vision API is not responding',
          details: `Cannot reach ${API_CONFIG.VISION_API_URL}/health`,
        });
      }
    } catch (error) {
      setVisionApiStatus({
        status: 'error',
        message: 'Vision API connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check Chess Engine
    setEngineStatus({ status: 'checking', message: 'Checking chess engine...' });
    try {
      const initialized = await initializeEngine();
      if (initialized) {
        setEngineStatus({
          status: 'success',
          message: 'Chess engine is running',
          details: API_CONFIG.CHESS_ENGINE_URL,
        });
      } else {
        setEngineStatus({
          status: 'error',
          message: 'Chess engine initialization failed',
          details: `Cannot initialize engine at ${API_CONFIG.CHESS_ENGINE_URL}`,
        });
      }
    } catch (error) {
      setEngineStatus({
        status: 'error',
        message: 'Chess engine connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking': return '#3b82f6';
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
    }
  };

  const allGood = visionApiStatus.status === 'success' && engineStatus.status === 'success';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Backend Diagnostics</Text>
        <Text style={styles.subtitle}>
          Checking connectivity to backend services
        </Text>
      </View>

      {/* Overall Status */}
      <View style={[styles.overallCard, allGood && styles.successCard]}>
        <Text style={styles.overallIcon}>
          {allGood ? '✅' : (visionApiStatus.status === 'checking' || engineStatus.status === 'checking') ? '🔄' : '⚠️'}
        </Text>
        <Text style={styles.overallText}>
          {allGood
            ? 'All systems operational!'
            : (visionApiStatus.status === 'checking' || engineStatus.status === 'checking')
            ? 'Running diagnostics...'
            : 'Some services unavailable'}
        </Text>
      </View>

      {/* Vision API Status */}
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceIcon}>{getStatusIcon(visionApiStatus.status)}</Text>
          <Text style={styles.serviceName}>Vision API (Board Detection)</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visionApiStatus.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(visionApiStatus.status) }]}>
            {visionApiStatus.message}
          </Text>
        </View>
        {visionApiStatus.details && (
          <Text style={styles.detailsText}>{visionApiStatus.details}</Text>
        )}
      </View>

      {/* Chess Engine Status */}
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceIcon}>{getStatusIcon(engineStatus.status)}</Text>
          <Text style={styles.serviceName}>Chess Engine (Stockfish)</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(engineStatus.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(engineStatus.status) }]}>
            {engineStatus.message}
          </Text>
        </View>
        {engineStatus.details && (
          <Text style={styles.detailsText}>{engineStatus.details}</Text>
        )}
      </View>

      {/* Configuration Info */}
      <View style={styles.configCard}>
        <Text style={styles.configTitle}>📍 Configuration</Text>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Vision API:</Text>
          <Text style={styles.configValue}>{API_CONFIG.VISION_API_URL}</Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Chess Engine:</Text>
          <Text style={styles.configValue}>{API_CONFIG.CHESS_ENGINE_URL}</Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Timeout:</Text>
          <Text style={styles.configValue}>{API_CONFIG.TIMEOUT / 1000}s</Text>
        </View>
      </View>

      {/* Troubleshooting */}
      {!allGood && (
        <View style={styles.troubleshootCard}>
          <Text style={styles.troubleshootTitle}>🔧 Troubleshooting</Text>
          <Text style={styles.troubleshootText}>
            1. Make sure backend is running:
          </Text>
          <Text style={styles.troubleshootCode}>
            cd D:\react\chess-detector\chess-api{'\n'}
            uvicorn app:app --reload --port 8000
          </Text>
          <Text style={styles.troubleshootText}>
            2. For Android Emulator, use: 10.0.2.2
          </Text>
          <Text style={styles.troubleshootText}>
            3. For physical device, use your computer's IP
          </Text>
          <Text style={styles.troubleshootText}>
            4. Check firewall settings
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="🔄 Run Again"
          onPress={runDiagnostics}
          variant="secondary"
          style={{ flex: 1 }}
        />
        <Button
          title="Back to Home"
          onPress={() => router.replace('/')}
          variant="outline"
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  overallCard: {
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#fbbf24',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  overallIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  overallText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  serviceIcon: {
    fontSize: 24,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  configCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e40af',
  },
  configRow: {
    marginBottom: 8,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },
  configValue: {
    fontSize: 11,
    color: '#1e40af',
    fontFamily: 'monospace',
  },
  troubleshootCard: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  troubleshootTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#991b1b',
  },
  troubleshootText: {
    fontSize: 13,
    color: '#991b1b',
    marginBottom: 8,
    lineHeight: 20,
  },
  troubleshootCode: {
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});

