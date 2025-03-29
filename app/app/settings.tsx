import { Modal, View, Text, StyleSheet, Alert, TouchableOpacity, Button, FlatList, Linking} from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
import {Ionicons} from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";


/*
    Currently:
        -Added basic buttons initially planned
        -Made majority of buttons do something
        -Add back button 
    Future:
        -Make sure camera and location access changes something
        -Give better descriptions
        -Add and finish "report problem"
       
*/

export default function settings() {
    const [modalVisible, setModalVisible] = React.useState(false);
    const navigation = useNavigation();
    const handleOpenSettings = () => { Linking.openSettings() }; //technically this opens the settings for the phone and not the app because the app isn't published yet.


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

    //Help instructions
  const helpInstructions = [
    "Please allow for camera permissions to use the detection feature.",
    "Click the camera icon on the homepage to access the camera and start the drowsiness detection.",
    "Click the 'Driving Stats' button on the homepage to view your drowsy driving statistics.",
    "Click the profile icon (top left) to access your user profile, where you can update your emergency contact or password.",
    "The settings icon (top right) allows access to settings."
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back_arrow}>
        <Ionicons name="arrow-back" size={40} color="#FF5555" />
    </TouchableOpacity>

      <Text style={styles.title}>Settings</Text>

      {/* Help Button */}
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.settingButton}>
        <Text style={styles.buttonText}>Help</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How to Use the App</Text>

            <FlatList
              data={helpInstructions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Text style={styles.modalText}>• {item}</Text>
              )}
            />

            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Camera settings */}
      <TouchableOpacity onPress={() => handleOpenSettings()} style={styles.settingButton}>
        <Text style={styles.buttonText}>Camera Access</Text>
      </TouchableOpacity>
    

      {/* External Links--Report a prob send user the repos issues page.*/}
      <Link href="https://www.nhtsa.gov/risky-driving/drowsy-driving" style={styles.link}>
        Facts about Driving Drowsy
      </Link>
      <Link href="https://github.com/eileenpaula/Driver-Drowsiness-Detection-System/issues" style={styles.link}>Report Problem</Link>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "rgba(217,217,217,1)",
    padding: 20,
  },
  title: {
    color: "black",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  back_arrow: {
    marginTop: 30,
    marginLeft: 30,
  },
  settingButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    marginVertical: 10,
    marginHorizontal: 50,
    borderRadius: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    color: "#007BFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: "left",
    marginBottom: 8,
    lineHeight: 22,  // Improves readability
  },
});