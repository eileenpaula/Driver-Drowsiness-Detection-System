import {
  Camera,
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useRef, useState, useEffect, useCallback } from "react";
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
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';

interface DrowsinessResult{
  alertLevel: string;
  eyesState: string;
  yawnState: string;
  drowsinessScore: number;
  timestamp?: number;
  rawSccores?:{
    drowsiness: number[];
    eyes: number[];
    yawn: number[];
  };
  normalizedScores?: {
    drowsiness: number[];
    eyes: number[];
    yawn: number[];
  };
}


export default function App() {
  const router = useRouter();
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
  const [sound, setSound] = useState<Audio.Sound | undefined>(undefined);
  const [isModelReady, setIsModelReady] = useState(false);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [alertLevel, setAlertLevel] = useState('Alert');
  const [eyesState, setEtesState] = useState('Eyes Open');
  const [yawnState, setYawnState] = useState('Not Yawning');
  const [drowsinessScore, setDrowsinessScore] = useState(0);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [recordingStats, setRecordingStats] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [cycleCount, setCycleCount] = useState(0);

  const IMAGE_SIZE = 224;
  const DROWSINESS_THRESHOLD = 0.6;

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
      setStatusMessage(`Recording... (Cycle ${cycleCount})`);
    } else if (waiting) {
      setStatusMessage(`Waiting for next recording... (${waitDuration}s)`);
    } else if (isProcessingVideo) {
      setStatusMessage(`Processing video...`);
    }

  }, [recording, waiting, isProcessingVideo, cycleCount, waitDuration]);

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

  const sendVideoToBackend = useCallback(async (uri: string) => {
      const formData = new FormData();
    
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
  }, [activeUser]);

  const send_to_storage = useCallback((uri: string) => {
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

  }, [activeUser]);

  const fetchDataFromBackend = useCallback(async () => {
    try {
      // console.log('inside fetchdata',process.env.EXPO_PUBLIC_IP_ADDR)
      // Replace <your-ip> with your local network IP address
      // const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP_ADDR}:5000/data`);
      const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP_ADDR}:5000/data`, {
        method: 'POST',
        headers: {
          "Autherization": `${activeUser.stsTokenManager.accessToken}`
        }
      })

      if (response.ok) {
        const responseData = await response.json();
        setData(responseData.waitDuration)
        if(responseData.waitDuration < 20){
          playSound() 
        }
        console.log('Video uploaded successfully');
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, [activeUser, playSound]);

  const stopRecording = useCallback(() => {
    setRecording(false);
    console.log("Recording stopped.");
    camRef.current?.stopRecording();
  }, []);

  const recordVideo = useCallback(async () => {
    if (!permission?.granted) {
      console.log("Permission not granted to record video");
      return;
    }
    
    console.log("INSIDE recordvideo");
    if (recording) {
      console.log("Already recording, stopping now...");
      stopRecording();
    } else {
      setRecording(true);
      setRecordingComplete(false);
      setRecordingStats(null);
      console.log("New recording started...");
      
      try {
        const video = await camRef.current?.recordAsync();
        console.log({ video });
        
        // Save recording stats for UI display
        if (video) {
          setRecordingStats({
            uri: video.uri,
            duration: recordDuration,
            timestamp: new Date().toLocaleTimeString()
          });
          await captureFrameForDrowsiness(video.uri);        }
        
        // Start processing the recorded video
        send_to_storage(video?.uri || "");
      } catch (recordingError) {
        console.error('Error recording video:', recordingError);
        setRecording(false);
        setWaiting(true);
      }
    }
  }, [permission, recording, stopRecording, send_to_storage, recordDuration]);

  const normalizeArray = useCallback((array: number[] | Float32Array): number[] => {
    const result = new Array(array.length).fill(0);
    const maxIndex = Array.from(array).indexOf(Math.max(...Array.from(array)));
    result[maxIndex] = 1;
    return result;
  }, []);

  const setupTensorFlow = useCallback(async () => {
    try{
      await tf.ready();
      console.log("TensorFlow is ready!");

      console.log('Loading drowsiness detection model...');

      try{
        const model = await tf.loadLayersModel(
          bundleResourceIO(
            require('../assets/model/model.json'),
            require('../assets/model/weights.bin')
          )
        );
        
        // Warm up the model with a dummy tensor
        const dummyInput = tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3]);
        const warmupResult = model.predict(dummyInput);
        
        if (Array.isArray(warmupResult)) {
          warmupResult.forEach(tensor => tensor.dispose());
        } else {
          warmupResult.dispose();
        }
        
        dummyInput.dispose();
        setModel(model);
        setIsModelReady(true);
        console.log("Model loaded and warmed up successfully!");
      } catch (e) {
        console.error("Error loading model:", e);
        if (e instanceof Error) {
          console.error(e.stack); // Log the full stack trace
        } else {
          console.error("An unknown error occurred:", e);
        }

      }
    } catch (error) {
      console.error("Error setting up TensorFlow:", error);
    }
  }, [IMAGE_SIZE]);
  
  const processFrameForDrowsiness = useCallback(async (frameUri: string): Promise<DrowsinessResult | null> => {

    if(!isModelReady || isProcessingFrame || !model) {
      return null;
    }

    setIsProcessingFrame(true);
    try {

      const imgB64 = await FileSystem.readAsStringAsync(frameUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
      const raw = new Uint8Array(imgBuffer);
      const imgTensor = decodeJpeg(raw);

      let processedTensor = tf.image.resizeBilinear(imgTensor, [IMAGE_SIZE, IMAGE_SIZE]);
      processedTensor = tf.div(processedTensor, 255.0); // Normalize to [0, 1]
      processedTensor = tf.expandDims(processedTensor, 0);

      const predictions = await model.predict(processedTensor);

      let rawDrowsinessScores: Float32Array | number[], 
          rawEyesStateScores: Float32Array | number[], 
          rawYawnStateScores: Float32Array | number[];

      if (Array.isArray(predictions)) {
        rawDrowsinessScores = Array.from(await (predictions[0] as tf.Tensor).data());
        rawEyesStateScores = Array.from(await (predictions[1] as tf.Tensor).data());
        rawYawnStateScores = Array.from(await (predictions[2] as tf.Tensor).data());

        predictions.forEach(tensor => tensor.dispose());
      } else {
        const allScores = await predictions.data();
        rawDrowsinessScores = Array.from(allScores.slice(0, 3));
        rawEyesStateScores = Array.from(allScores.slice(3, 5));
        rawYawnStateScores = Array.from(allScores.slice(5, 7));
        predictions.dispose();
      }

      const drowsinessScores = normalizeArray(rawDrowsinessScores);
      const eyesStateScores = normalizeArray(rawEyesStateScores);
      const yawnStateScores = normalizeArray(rawYawnStateScores);

      const alertnessLabels = ['Alert', 'Low Vigilant', 'Very Drowsy'];
      const eyesLabels = ['Eyes Open', 'Eyes Closed'];
      const yawnLabels = ['Normal', 'Talking', 'Yawning'];

      const alertnessIndex = drowsinessScores.indexOf(1);
      const eyesIndex = eyesStateScores.indexOf(1);
      const yawnIndex = yawnStateScores.indexOf(1);

      let calculated: number;
      if(drowsinessScores[2] ===1){
        calculated = 1.0;

      } else if(drowsinessScores[1] === 1){
        calculated = 0.5;
      } else{
        calculated = 0.0;
      }

      setAlertLevel(alertnessLabels[alertnessIndex]);
      setEtesState(eyesLabels[eyesIndex]);
      setYawnState(yawnLabels[yawnIndex]);
      setDrowsinessScore(calculated);

      if (calculated > DROWSINESS_THRESHOLD) {
        setShowAlert(true);
        playSound();
      }

      imgTensor.dispose();
      processedTensor.dispose();
      return {
        alertLevel: alertnessLabels[alertnessIndex],
        eyesState: eyesLabels[eyesIndex],
        yawnState: yawnLabels[yawnIndex],
        drowsinessScore: calculated,
        rawSccores: {
          drowsiness: Array.from(rawDrowsinessScores),
          eyes: Array.from(rawEyesStateScores),
          yawn: Array.from(rawYawnStateScores)
        },
        normalizedScores: {
          drowsiness: drowsinessScores,
          eyes: eyesStateScores,
          yawn: yawnStateScores,
        },
      };

    } catch (error) {
      console.error("Error processing frame:", error);
      return null;
    } finally{
      setIsProcessingFrame(false);
    }

  }, [IMAGE_SIZE, DROWSINESS_THRESHOLD, isModelReady, isProcessingFrame, model, normalizeArray, playSound]);

  const captureFrameForDrowsiness = useCallback(async (uri?: string): Promise<void> => {
    if(!isModelReady || (!camRef.current && !uri)) {
      return;
    }

    try{
      let imageUri = uri;
      if (!imageUri) {
        const picture = await camRef.current?.takePictureAsync({ quality: 0.5, base64: true, skipProcessing: true });
        if (!picture?.uri) {
          console.warn("No image captured for drowsiness detection.");
          return;
        }
      imageUri = picture.uri;
      }

      const drowsinessResults = await processFrameForDrowsiness(imageUri);

      if(drowsinessResults) {
        setDoc(doc(FIREBASE_DB, "users", activeUser.uid, 'drowsiness', uuid.v4()), {
          ...drowsinessResults,
          timestamp: Date.now(),
        });

        setAlertLevel(drowsinessResults.alertLevel);
        setEtesState(drowsinessResults.eyesState);
        setYawnState(drowsinessResults.yawnState);
        setRecordingComplete(true);
      }
    } catch (error) {
      console.error("Error capturing frame:", error);
    }

  }, [activeUser, isModelReady, processFrameForDrowsiness]);

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
      setActiveUser(user)
  }, []);

  useEffect(() => {
    setupTensorFlow();
  }, [setupTensorFlow]);

  useEffect(() => {
    setProgress(0)
    if(waiting && !recording && !isProcessingVideo) {
      console.log("Waiting for recording to start...");
      setProgress(0);
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
        if (interval) clearInterval(interval);
    };
    
    }
  }, [data, fetchDataFromBackend, recordDuration, recordVideo, recording, waitDuration, waiting, isProcessingVideo]);

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

      const recordingTimeout = setTimeout(() => {
        console.log("Recording duration complete");
        stopRecording();
        clearInterval(progressInterval);
        setProgress(0);
        
        // After stopping recording, start processing immediately
        // The UI will show processing state now
      }, recordDuration * 1000);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(recordingTimeout);
      };
    }
  }, [recordDuration, recording, stopRecording, waiting, isProcessingVideo]);

  useEffect(() => {
    setupTensorFlow()
  }, []);

  useEffect(() =>{
    let drowsinessCheckInterval: ReturnType<typeof setInterval> | undefined;

    if(recording && isModelReady){
      drowsinessCheckInterval = setInterval(() => {
        captureFrameForDrowsiness();
      }, 1000); // Capture every second
    }

    return () => {
      if(drowsinessCheckInterval) {
        clearInterval(drowsinessCheckInterval);
      }
    };
  }, [captureFrameForDrowsiness, recording, isModelReady]);

  //Rendering the camera view, progress bar, and back arrow
  
  const renderCamera = () => {
    const progressColor = recording === true ? "red" : "deepskyblue"
    return (
      <CameraView
        style={styles.camera}
        ref={camRef}
        mode={mode}
        facing={facing}
        mute={false}
        responsiveOrientationWhenOrientationLocked
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
          color={progressColor}
        />
        <TouchableOpacity onPress={() => router.back()} style={styles.back_arrow}>
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