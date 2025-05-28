import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';

interface CarPriceResponse {
  carPrice: string;
}

export default function App() {
  const [carQuery, setCarQuery] = useState('');
  const [carInfo, setCarInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const searchCarPrice = async () => {
    if (!carQuery.trim()) {
      Alert.alert('Error', 'Please enter a car brand name or type "brands"');
      return;
    }

    setLoading(true);
    try {
      // Call Mastra car price agent API
      const response = await fetch('http://192.168.71.31:4111/api/agents/carPriceAgent/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Search for car prices: ${carQuery}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const carText = data.text || data.content || 'No car price information found';

      setCarInfo(carText);

      // Add to history if not already present
      if (!history.includes(carQuery.toLowerCase())) {
        setHistory(prev => [carQuery.toLowerCase(), ...prev.slice(0, 9)]); // Keep last 10 searches
      }
    } catch (error) {
      console.error('Error fetching car prices:', error);
      Alert.alert('Error', 'Failed to fetch car price information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchCarPriceFromHistory = (historyQuery: string) => {
    setCarQuery(historyQuery);
    // Auto search when selecting from history
    setTimeout(() => {
      searchCarPrice();
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚗 Car Price Finder</Text>
        <Text style={styles.subtitle}>Powered by Mastra AI Agent & FIPE API</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter car brand or 'brands'..."
          value={carQuery}
          onChangeText={setCarQuery}
          onSubmitEditing={searchCarPrice}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={searchCarPrice}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Car Price Section */}
      <ScrollView style={styles.carSection} showsVerticalScrollIndicator={false}>
        {carInfo ? (
          <View style={styles.carCard}>
            <Text style={styles.carTitle}>Car Price Info:</Text>
            <Text style={styles.carText}>{carInfo}</Text>
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              Enter a car brand name (Toyota, Honda, Ford) or type "brands" to see all available brands and get current market prices from FIPE.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* History Section */}
      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Searches:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {history.map((historyQuery, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => searchCarPriceFromHistory(historyQuery)}
              >
                <Text style={styles.historyItemText}>{historyQuery}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#FF9800',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#e3f2fd',
    fontStyle: 'italic',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  carSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  carCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  carText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
  placeholderCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  historySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  historyItemText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '500',
  },
});
