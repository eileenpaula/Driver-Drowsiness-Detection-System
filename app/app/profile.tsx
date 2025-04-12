import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Button, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { getUserInfo } from "../database/get_data";
import { updateUserInfo, deleteUser } from "@/database/update_data";
import { DocumentData } from "firebase/firestore";
import { logout_user } from "@/database/user_session";
import { Ionicons } from "@expo/vector-icons";

export default function ProfilePage() {
    const [userInfo, setUserInfo] = useState<DocumentData | null>(null);
    const router = useRouter();
    const [modalVisible, setModalVisible] = React.useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
    const [pwCorrect, setPwCorrect] = React.useState(false)
    
    useEffect(() => {
        async function fetchUserData() {
            const data = await getUserInfo();
            setUserInfo(data);
        }
        fetchUserData();
    }, []);

    const formatPhoneNumber = (phone: string) => {
        if (!phone) return "N/A";
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    };


    // Call this when clicking "Save" in your modal
    const handleSave = async () => {
        try {
            await updateUserInfo({
            name: userInfo?.name || "",
            password: userInfo?.password || "",
            phone: userInfo?.phone || "",
            emg_name: userInfo?.emg_name || "",
            emg_phone: userInfo?.emg_phone || "",
            });
            setModalVisible(false);
        } catch (error) {
            alert("Failed to update profile.")
        }
    }

    const handleDeleteUser = async (password: string) =>{
        setPwCorrect(userInfo?.password === password)
        // return userInfo?.password ==
    }


    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back_arrow}>
                <Ionicons name="arrow-back" size={40} color="#99342C" />
            </TouchableOpacity>
            <Text style={styles.title}>Your Profile</Text>

            {userInfo ? (
                <View style={styles.card}>
                    <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
                        <Ionicons name= "pencil" size={25} color= "black" />
                    </TouchableOpacity>
                    <Modal visible={modalVisible} animationType="slide" transparent={true}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>

                            <TextInput
                                style={styles.editInput}
                                placeholder="Name"
                                value={userInfo?.name}
                                onChangeText={(text) => setUserInfo({ ...userInfo, name: text })}
                            />
                            <TextInput
                                style={styles.editInput}
                                placeholder="Phone"
                                keyboardType="phone-pad"
                                value={userInfo?.phone}
                                onChangeText={(text) => setUserInfo({ ...userInfo, phone: text })}
                            />
                            <TextInput
                                style={styles.editInput}
                                placeholder="Emergency Contact Name"
                                value={userInfo?.emg_name}
                                onChangeText={(text) => setUserInfo({ ...userInfo, emg_name: text })}
                            />
                            <TextInput
                                style={styles.editInput}
                                placeholder="Emergency Phone"
                                keyboardType="phone-pad"
                                value={userInfo?.emg_phone}
                                onChangeText={(text) => setUserInfo({ ...userInfo, emg_phone: text })}
                            />

                            <View style={{ flexDirection: "row", marginTop: 20 }}>
                                <Button title="Save" onPress={() => (handleSave(), setModalVisible(false))} />
                                <View style={{ width: 20 }} />
                                <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
                            </View>
                            </View>
                        </View>
                        </Modal>

                    <Text style={styles.nameText}>{userInfo.name}</Text>
                        <ProfileRow label="Email" value={userInfo.email} />
                        <ProfileRow label="Phone" value={formatPhoneNumber(userInfo.phone)} />

                    <View style={styles.row}>
                        <Text style={styles.label}>Emergency{"\n"}Contact</Text>
                        <Text style={styles.value}>
                            {userInfo.emg_name}{"\n"}{formatPhoneNumber(userInfo.emg_phone)}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={() => (logout_user(), router.replace("./login"))}>
                        <Text style={styles.buttonText}>Logout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutButton} onPress={() => (setDeleteModalVisible(true))}>
                        <Text style={styles.buttonText}>Delete User</Text>
                    </TouchableOpacity>


                    <Modal visible={deleteModalVisible} animationType="slide" transparent={true}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Delete Account</Text>

                            <TextInput
                                style={styles.editInput}
                                placeholder="Enter Password"
                                onChangeText={(text) => setPwCorrect(userInfo?.password === text)}
                            />
                            
                            <View style={{ flexDirection: "row", marginTop: 20 }}>
                                <Button title="Confirm" onPress={() => {if(pwCorrect) {
                                                                            deleteUser(), 
                                                                            router.replace("./login")}
                                                                        }} />
                                <View style={{ width: 20 }} />
                                <Button title="Cancel" color="red" onPress={() => setDeleteModalVisible(false)} />
                            </View>
                            </View>
                        </View>
                        </Modal>


                   
                </View>
            ) : (<Text style={styles.loadingText}>Loading user info...</Text>)}

        </View>
    );
}

const ProfileRow = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    title: {
        letterSpacing: 1,
        color: 'Black',
        fontSize: 24,
        padding: 10,
    },
    container: {
        flex: 1,
        backgroundColor: "rgb(206, 209, 184)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    card: {
        backgroundColor: 'rgba(235, 236, 222, 0.8)',
        width: "90%", 
        height: "75%", 
        borderRadius: 16,
        padding: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    nameText: {
        fontSize: 20,
        fontWeight: "bold",
        fontStyle: 'italic',
        marginTop: 30,
        marginBottom: 20,
        color: "#99342C",
        textAlign: "center",
    },
    row: {
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingVertical: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        fontSize: 16,
        color: "#7b6f66",
    },
    value: {
        textAlign: "center",
        fontSize: 16,
        color: "#4c4036",
        flexShrink: 1,
        maxWidth: "80%",
    },
    logoutButton: {
        marginTop: 30,
        paddingVertical: 10,
        backgroundColor: 'rgb(216, 72, 53)',
        borderRadius: 50,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
    },
    loadingText: {
        fontSize: 18,
        color: "#8e8e8e",
    },
    editButton: {
        position: "absolute",
        paddingHorizontal: 5,
        right: 15,
        marginTop: 10,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
      },
      modalContent: {
        width: "90%",
        height: "50%",
        backgroundColor: "#F0F2ED",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
      },
      editInput: {
        width: "100%",
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingVertical: 8,
        marginBottom: 15,
        fontSize: 16,
        color: "#4c4036",
      },
      back_arrow: {
        position: "absolute",  // Ensures it's floating
        top: 40,               // Adjust for safe area
        left: 20,
        zIndex: 1000,          // Keeps it above other components
        padding: 5,
    },       
});
