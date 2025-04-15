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
import { DocumentData, setDoc, doc } from "firebase/firestore"; 
import { FIREBASE_AUTH, FIREBASE_DB } from "../database/.config";
import { Audio } from 'expo-av';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import uuid from 'react-native-uuid';
import type { User } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";



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
  const [recordDuration, setRecordDuration] = useState(60);
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
  const [bufferTime, setBufferTime] = useState(10);
  const [dynamicWaitTime, setDynamicWaitTime] = useState<number | null>(null);
  const [modelResponseTimer, setModelResponseTimer] = useState<NodeJS.Timeout | null>(null);
  const [pendingLabelCheck, setPendingLabelCheck] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraMounted, setCameraMounted] = useState(false);
  const recordingTriggeredRef = useRef(false);


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
      setStatusMessage(`Waiting for next recording... (${waitDuration}s)`);
    } else if (isProcessingVideo) {
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

    const blub = new Blob([uri],{type: 'video/mp4'})
    const file = uploadBytesResumable(videoRef, blub)//{

      // Append the file to FormData
    file.on('state_changed',
      (snapshot) =>{
          const progress = (snapshot.bytesTransferred /snapshot.totalBytes) * 100
          console.log(`upload is ${progress.toFixed(2)}% done`)
      }
    )
      
    const videoId = uuid.v4();
    await setDoc(doc(FIREBASE_DB, "users", activeUser.uid, "videos", videoId), {
      file_path,
      time_stored: Date.now(),
      status: "pending"
    });

    setRecordingStats({ videoId });

  }, [activeUser]);

  const fetchDataFromBackend = useCallback(async () => {
    try {
      const response = await fetch(`http://10.108.137.153:500/data`);
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Error fetching analysis results:", error);
      return null;
    }
  }, [activeUser, playSound]);

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
        } else {
          console.warn("⚠️ Missing or invalid alertness_counts:", res);
          setAlertLevel("Unknown");
        }
        if (res?.eyes_closed_frames !== undefined && res?.total_frames) {
          setEyesState(res.eyes_closed_frames > res.total_frames / 2 ? "Eyes Closed" : "Eyes Open");
        }
        
        if (res?.yawning_frames !== undefined) {
          setYawnState(res.yawning_frames > 1 ? "Yawning" : "Not Yawning");
        }
  
        setShowAlert(res.alertness_counts["Very Drowsy"] > 3);
        setPendingLabelCheck(false);
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

  // const sendVideoToBackend = async (videoUri: string) => {
  //   const formData = new FormData();
  //   formData.append("video", {
  //     uri: videoUri,
  //     type: "video/mp4",
  //     name: "video.mp4"
  //   });
  
  //   const res = await fetch("http://10.108.137.153:5000/analyze-video", {
  //     method: 'POST',
  //     headers: {
  //       Authorization: activeUser?.stsTokenManager.accessToken ?? '',
  //     },
  //     body: formData,
  //   });
  
  //   const json = await res.json();
  //   console.log("💡 Analysis result:", json);
  //   return json;
  // };
  

  const recordVideo = async () => {
    console.log("⚙️ Recording triggered");
    setWaiting(false);
    setRecording(true);
    recordingTriggeredRef.current = true;
  };
  
  const normalizeArray = useCallback((array: number[] | Float32Array): number[] => {
    const result = new Array(array.length).fill(0);
    const maxIndex = Array.from(array).indexOf(Math.max(...Array.from(array)));
    result[maxIndex] = 1;
    return result;
  }, []);
  

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


  useEffect(() => {
    setProgress(0)
    if(waiting && !recording && !isProcessingVideo) {
      setCameraMounted(true);
      console.log("Waiting for recording to start...");
      let waitTime = dynamicWaitTime ?? waitDuration;
      setProgress(0);
      let interval: ReturnType<typeof setInterval>;

      const totalWaitTime = recordDuration + bufferTime;
      const bufferTimer = setTimeout(() => {
        setStatusMessage("Buffering camera...");
      }, recordDuration * 1000);

    const startRecordingTimer = setTimeout(() => {
      setIndeterminate(false);
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 1) {
            setWaitDuration(data);
            setWaiting(false);
            setDynamicWaitTime(null);
            return 0;
          }
          return prevProgress + 1 / waitTime;
        });
      }, waitTime * 100);
    }, totalWaitTime * 1000);
    
    return () => {
      clearTimeout(bufferTimer);
      clearTimeout(startRecordingTimer);
      if (interval) clearInterval(interval);
    };
    
    }
  }, [data, fetchDataFromBackend, recordDuration, recordVideo, recording, waitDuration, waiting, isProcessingVideo, dynamicWaitTime, pendingLabelCheck]);

  useEffect(() => {
    if (
      cameraMounted &&
      isCameraReady &&
      waiting &&
      !recording &&
      !isProcessingVideo &&
      !pendingLabelCheck
    ) {
      recordingTriggeredRef.current = true;
      console.log("✅ Camera is ready and mounted. Starting buffer countdown...");
      setTimeout(() => {
        if (camRef.current) {
          recordVideo();
        } else {
          console.warn("❌ Camera still not fully ready. Skipping this round.");
          setIsCameraReady(false); // Reset to retry next cycle
        }
      }, 500); // short delay to avoid race condition
    }
  }, [
    cameraMounted,
    isCameraReady,
    waiting,
    recording,
    isProcessingVideo,
    pendingLabelCheck,
  ]);
  

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
    if (recording && !waiting && !isProcessingVideo) {
      console.log("🎥 Recording useEffect triggered");
  
      let progressInterval: any;
  
      const startRecording = async () => {
        try {
          const video = await camRef.current?.recordAsync({ maxDuration: recordDuration, quality: '720p' });
      
          if (!video?.uri) {
            console.warn("⚠️ No video URI returned from recordAsync");
            return;
          }
      
          setIsProcessingVideo(true);
          setStatusMessage("Analyzing video...");
          setProcessingMessage("Analyzing video...");
          
          await send_to_storage(video.uri);
          pollForResults(recordingStats?.videoId);
      
        } catch (err) {
          console.error("❌ Error during recording or analysis:", err);
          setStatusMessage("Recording failed");
        } finally {
          setRecording(false);
          recordingTriggeredRef.current = false;
          setRecordingComplete(true);
          setIsProcessingVideo(false);
          setWaiting(false);
          setProgress(0);
          setProcessingMessage("");
          if (progressInterval) clearInterval(progressInterval);
        }
      };
      
  
      // Start progress bar
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            clearInterval(progressInterval);
            return 1;
          }
          return prev + 1 / recordDuration;
        });
      }, 1000);
  
      //setIsProcessingVideo(true);
      setWaiting(false);
      setStatusMessage("Recording...");
      startRecording();
  
      return () => {
        clearInterval(progressInterval);
      };
    }
  }, [recording, waiting, isProcessingVideo, recordDuration, playSound]);
  
  


  //Rendering the camera view, progress bar, and back arrow
  const renderCamera = () => {
    const progressColor = recording === true ? "red" : "deepskyblue"
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
          console.log("🔙 Back button pressed on camera screen");
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
      {cameraMounted && renderCamera()}
      
      {isProcessingVideo && renderProcessingOverlay()}

      {pendingLabelCheck && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingText}>Calculating drowsiness...</Text>
        </View>
      )}
      
      {!isProcessingVideo && recordingComplete && (
        <View style={styles.drowsinessStatusContainer}>
        <Text style={styles.drowsinessStatusText}>Alertness: {alertLevel}</Text>
        <Text style={styles.drowsinessStatusText}>Eyes: {eyesState}</Text>
        <Text style={styles.drowsinessStatusText}>Yawn: {yawnState}</Text>
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
});