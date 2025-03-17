import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import React, { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [progress, setProgress] = React.useState(0);
  const [indeterminate, setIndeterminate] = React.useState(true);
  const [timerUp, setTimerUp] = useState(false); // State to track if timer is up
  

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const timer = setTimeout(() => {
      setIndeterminate(false);
      interval = setInterval(() => {
        setProgress((prevProgress) =>{
          if (prevProgress >= 1){
            setTimerUp(true); // Set timerUp to true when the timer finishes
            return 0
          }
          return prevProgress + 1 / 10
        });
      }, 1000);
    }, 1500);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    if (timerUp) {
      console.log('Timer up reset take picture');
      setTimerUp(false); // Reset the timerUp state after logging the message
    }
  }, [timerUp]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      < Link href='../' style={styles.back_arrow}><Ionicons name="arrow-back" size={40} color="#FF5555" /></Link>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.buttonContainer}>
        </View>
      </CameraView> 
      <Progress.Bar
        progress={progress}
        width={null}
        height={10}
        borderRadius={0}
        indeterminate={indeterminate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,1)'
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  back_arrow:{
    marginTop: 30,
    marginLeft: 30,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  progress: {
    margin: 10,
  },
});
