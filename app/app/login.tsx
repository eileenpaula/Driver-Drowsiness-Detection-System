import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { login_user } from '@/database/user_session';
import {useFonts} from 'expo-font';
import { FirebaseError } from 'firebase/app';
import { getAuthErrorMessage } from '@/database/error_handling';

const login = () => {
  const [loadFonts]=useFonts({
      'IS': require('../assets/fonts/Instrument_Sans.ttf'),
      'ISBold': require('../assets/fonts/InstrumentSans-Bold.ttf'),
    })

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<String>('');
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
  
    try {
      await login_user({ email, password });
      router.replace('/');
    } catch (err: unknown) {
      console.log('Caught error in handleLogin:', err);
  
      if (err instanceof FirebaseError) {
        console.log('Firebase error code:', err.code);
        const errorMessage = getAuthErrorMessage(err);
        setError(errorMessage);
      } else {
        console.log('Non-Firebase error:', err);
        setError('An unexpected error occurred.');
      }
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

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#000"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#000"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, styles.loginButton, loading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Signing In...' : 'Log In'}</Text>
      </TouchableOpacity>

      <Link href="./signup" asChild>
        <TouchableOpacity>
          <Text style={styles.signUpButtonText}>
          Create an Account
          </Text>
        </TouchableOpacity>
      </Link>
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
  subHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 10,
    textAlign: 'center',
  },
  input: {
    color: "black",
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
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  signUpButtonText: {
    textAlign: 'center',
    padding: 25,
    color: '#99342C',
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default login;