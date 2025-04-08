import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useRef, useState, useEffect } from "react";
import { Button, Pressable, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Link } from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Progress from "react-native-progress";
import { useNavigation } from "@react-navigation/native";
import { DocumentData, setDoc, doc } from "firebase/firestore"; 
import { FIREBASE_AUTH, FIREBASE_DB } from "../database/.config";
import { Audio } from 'expo-av';
import { getStorage, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage'
import {v4 as uuidv4} from 'uuid'
import uuid from 'react-native-uuid';

export default function App() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView>(null);
  const [mode, setMode] = useState<CameraMode>("video");
  const [facing, setFacing] = useState<CameraType>("front");
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [indeterminate, setIndeterminate] = useState(true);
  const [waiting, setWaiting] = useState(true);
  const [data, setData] = useState(10);
  const [recordDuration, setRecordDuration] = useState(2);
  const [waitDuration, setWaitDuration] = useState(5)  
  const [activeUser, setActiveUser] = useState('');
  const [sound, setSound] = useState();

  async function playSound() {

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true, // Ensure sound plays even in silent mode on iOS
      allowsRecordingIOS: false
    });

    console.log('Loading Sound');
     const { sound } = await Audio.Sound.createAsync(
       require('../assets/test_audio.mp3')
    );
    setSound(sound);

    console.log('Playing Sound');
    await  sound.playAsync(); 
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
           sound.unloadAsync(); 
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
      const auth = FIREBASE_AUTH
      const user = auth.currentUser
      setActiveUser(user)
  }, []);

  const sendVideoToBackend = async (uri: string) => {
      const formData = new FormData();
    
      // React Native requires a specific structure for file uploads
      const file = {
        uri: uri,  // The local URI of the video file
        type: 'video/mp4',  // MIME type of the video file (adjust if necessary)
        name: 'video.mov',  // File name, you can make it dynamic
      };
    
      // Append the file to FormData
      formData.append('video', file); //Look into this error later something about blob??
    
      try {
        // This is the part where the actual file is sent to the backend
        const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP_ADDR}:5000/upload`, {
          method: 'POST',
          headers: {
            "Autherization": `${activeUser.stsTokenManager.accessToken}`
          },
          body: formData,  // FormData is the body of the request, containing the file
        });
    
        if (response.ok) {
          console.log('Video uploaded successfully');
        } else {
          console.log('Error uploading video');
        }
      } catch (error) {
        console.error('Error sending video:', error);
      }
  };

  const send_to_storage = (uri: string) => {
    const file_path =  `videos/${activeUser.uid}/${uuid.v4()}.mov`
    const storage = getStorage()
    const videoRef = ref(storage, file_path)

      // React Native requires a specific structure for file uploads
    const blub = new Blob([uri],{type: 'video/mp4'})
    const file = uploadBytesResumable(videoRef, blub)//{

      // Append the file to FormData
    file.on('state_changed',
      (snapshot) =>{
          const progress = (snapshot.bytesTransferred /snapshot.totalBytes) * 100
          console.log(`upload is ${progress.toFixed(2)}% done`)
      }
    )
      
    setDoc(doc(FIREBASE_DB, "users", activeUser.uid,'videos', uuid.v4()), {
      "file_path": file_path,
      "time_stored": Date.now()
    });

  }

  const fetchDataFromBackend = async () => {
    try {
      // Replace <your-ip> with your local network IP address
      const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP_ADDR}:5000/data`);
      
      if (response.ok) {
        const responseData = await response.json();
        setData(responseData.waitDuration)
        if(responseData.waitDuration < 20){
          playSound() 
        }
        console.log("Backend response: ",responseData)
        console.log("Upcoming wait time: ", data)
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error:', error);
      // Alert.alert('Error', 'Failed to fetch data from backend');
    }
  };


  const recordVideo = async () => {
    if (permission.granted){ //Might need to change this to permission && permission.granted
      console.log("INSIDE recordvideo")
      if (recording) {
        console.log("Already recording, stopping now...")
        stopRecording();
      } else {
        setRecording(true);
        console.log("New recording started...");
        const video = await camRef.current?.recordAsync();
        console.log({ video });
        // await sendVideoToBackend(video?.uri || "")
        send_to_storage(video?.uri || "")
      }
    }else{
      console.log("Permission not granted to record video")
    }
  };

  const stopRecording = () => {
    setRecording(false);
    console.log("Recording stopped.");
    camRef.current?.stopRecording();
  };

  /** First useEffect hook listens for changes to certain state vars that are changed (wiating, recordin, or waitDuration)
   * Program starts in the waiting phase. Conditional checks if waiting = true and recording = false. If condition is met, a setTimeout is started as an inital
   * waiting period/countdown before starting the recording cycle.
   * 
   */
  useEffect(() => {
    setProgress(0)
    if(waiting && !recording){
      let interval: ReturnType<typeof setInterval>;
      const timer = setTimeout(() => {
        setIndeterminate(false);
        interval = setInterval(() => {    //An interval is created to updated the progress every 100ms
          setProgress((prevProgress) =>{
              if (prevProgress >= 1){
                fetchDataFromBackend()
                setWaitDuration(data)
                console.log("Prev wait time: ", waitDuration)
                //setRecording(true);
                recordVideo();
                setWaiting(false);
                return 0
              }
              return prevProgress + 1 / waitDuration
              
          });
        }, waitDuration * 100);
      }, recordDuration * 100);
    
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
    };
    
    }
  }, [permission, waitDuration, recording]);

  /**This useEffect is triggered when the recording state changes. Program is in a reocrding phase when
   * recording become true and waiting become false. The recording cycle begins.
   * After recordDuration secs the stopREcording function is called and the progress is cleared.
   * Waiting is set to true
   */
  useEffect(() => {
    if (recording && !waiting) {
      console.log("recording now")
      let progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            clearInterval(progressInterval);
            return 1;
          }
          return prev + 1 / recordDuration; // Increment for 60 seconds
        });
      }, 1000);

      setTimeout(() => {
        stopRecording();
        clearInterval(progressInterval);
        setWaiting(true);
        setProgress(0);
        setTimeout(() => {
          setWaiting(true);
          setRecording(false);
        }, waitDuration * 1000); // Wait for 10 seconds
      }, recordDuration * 1000);
    }
  }, [permission, recording, waiting]);


  /**Permission Check: When the camera screen opens, the app firs checks if the camera permissions have been granted.
   * If not, a button is displayed to request perms. If perms are granted, the camera view is displayed.
   */
  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  //Rendering the camera view, progress bar, and back arrow
  const progressColor = recording === true ? "red" : "deepskyblue"
  const renderCamera = () => {
    return (
      <CameraView
        style={styles.camera}
        ref={camRef}
        mode={mode}
        facing={facing}
        mute={false}
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>
        </View>
        <Progress.Bar
          progress={progress}
          width={null}
          height={10}
          borderRadius={0}
          borderWidth={0}
          indeterminate={indeterminate}
          color={progressColor}
        />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back_arrow}>
          <Ionicons name="arrow-back" size={40} color="#FF5555" />
        </TouchableOpacity>
      </CameraView>
    );
  };

  return (
    <View style={styles.container}>
      {renderCamera()}
    </View>
  );
}

//Styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  back_arrow:{
    marginTop: 30,
    marginLeft: 30,
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  }
});