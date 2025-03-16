/* Updtated the entry page (homepage) to contain the product logo and name. 
* Added buttons for the settings and camera (non functional at the moment)
* Added console printouts for testing purposes.
* Placeholder font for title
*  -nage
*/
import React from "react";
import { View, Text, Button, Image, StyleSheet, TouchableOpacity} from "react-native";
import {Ionicons} from '@expo/vector-icons';
import { Link } from 'expo-router'

export default function index() {
  return (
    <View style = {styles.logoContainer}>
      {/*Logo*/}
      <Image source={require("../../assets/images/LOGO.png")} style={styles.logo} />

      {/*Product Title */}
      <View style = {styles.titleContainer}>
        <Text style={styles.title}>Driver{'\n'}Drowsiness{'\n'}Detection{'\n'}System</Text>
      </View>

      {/*Settings Button*/}
      < Link href='/settings'
        style={styles.settingsButton}>
        <Ionicons name="settings" size={40} color="#FF5555" />
      </Link>

      {/*Stats Button */}
      <TouchableOpacity style={styles.statsButton} 
        onPress={() => (alert('Driving Stats Button Pressed'), console.log("The stats button on the homepage was pressed!"))}>
        <Text style={styles.statsText}>Driving Stats</Text>
        <Ionicons name="arrow-forward" size={20} color="black" />
      </TouchableOpacity>

      {/*Camera Button */}
      < Link href='/camera' 
        style={styles.cameraButton}>
        <Ionicons name= "camera-outline" size = {40} color="black" />
      </Link> 

    </View> 
  );
}

const styles = StyleSheet.create({
  logoContainer: {
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
    position: 'absolute',
    top: 50,
    right: 20,
  },

  title: {
      fontSize: 24,
      textAlign: "left",
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontFamily: 'Arial', //Placeholder font
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

})
