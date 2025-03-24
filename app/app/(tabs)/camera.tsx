import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import react, { useRef, useState, useEffect } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Progress from "react-native-progress";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<CameraMode>("video");
  const [facing, setFacing] = useState<CameraType>("front");
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [indeterminate, setIndeterminate] = useState(true);
  const [waiting, setWaiting] = useState(true);
  const [data, setData] = useState(10);
  const [recordDuration, setRecordDuration] = useState(3);
  const [waitDuration, setWaitDuration] = useState(10)


  const sendVideoToBackend = async (uri: string) => {
      const formData = new FormData();
    
      // React Native requires a specific structure for file uploads
      const file = {
        uri: uri,  // The local URI of the video file
        type: 'video/mp4',  // MIME type of the video file (adjust if necessary)
        name: 'video.mov',  // File name, you can make it dynamic
      };
    
      // Append the file to FormData
      formData.append('video', file);
    
      try {
        // This is the part where the actual file is sent to the backend
        const response = await fetch('http://IP:5000/upload', {
          method: 'POST',
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

  const fetchDataFromBackend = async () => {
    try {
      // Replace <your-ip> with your local network IP address
      const response = await fetch('http://IP:5000/data');
      
      if (response.ok) {
        const responseData = await response.json();
        setData(responseData.waitDuration)
        console.log(responseData)
        console.log(data)
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error:', error);
      // Alert.alert('Error', 'Failed to fetch data from backend');
    }
  };


  const recordVideo = async () => {
    if (permission.granted){
      console.log("INSIDE recordvideo")
      if (recording) {
        console.log("inside recoridngin if record")
        stopRecording();
      } else {
        setRecording(true);
        console.log("Recording started...");
        const video = await ref.current?.recordAsync();
        console.log("Recording above")
        console.log({ video });
        await sendVideoToBackend(video?.uri || "")
      }
    }
  };

  const stopRecording = () => {
    setRecording(false);
    ref.current?.stopRecording();
    console.log("Recording stopped.");
  };

  useEffect(() => {
    setProgress(0)
    if(waiting && !recording){
      let interval: ReturnType<typeof setInterval>;
      const timer = setTimeout(() => {
        setIndeterminate(false);
        interval = setInterval(() => {
          setProgress((prevProgress) =>{
              if (prevProgress >= 1){
                fetchDataFromBackend()
                setWaitDuration(data)
                console.log(waitDuration)
                setRecording(true);
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
        console.log("should stop recording")
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

  const progressColor = recording === true ? "red" : "deepskyblue"
  const renderCamera = () => {
    return (
      <CameraView
        style={styles.camera}
        ref={ref}
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
        < Link href='../' style={styles.back_arrow}><Ionicons name="arrow-back" size={40} color="#FF5555" /></Link>
      </CameraView>
    );
  };

  return (
    <View style={styles.container}>
      {renderCamera()}
    </View>
  );
}

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