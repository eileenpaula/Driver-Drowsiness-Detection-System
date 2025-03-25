import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StatsPage() {
    return (
        <View style={styles.container}>
            <Text style = {styles.header}>Your Driving Stats</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#D9D9D9",
    },

    header: {
        fontSize: 30,
        fontWeight: "bold",
    },



})