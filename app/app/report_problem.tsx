import { View, Text, StyleSheet, TextInput } from 'react-native'
import React from 'react'
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { Link } from 'expo-router'

const report_problem = () => {
  const [text, onChangeText] = React.useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Problem</Text>
  
      <SafeAreaProvider>
        <SafeAreaView>
          <TextInput
          style={styles.input}
          onChangeText={onChangeText}
          placeholder="What issue are you having?"
          value={text}
          />
        </SafeAreaView>
      </SafeAreaProvider>
      < Link href='/settings' style={styles.button}>Submit</Link>
      < Link href='/settings' style={[styles.button, {marginBottom: 40}]}>Back</Link>
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
        
    },
    input: {
      height: 150,
      margin: 12,
      borderWidth: 2,
      padding: 15,
    },
    button: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'white',
        paddingTop:20,
        paddingBottom:20,
        marginTop:20,
        marginBottom:5,
        marginLeft: 50,
        marginRight: 50,
        borderRadius:20,
    },

})