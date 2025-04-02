import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Link } from "expo-router";
import { useRouter } from "expo-router";
import { getUserInfo } from "../database/get_data"; // Ensure you're using getUserInfo instead of getInfo
import { DocumentData } from "firebase/firestore"; // Import DocumentData
import { Ionicons } from "@expo/vector-icons";

export default function ProfilePage() {
    const [userInfo, setUserInfo] = useState<DocumentData | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchUserData() {
            const data = await getUserInfo(); // Fetch current user's info
            setUserInfo(data);
        }
        fetchUserData();
    }, []);

    return (
        <View style={styles.container}>
            {userInfo ? (
                <View style={styles.profileContainer}>
                    <Text style={styles.header}>{userInfo.name}</Text>
                    <Text>Email: {userInfo.email}</Text>
                    <Text>Phone: {userInfo.phone}</Text>
                    {/* Add password and allow for passowrd reset */}
                    <Text>Emergency Contact: {userInfo.emg_name}</Text>
                    <Text>Phone: {userInfo.emg_phone}</Text>
                </View>
            ) : (
                <Text>Loading user info...</Text>
            )}
                
                {/* This crates a whole lotta probs idek what the hell is going on idc rn*/}
            {/* <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace("./login")}>
                <Ionicons name="log-out-outline" size={45} color="black" />
            </TouchableOpacity> */}
        </View>
        
        
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#D9D9D9",
    },
    profileContainer: {
        backgroundColor: "#fff",
        padding: 30,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5, // For Android shadow
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
    },
    logoutButton: {
        marginTop: 20,
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
    },
});
