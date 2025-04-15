import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { login_user } from '@/database/user_session';
import {useFonts} from 'expo-font';


const login = () => {
  const [loadFonts]=useFonts({
      'IS': require('../assets/fonts/Instrument_Sans.ttf'),
      'ISBold': require('../assets/fonts/InstrumentSans-Bold.ttf'),
    })
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [_error, set_Error] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      // Success - redirect to home screen
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
      set_Error(error.message)
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      Alert.alert('Success', 'Account created!');
      // Optional: Auto-login after signup
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
      set_Error(error.message)
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require("../assets/images/logo2.png")} style={styles.logo} />
      </View>
      {/* <View>
      <Text style={styles.title}>Drowsy Driver Detection{'\n'}
      <Text style={{ color: '#99342C' }}>System</Text>
      </Text>
      </View> */}
      <Text style={styles.subHeading}>Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={[styles.button, styles.loginButton]} 
        onPress={handleLogin}
        disabled={loading}
        >
        <Text style={styles.buttonText}>
          {loading ? 'Signing In...' : 'Log In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.signupButton} 
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.signUpButtonText}>Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgb(206, 209, 184)',
  },
  logo: {
    width: 255,
    height: 130,
    resizeMode: "contain",
    // alignItems:'center',
    // justifyContent: 'center',
  },
  logoContainer: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(206, 209, 184)",
    marginBottom: 30
    
  },
  title: {
    fontFamily: "ISBold",
    //color: '#99342C',
    fontSize: 25,
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: "bold",
    marginBottom: 60,
  },
  input: {
    marginVertical: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgb(163, 165, 146)',
    borderRadius: 10,
    backgroundColor: 'rgb(193, 196, 168)',
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FF5555',
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#99342C',
  },
  signupButton: {
    padding:25,
    textAlign: 'center',
    alignItems: 'center',
  },
  signUpButtonText:{
    textAlign: 'center',
    padding: 25,
    color: '#99342C',
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default Login;