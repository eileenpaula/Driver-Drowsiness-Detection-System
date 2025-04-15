/* Updated the entry page (homepage) to contain the product logo and name. 
* Added buttons for the settings and camera
* Added authentication check to redirect to login if not authenticated
/* Edite Camera and Settings to use TouchableOpacity wrapped in the link bc of expo-router usage.
Was recieving an error with href--> using ./settings fixed it, something to do with the path idk
* Placeholder font for title
*  -nage
*/
import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import {useFonts} from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { Link } from 'expo-router';
import { FIREBASE_AUTH } from '../database/.config';
import { onAuthStateChanged, User} from "firebase/auth";

export default function Index() {
  const [loadFonts]=useFonts({
    'IS': require('../assets/fonts/Instrument_Sans.ttf'),
    'ISBold': require('../assets/fonts/InstrumentSans-Bold.ttf'),
  })
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setUser(user);
      setLoading(false);
      
      if (!user) {
        // Redirect to login if not authenticated
        router.replace('/login');
      }
    });

    return unsubscribe; // Cleanup subscription
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5555" />
      </View>
    );
  }

  if (!user) {
    // This will be briefly shown before the router redirects
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5555" />
      </View>
    );
  }

  return (
    <View style={styles.logoContainer}>
      {/*Logo*/}
      <Image source={require("../assets/images/logo2.png")} style={styles.logo} />

      {/*Product Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Driver{'\n'}Drowsiness{'\n'}Detection{'\n'}
        <Text style={{ color: '#99342C' }}>System</Text>
        </Text>
      </View>


      {/*Profile and Settings Button*/}
      <View style={styles.header}>
        <Link href="./profile" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-circle-outline" size={45} color="#99342C" />
          </TouchableOpacity>
        </Link>

        <Link href="./settings" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={45} color="#99342C" />
          </TouchableOpacity>
        </Link>
      </View>

      {/*Stats Button */}
      <TouchableOpacity style={styles.statsButton} 
        onPress={() => (router.push("./stats"), console.log("The stats button on the homepage was pressed!"))}>
        <Text style={styles.statsText}> Driving Stats </Text>
        <Ionicons name="arrow-forward" size={20} color="black" />
      </TouchableOpacity>

      {/*Camera Button */}
      < Link href='./camera' asChild>
      <TouchableOpacity style={styles.cameraButton}>
        <Ionicons name= "camera-outline" size = {35} color="black" />
      </TouchableOpacity>
      </Link> 

    </View> 
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    position: "absolute",
    top: 50,
  },

  iconButton: {
    //color: "#99342C",
    padding: 10,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(206, 209, 184)"
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D9D9D9"
  },

  titleContainer: {
    justifyContent: "flex-start",
    left: -30,
    margin: 5,
  },

  title: {
    fontFamily: "ISBold",
    //color: '#99342C',
    fontSize: 25,
    textAlign: "left",
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: "bold",
    marginBottom: 20,
  },

  logo: {
    width: 255,
    height: 130,
    resizeMode: "contain",
    margin: 5,
  },

  cameraButton: {
    position: 'absolute',
    bottom: 50, 
    borderRadius: 50,
    padding: 15,
    borderWidth: 2,
    //backgroundColor: '#d8450b',
    backgroundColor: 'rgba(124, 201, 204, 0.29)',
    marginTop: 20,
  },

  statsButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30,
    backgroundColor: 'rgba(235, 236, 222, 0.8)',
    //backgroundColor: '#F0F2ED',
  },

  statsText: {
    textAlign: 'center',
    alignContent: 'center',
    color: 'black',
    letterSpacing: 1,
    fontWeight: '500',
    fontSize: 18,
  },
});
