import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
import {Ionicons} from '@expo/vector-icons';

const report_problem = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>report_problem</Text>
      <Text style={styles.title}>text box</Text>
    </View>
  )
}

export default report_problem

const styles = StyleSheet.create({
    container:{
        flex:1,
        flexDirection: 'column',
        backgroundColor: 'rgba(217,217,217,1)'
    },
    title: {
        color: 'black',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop:40,
        
    }

})