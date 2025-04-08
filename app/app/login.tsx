import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FIREBASE_AUTH } from './firebase_config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { setDoc, doc } from "firebase/firestore";


const Login = () => {
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
      set_Error(error.message);
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
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Drowsy Driver Detection System</Text>
      <Text style={styles.title}>Login</Text>

      <Text style={styles.buttonText}>_error</Text>
      
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
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    color: "black",
    marginVertical: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FF5555',
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#FF5555',
  },
  signupButton: {
    padding: 25,
    textAlign: 'center',
    alignItems: 'center',
  },
  signUpButtonText:{
    color: '#FF5555',
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