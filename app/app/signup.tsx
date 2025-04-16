import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { create_user } from "../database/create_user";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { FirebaseError } from "firebase/app";
import { getAuthErrorMessage } from '@/database/error_handling';

export default function signUpPage() {
    const router = useRouter();
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [emg_name, setEmgName] = React.useState("");
    const [emg_phone, setEmgPhone] = React.useState("");
    const [error,setError] = React.useState("");


    const handleSignUp = async () => {  
        try {
            await create_user({name, email, password, phone, emg_name, emg_phone})
            console.log("User created");
            // Redirect to homepage
            router.replace('/');
        }catch (error) {
            if (error instanceof FirebaseError) {
                    const errorMessage = getAuthErrorMessage(error);
                    setError(errorMessage);
                  } else {
                    setError('An unexpected error occurred. Please try again.');
                  }
        }
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back_arrow}>
                <Ionicons name="arrow-back" size={40} color="#99342C" />
            </TouchableOpacity>
            <Text style={styles.subHeading}>Sign Up</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
              
            <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor={"#000"}
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={"#000"}
                value={email}
                onChangeText={setEmail}
                
            />
            
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={"#000"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={"#000"}
                value={phone}
                onChangeText={setPhone}
        
            />
            
            <TextInput
                style={styles.input}
                placeholder="Emergency Contact Name"
                placeholderTextColor={"#000"}
                value={emg_name}
                onChangeText={setEmgName}
                
            />

            <TextInput
                style={styles.input}
                placeholder="Emergency Contact Phone Number"
                placeholderTextColor={"#000"}
                value={emg_phone}
                onChangeText={setEmgPhone}
                
            />

            <TouchableOpacity style={[styles.button, styles.signUpButton]} 
                onPress={handleSignUp}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>

            

        </View>
          );
        };
        
        const styles = StyleSheet.create({
          container: {
            flex: 1,
            justifyContent: 'center',
            padding: 20,
            backgroundColor: 'rgb(206, 209, 184)',
          },
          back_arrow: {
            position: "absolute",  // Ensures it's floating
            top: 40,               // Adjust for safe area
            left: 20,
            zIndex: 1000,          // Keeps it above other components
            padding: 5,
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
            backgroundColor: '#99342C',
            borderRadius: 10,
            alignItems: 'center',
          },
          signUpButton: {
            padding: 15,
            textAlign: 'center',
            alignItems: 'center',
          },
          signUpButtonText:{
            color: 'white',
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
        