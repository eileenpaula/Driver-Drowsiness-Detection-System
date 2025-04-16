import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { FIREBASE_APP } from '../database/.config';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


export default function StatsPage() {
  const [analysisData, setAnalysisData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(FIREBASE_APP);
  const router = useRouter();

  useEffect(() => {
    const fetchAnalysisResults = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'analysis_results'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnalysisData(data);
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisResults();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back_arrow}>
        <Ionicons name="arrow-back" size={40} color="#99342C" />
      </TouchableOpacity>

      <Text style={styles.title}>Driving Stats</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#99342C" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.cardContainer}>
          {analysisData.length === 0 ? (
            <Text style={styles.noDataText}>No analysis results found.</Text>
          ) : (
            analysisData.map(result => (
              <View key={result.id} style={styles.card}>
                <Text style={styles.date}>{new Date(result.timestamp).toLocaleString()}</Text>
                <Text style={styles.stat}><Text style={styles.label}>Drowsy Frames:</Text> {result.drowsyCount}</Text>
                <Text style={styles.stat}><Text style={styles.label}>Normal Frames:</Text> {result.normalCount}</Text>
                <Text style={styles.stat}><Text style={styles.label}>Duration:</Text> {result.duration}s</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(206, 209, 184)',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 20,
    color: '#99342C',
  },
  cardContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(235, 236, 222, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  date: {
    fontSize: 16,
    color: '#4c4036',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  stat: {
    fontSize: 16,
    color: '#4c4036',
    marginVertical: 2,
  },
  label: {
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    color: '#4c4036',
    marginTop: 30,
    fontSize: 16,
  },
  back_arrow: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 1000,
  },
});