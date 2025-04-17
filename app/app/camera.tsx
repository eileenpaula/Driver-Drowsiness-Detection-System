import {
  Camera,
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useRef, useState, useEffect, useCallback} from "react";
import { Button, Pressable, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link } from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Progress from "react-native-progress";
import { useRouter } from "expo-router";
import { DocumentData, setDoc, doc, serverTimestamp } from "firebase/firestore"; 
import { FIREBASE_AUTH, FIREBASE_DB } from "../database/.config";
import { Audio } from 'expo-av';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import uuid from 'react-native-uuid';
import type { User } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { set } from "date-fns";



export default function App() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<any>(null);
  const [mode, setMode] = useState<CameraMode>("video");
  const [facing, setFacing] = useState<CameraType>("front");
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [indeterminate, setIndeterminate] = useState(true);
  const [waiting, setWaiting] = useState(true);
  const [data, setData] = useState(10);
  const [recordDuration, setRecordDuration] = useState(20);
  const [waitDuration, setWaitDuration] = useState(5)  
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [sound, setSound] = useState<Audio.Sound | undefined>(undefined);
  const [alertLevel, setAlertLevel] = useState('Alert');
  const [eyesState, setEyesState] = useState('Eyes Open');
  const [yawnState, setYawnState] = useState('Not Yawning');
  const [showAlert, setShowAlert] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [recordingStats, setRecordingStats] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [bufferTime, setBufferTime] = useState(5);
  const [dynamicWaitTime, setDynamicWaitTime] = useState<number | null>(null);
  const [modelResponseTimer, setModelResponseTimer] = useState<NodeJS.Timeout | null>(null);
  const [pendingLabelCheck, setPendingLabelCheck] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraMounted, setCameraMounted] = useState(false);
  const recordingTriggeredRef = useRef(false);
  const [firstRecordingDone, setFirstRecordingDone] = useState(false);



  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync();
  
      if (cameraStatus !== 'granted' || micStatus !== 'granted') {
        alert('Camera and microphone permissions are required to use this feature.');
      }
    })();
  }, []);

  useEffect(() => {
    console.log(`State update: recording=${recording}, waiting=${waiting}, processing=${isProcessingVideo}`);

    if (recording) {
    } else if (waiting) {
      //const waitTime = firstRecordingDone ? (dynamicWaitTime ?? waitDuration) : bufferTime;
      //setStatusMessage(`Waiting for next recording... (${waitTime}s)`);
    }
     else if (isProcessingVideo) {
      setStatusMessage(`Processing video...`);
    }

  }, [recording, waiting, isProcessingVideo, waitDuration]);

  const playSound = useCallback(async () => {

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true, // Ensure sound plays even in silent mode on iOS
      allowsRecordingIOS: false
    });

    console.log('Loading Sound');
     const { sound } = await Audio.Sound.createAsync(
       require('../assets/annoying_ring.mp3')
    );
    setSound(sound);

    console.log('Playing Sound');
    await  sound.playAsync(); 
  }, []);

  const send_to_storage = useCallback(async(uri: string) => {
    const file_path =  `videos/${activeUser.uid}/${uuid.v4()}.mov`
    const storage = getStorage()
    const videoRef = ref(storage, file_path)

    const response = await fetch(uri);
    const blob = await response.blob();

    // Append the file to FormData
    const uploadTask = uploadBytesResumable(videoRef, blob);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`upload is ${progress.toFixed(2)}% done`);
        }
      );
    
      const videoId = uuid.v4();
      await setDoc(doc(FIREBASE_DB, "users", activeUser.uid, "videos", videoId), {
        file_path,
        time_stored: serverTimestamp(),
        status: "pending"
      });
    
      setRecordingStats({ videoId });
      pollForResults(videoId); 

}, [activeUser]);

  // const fetchDataFromBackend = useCallback(async () => {
  //   try {
  //     const response = await fetch(`http://10.108.137.153:500/data`);
  //     const json = await response.json();
  //     return json;
  //   } catch (error) {
  //     console.error("Error fetching analysis results:", error);
  //     return null;
  //   }
  // }, [activeUser, playSound]);

  const pollForResults = (videoId: string) => {
    const docRef = doc(FIREBASE_DB, "users", activeUser.uid, "videos", videoId);
  
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      const data = docSnap.data();
      if (data?.status === "complete") {
        console.log("✅ Results ready:", data.results);
        const res = data.results;
  
        if (res?.alertness_counts && typeof res.alertness_counts === "object") {
          const counts = res.alertness_counts as Record<string, number>;
          const mostCommon = Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
          setAlertLevel(mostCommon);
          if(mostCommon === "Very Drowsy") {
            playSound(); // Play sound if "Very Drowsy" detected
          }
        
          
          let dynamicWaitTime = 10; // default fallback (3 minutes)
          // if (mostCommon === "Very Drowsy") {
          //   dynamicWaitTime = 300; // 5 minutes
          // } else if (mostCommon === "Low Vigilant") {
          //   dynamicWaitTime = 420; // 7 minutes
          // } else if (mostCommon === "Alert") {
          //   dynamicWaitTime = 600; // 10 minutes
          // }
          setDynamicWaitTime(dynamicWaitTime); 
          setWaitDuration(dynamicWaitTime); 
          console.log(`⏱️ Wait time until next recording: ${dynamicWaitTime / 60} minutes`);
        }
  
        if (res?.eyes_closed_frames !== undefined && res?.total_frames) {
          setEyesState(res.eyes_closed_frames > res.total_frames / 2 ? "Eyes Closed" : "Eyes Open");
        }
  
        setYawnState(res?.yawning_state ?? "Not Yawning");

  
        setShowAlert(res.alertness_counts?.["Very Drowsy"] > 3);
        setIsProcessingVideo(false); 
        setProcessingMessage("");
        setPendingLabelCheck(false);
        setRecordingComplete(true);
        setStatusMessage("Waiting for next recording...");
        setWaiting(true);
        unsubscribe();
      }
    });
  
    setPendingLabelCheck(true);
  };
   

  const stopRecording = useCallback(() => {
    console.log("Stopping recording...");
    setRecording(false);
    recordingTriggeredRef.current = false;
    console.log("Recording stopped.");
  }, []);
  

  const recordVideo = async () => {
    console.log("⚙️ Recording triggered");
  
    if (!camRef.current || !isCameraReady) {
      console.warn("❌ Camera not ready yet");
      return;
    }
    setRecordingComplete(false);
  
    try {
      recordingTriggeredRef.current = true;
      setRecording(true);
      console.log("🎥 Recording in progress");
      setStatusMessage("Recording...");
  
      const video = await camRef.current.recordAsync({
        maxDuration: recordDuration,
        quality: '480p',
        mute: false,
      });
  
      console.log("✅ Video recorded:", video.uri);
      setFirstRecordingDone(true);
      stopRecording();
      setIsProcessingVideo(true);
      setStatusMessage("Uploading video...");
      await send_to_storage(video.uri);
    } catch (err) {
      console.error("❌ Error during recording or analysis:", err);
      stopRecording();
    }
  };
  
  // const normalizeArray = useCallback((array: number[] | Float32Array): number[] => {
  //   const result = new Array(array.length).fill(0);
  //   const maxIndex = Array.from(array).indexOf(Math.max(...Array.from(array)));
  //   result[maxIndex] = 1;
  //   return result;
  // }, []);
  

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
           sound?.unloadAsync(); 
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
      const auth = FIREBASE_AUTH
      const user = auth.currentUser
      if (user) {
        setActiveUser(user);
      } else {
        console.warn("⚠️ No Firebase user is signed in.");
      }
  }, []);  

  /** First useEffect hook listens for changes to certain state vars that are changed (wiating, recordin, or waitDuration)
   * Program starts in the waiting phase. Conditional checks if waiting = true and recording = false. If condition is met, a setTimeout is started as an inital
   * waiting period/countdown before starting the recording cycle.
   * 
   */
  

  /**This useEffect is triggered when the recording state changes. Program is in a reocrding phase when
   * recording become true and waiting become false. The recording cycle begins.
   * After recordDuration secs the stopREcording function is called and the progress is cleared.
   * Waiting is set to true
   */
  
  useEffect(() => {
    if (
      !recordingTriggeredRef.current &&
      !recording &&
      !isProcessingVideo &&
      isCameraReady &&
      waiting
    ) {
      const delay = firstRecordingDone ? (dynamicWaitTime ?? waitDuration) : bufferTime;
      console.log(` ${firstRecordingDone ? "Waiting before next recording" : "Buffering before first recording"} (${delay} sec)`);
  
      recordingTriggeredRef.current = true;
      setProgress(0);
  
      let interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            clearInterval(interval);
            setProgress(0);
            setWaiting(false);
            recordVideo();
            return 0;
          }
          return prev + 1 / delay;
        });
      }, 1000);
  
      return () => clearInterval(interval);
    }
  }, [recording, isProcessingVideo, waiting, dynamicWaitTime, waitDuration, bufferTime, isCameraReady, firstRecordingDone]);
    
  
  


  //Rendering the camera view, progress bar, and back arrow
  const renderCamera = () => {
    return (
      <CameraView
      ref={camRef}
      mode = {mode}
      style={styles.camera}
      facing={facing}
      mute = {false}
      onCameraReady={() => {
        console.log("✅ onCameraReady triggered!");
        setIsCameraReady(true);
        setCameraMounted(true);
      }}
      onMountError={(error) => {
        console.error("❌ Camera mount error:", error);
        setIsCameraReady(false);
      }}
    >
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{statusMessage}</Text>
      </View>
      <Progress.Bar
        progress={progress}
        width={null}
        height={10}
        borderRadius={0}
        borderWidth={0}
        indeterminate={indeterminate}
        color={recording ? "red" : "deepskyblue"}
      />
      <TouchableOpacity
        onPress={() => {
          setRecording(false);
          setIsProcessingVideo(false);
          setWaiting(false);
          setCameraMounted(false);
          setIsCameraReady(false);
          if (modelResponseTimer) clearTimeout(modelResponseTimer);
          recordingTriggeredRef.current = false;
          setStatusMessage("Recording cancelled");
          router.back();
        }}
        style={styles.back_arrow}
      >
        <Ionicons name="arrow-back" size={40} color="#FF5555" />
      </TouchableOpacity>
    </CameraView>

    );
  };

  // Render processing overlay
  const renderProcessingOverlay = () => {
    return (
      <View style={styles.processingOverlay}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.processingText}>{processingMessage}</Text>
      </View>
    );
  };


  /**Permission Check: When the camera screen opens, the app first checks if the camera permissions have been granted.
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


  return (
    <View style={styles.container}>
      {renderCamera()}
      
      {isProcessingVideo && renderProcessingOverlay()}

      {pendingLabelCheck && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingText}>Calculating drowsiness...</Text>
        </View>
      )}
      
      {!isProcessingVideo && recordingComplete && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Analysis Results</Text>
          <View style={styles.resultsDetails}>
            <Text style={styles.drowsinessStatusText}>Alertness: {alertLevel}</Text>
            <Text style={styles.drowsinessStatusText}>Eyes: {eyesState}</Text>
            <Text style={styles.drowsinessStatusText}>Yawn: {yawnState}</Text>
          </View>
        </View>
      )}
      
      {showAlert && (
        <View style={styles.alertOverlay}>
          <Text style={styles.alertText}>DROWSINESS DETECTED!</Text>
          <TouchableOpacity 
            style={styles.alertButton}
            onPress={() => setShowAlert(false)}
          >
            <Text style={styles.alertButtonText}>I'm Awake</Text>
          </TouchableOpacity>
        </View>
      )}
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
  back_arrow: {
    position: "absolute",  // Ensures it's floating
    top: 40,               // Adjust for safe area
    left: 20,
    zIndex: 1000,          // Keeps it above other components
    padding: 5,
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
  },
  statusContainer: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    zIndex: 100,
  },
  statusText: {
    color: "white",
    fontWeight: "bold",
  },
  drowsinessStatusContainer: {
    position: "absolute",
    top: 90,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 10,
    zIndex: 100,
  },
  drowsinessStatusText: {
    color: "white",
    fontSize: 12,
    marginBottom: 2,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
  },
  alertButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  resultsContainer: {
    position: "absolute",
    top: 90,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 12,
    borderRadius: 12,
    zIndex: 100,
    alignItems: "flex-start",
  },
  
  resultsTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  
  resultsDetails: {
    marginTop: 4,
  },
});