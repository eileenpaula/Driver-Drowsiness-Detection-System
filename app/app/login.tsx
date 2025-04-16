import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { login_user } from '@/database/user_session';
import { FirebaseError } from 'firebase/app';
import { getAuthErrorMessage } from '@/database/error_handling';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setError('error');
    setLoading(true);
    try {
      await login_user({ email, password });
        // const errorMessage = getAuthErrorMessage(error);
        // console.log("error message:",errorMessage)
        // setError(errorMessage)
        // console.log(error)
        router.replace('/')
    } catch (err) {
      if (err instanceof FirebaseError) {
        const errorMessage = getAuthErrorMessage(err);
        setError(errorMessage);
        console.log("er message:", errorMessage);
        console.log("Login error:", err.code);
      } else {
        console.log("Non-Firebase error:", err);
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Drowsy Driver Detection System</Text>
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
    color: '#FF5555',
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

export default Login;