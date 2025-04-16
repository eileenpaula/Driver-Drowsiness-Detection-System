import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '../database/.config';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {format} from 'date-fns';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';

const AlertnessLineGraph = ({
  data,
  labels,
}: {
  data: { Alert: number; Low: number; Drowsy: number }[];
  labels: string[];
}) => {
  const width = 300;
  const height = 100;
  const maxY = 100;
  const padding = 20;

  const getPoints = (key: keyof typeof data[0]) => {
    return data.map((point, index) => {
      const safeDivisor = data.length > 1 ? data.length - 1 : 1;
      const x = padding + (index / safeDivisor) * (width - 2 * padding);
      const y = height - padding - (point[key] / maxY) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(" ");
  };

  return (
    <View style={{ alignItems: "center", marginBottom: 20 }}>
      <Svg height={height + 20} width={width}>
        {/* X axis */}
        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="gray"
          strokeWidth="1"
        />

        {/* Alertness Lines */}
        <Polyline points={getPoints("Alert")} fill="none" stroke="green" strokeWidth="2" />
        <Polyline points={getPoints("Low")} fill="none" stroke="orange" strokeWidth="2" />
        <Polyline points={getPoints("Drowsy")} fill="none" stroke="red" strokeWidth="2" />

        {/* Dots */}
        {data.map((point, index) => {
          const safeDivisor = data.length > 1 ? data.length - 1 : 1;
          const x = padding + (index / safeDivisor) * (width - 2 * padding);
          return (
            <React.Fragment key={`dot-${index}`}>
              <Circle cx={x} cy={height - padding - (point.Alert / maxY) * (height - 2 * padding)} r="3" fill="green" />
              <Circle cx={x} cy={height - padding - (point.Low / maxY) * (height - 2 * padding)} r="3" fill="orange" />
              <Circle cx={x} cy={height - padding - (point.Drowsy / maxY) * (height - 2 * padding)} r="3" fill="red" />
            </React.Fragment>
          );
        })}

        {/* Labels for time */}
        {labels.map((label, index) => {
          const safeDivisor = labels.length > 1 ? labels.length - 1 : 1;
          const x = padding + (index / safeDivisor) * (width - 2 * padding);
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={height + 10}
              fontSize="8"
              fill="black"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};



export default function StatsPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchVideos = () => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) return;
  
    const q = query(
      collection(FIREBASE_DB, "users", user.uid, "videos"),
      orderBy("time_stored", "desc")
    );
  
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVideos(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchVideos();
  }, []);
  
  const alertnessGraphData = videos.map((video) => {
    const alertness = video.results?.alertness_percentages || {};
    return {
      Alert: alertness["Alert"] || 0,
      Low: alertness["Low Vigilant"] || 0,
      Drowsy: alertness["Very Drowsy"] || 0,
    };
  });
  
  const alertnessLabels = videos.map((video) => {
    let timestamp = video.time_recorded ?? video.time_stored;
  
    // Convert Firestore Timestamp to Date only if needed
    if (timestamp) {
      const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : timestamp;
      try {
        return format(date, "MMM d");
      } catch {
        return "Invalid";
      }
    }
  
    return "Unknown";
  });
  

  const chartData = ["Alert", "Low Vigilant", "Very Drowsy"].map((label) => ({
    label,
    data: videos
      .filter((v) => v.results?.alertness_percentages?.[label] !== undefined)
      .map((v, index) => ({
        x: index + 1,
        y: v.results.alertness_percentages[label],
      })),
  }));
  

  const renderItem = ({ item }: { item: any }) => {
    const { results, time_stored } = item;
    const date = (item.time_recorded?.toDate?.() || time_stored?.toDate?.() || new Date());

    return (
      <View style={styles.card}>
        <Text style={styles.date}>{format(date, "PPpp")}</Text>
        {results ? (
          <>
            <Text style={styles.stat}>
              <Text style={styles.label}>Eyes Closed:</Text> {results.eyes_closed_frames}
            </Text>
            <Text style={styles.stat}>
              <Text style={styles.label}>Yawning:</Text> {results.yawning_frames}
            </Text>
            <Text style={[styles.stat, { marginTop: 10 }]}>
              <Text style={styles.label}>Alertness:</Text>
            </Text>
            {["Alert", "Low Vigilant", "Very Drowsy"].map((state) => {
              const percent = results.alertness_percentages?.[state] ?? 0;
              return (
                <Text key={state} style={styles.stat}>- {state}: {percent.toFixed(1)}%</Text>
              );
            })}
          </>
        ) : (
          <Text style={styles.stat}>Results pending...</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back_arrow}>
        <Ionicons name="arrow-back" size={40} color="#99342C" />
      </TouchableOpacity>
      <Text style={{ fontWeight: 'bold', textAlign: 'center', color: '#4c4036', marginBottom: 10 }}>Alertness Over Time</Text>
      <AlertnessLineGraph data={alertnessGraphData} labels={alertnessLabels} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
        <Text style={{ color: 'green', marginHorizontal: 10 }}>Alert</Text>
        <Text style={{ color: 'orange', marginHorizontal: 10 }}>Low Vigilant</Text>
        <Text style={{ color: 'red', marginHorizontal: 10 }}>Very Drowsy</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : videos.length > 0 ? (
        <FlatList
          contentContainerStyle={styles.cardContainer}
          data={[...videos].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : (
        <Text style={styles.noDataText}>No past results yet.</Text>
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