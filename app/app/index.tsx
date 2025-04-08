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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { Link } from 'expo-router';
import { FIREBASE_AUTH } from './database/.config';
import { onAuthStateChanged, User} from "firebase/auth";

export default function Index() {
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
      <Image source={require("../assets/images/LOGO.png")} style={styles.logo} />

      {/*Product Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Driver{'\n'}Drowsiness{'\n'}Detection{'\n'}System</Text>
      </View>

      {/*Profile and Settings Button*/}
      <View style={styles.header}>
        <Link href="./profile" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-circle-sharp" size={45} color="black" />
          </TouchableOpacity>
        </Link>

        <Link href="./settings" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings" size={45} color="#FF5555" />
          </TouchableOpacity>
        </Link>
      </View>

      {/*Stats Button */}
      <TouchableOpacity style={styles.statsButton} 
        onPress={() => (router.push("./stats"), console.log("The stats button on the homepage was pressed!"))}>
        <Text style={styles.statsText}>Driving Stats</Text>
        <Ionicons name="arrow-forward" size={20} color="black" />
      </TouchableOpacity>

      {/*Camera Button */}
      < Link href='./camera' asChild>
      <TouchableOpacity style={styles.cameraButton}>
        <Ionicons name= "camera-outline" size = {40} color="black" />
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
    padding: 10,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D9D9D9"
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

  settingsButton: {
    position: "absolute",
    top: 50,
    right: 20,
  },

  title: {
    fontSize: 24,
    textAlign: "left",
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'Arial',
    fontWeight: "bold",
    marginBottom: 20,
  },

  logo: {
    width: 225.6,
    height: 100.33,
    resizeMode: "contain",
    marginBottom: 20,
  },

  cameraButton: {
    position: 'absolute',
    bottom: 50, 
    borderRadius: 50,
    padding: 10,
    borderWidth: 3,
    borderColor: '#FF5555',
    backgroundColor: '#F0B4B4',
    marginTop: 20,
  },

  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30,
    backgroundColor: 'white',
  },

  statsText: {
    textAlign: 'center',
    alignContent: 'center',
    color: 'black',
    letterSpacing: 1,
    fontWeight: 'medium',
    fontSize: 18,
  },
});