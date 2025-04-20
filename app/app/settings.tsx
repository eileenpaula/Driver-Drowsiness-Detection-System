import { Modal, View, Text, StyleSheet, Alert, TouchableOpacity, Button, FlatList, Linking} from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
import {Ionicons} from '@expo/vector-icons';
import { useRouter } from 'expo-router';


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
    const router = useRouter();
    const handleOpenSettings = () => { Linking.openSettings() }; //technically this opens the settings for the phone and not the app because the app isn't published yet.


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
      <TouchableOpacity onPress={() => router.back()} style={styles.back_arrow}>
        <Ionicons name="arrow-back" size={40} color="#99342C" />
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
      <Link href="https://www.nhtsa.gov/risky-driving/drowsy-driving" asChild>
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.buttonText}>Driving Safety</Text>
        </TouchableOpacity>
      </Link>

      <Link href="https://github.com/eileenpaula/Driver-Drowsiness-Detection-System/issues" asChild>
        <TouchableOpacity style={styles.settingButton}>
          <Text style= {styles.buttonText}>Report Problem</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "rgb(206, 209, 184)",
    padding: 20,
  },
  title: {
    color: "black",
    fontSize: 24,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 80,
    marginBottom: 40,
  },
  back_arrow: {
    position: "absolute",  // Ensures it's floating
    top: 40,               // Adjust for safe area
    left: 20,
    zIndex: 1000,          // Keeps it above other components 
    padding: 10,

}, 
  settingButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    backgroundColor: 'rgba(235, 236, 222, 0.8)',
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