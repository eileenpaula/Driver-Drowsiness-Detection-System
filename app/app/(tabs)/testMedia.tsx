import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState, useEffect } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { AntDesign } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";
import * as Progress from "react-native-progress";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [indeterminate, setIndeterminate] = useState(true);
  const [waiting, setWaiting] = useState(false);

  const recordDuration = 10; // Recording time in seconds
  const waitDuration = 10; // Wait time in seconds

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
        const response = await fetch('http://<IP>:5000/upload', {
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

  useEffect(() => {
    if (waiting) return;

    if (recording) {
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
          setWaiting(false);
        }, waitDuration * 1000); // Wait for 10 seconds
      }, recordDuration * 1000);
    }
  }, [recording, waiting]);

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

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    if (photo?.uri) {
      setUri(photo.uri);
    }
  };

  const recordVideo = async () => {
    if (recording) {
      stopRecording();
    } else {
      setRecording(true);
      console.log("Recording started...");
      const video = await ref.current?.recordAsync();
      console.log({ video });
      await sendVideoToBackend(video?.uri || "")

    }
  };

  const stopRecording = () => {
    setRecording(false);
    ref.current?.stopRecording();
    console.log("Recording stopped.");
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "picture" ? "video" : "picture"));
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const renderPicture = () => {
    return (
      <View>
        <Image
          source={{ uri: uri || "" }}
          resizeMode="contain"
          style={{ width: 300, aspectRatio: 1 }}
        />
        <Button onPress={() => setUri(null)} title="Take another picture" />
      </View>
    );
  };

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
          <Pressable onPress={toggleMode}>
            {mode === "picture" ? (
              <AntDesign name="picture" size={32} color="white" />
            ) : (
              <Feather name="video" size={32} color="white" />
            )}
          </Pressable>
          <Pressable onPress={recordVideo}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: mode === "picture" ? "white" : "red",
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>
          <Pressable onPress={toggleFacing}>
            <FontAwesome6 name="rotate-left" size={32} color="white" />
          </Pressable>
        </View>
        <Progress.Bar
          progress={progress}
          width={null}
          height={10}
          borderRadius={0}
          indeterminate={indeterminate}
        />
      </CameraView>
    );
  };

  return (
    <View style={styles.container}>
      {uri ? renderPicture() : renderCamera()}
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
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
});
