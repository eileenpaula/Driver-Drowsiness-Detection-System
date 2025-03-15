import { View, Text, StyleSheet, Alert, TouchableOpacity} from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
import {Ionicons} from '@expo/vector-icons';

/*
    Currently:
        -Added basic buttons initially planned
        -Made majority of buttons do something 
    Future:
        -Make font "Instrument Sans"
        -Make sure camera and location access changes something
        -Give better descriptions
        -Add back button
        -Add and finish "report problem"
        -Add "Sound/Haptic Feedback" button if necessary 
       
*/

const settings = () => {

    const handleHelp = () => {
        Alert.alert(
            "Help",
            "Describe the app",
            [
                {text: "OK", onPress: () => console.log('Help ok'), style: "cancel"}
            ]
        )
    }

    const handleCameraAccess = () => {
        Alert.alert(
            'Camera Access',
            "Do you want",
            [ /* Make Sure that each option does something no -> denies access to camera yes -> allows access to camera*/
                {text: 'No', onPress: () => console.log('Camera access denied'), style: 'cancel'},
                {text: "Yes", onPress: () => console.log("camera works")}, 
            ],
            { cancelable: false}
        )
    }

    const handleLocationAccess = () => {
        Alert.alert(
            "Location Access",
            "Where you at",
            [ /* Make Sure that each option does something no -> denies access to camera yes -> allows access to camera*/
                {text: 'No', onPress: () => console.log('location access denied'), style: 'cancel'},
                {text: "Yes", onPress: () => console.log("location works")}, 
            ]
        )
    }


    /*
     <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => (alert('Settings Button Pressed'), console.log("The settings icon on the homepage was pressed!"))}
      >
        <Ionicons name="settings" size={40} color="#FF5555" />
      </TouchableOpacity>
    */
  return (
    <View style={styles.container}>
      < Link href='/home' style={styles.back_arrow}><Ionicons name="arrow-back" size={40} color="#FF5555" /></Link>
      <Text style={styles.title}>Settings</Text>
      < TouchableOpacity onPress={handleHelp}>
        < Text style={styles.link}>Help</Text>
      </TouchableOpacity>
      < TouchableOpacity onPress={handleCameraAccess}>
        <Text style={styles.link}> Camera Access </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLocationAccess}>
        < Text style={styles.link}>Location Access</Text>
      </TouchableOpacity>
      < Link href='https://www.nhtsa.gov/risky-driving/drowsy-driving' style={styles.link}>Facts about Driving Drowsy</Link>
      < Link href='/report_problem' style={styles.link}>Report Problem</Link>
    </View>
  )
}

export default settings

const styles = StyleSheet.create({
    container:{
        flex:1,
        flexDirection: 'column',
        backgroundColor: 'rgba(217,217,217,1)'
    },
    title: {
        color: 'black',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop:40,
        
    },
    link: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'white',
        paddingTop:20,
        paddingBottom:20,
        marginTop:20,
        marginBottom:5,
        marginLeft: 50,
        marginRight: 50,
        borderRadius:20,
    },
    back_arrow:{
        marginTop: 30,
        marginLeft: 30,
    }

})