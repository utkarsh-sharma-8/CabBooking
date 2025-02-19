import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import styles from './AuthStyles';
import { useNavigation } from '@react-navigation/native';

import AuthApi from './AuthScreenApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Auth() {

  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp()
    };

    // Add the back event listener
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Clean up the event listener when the component is unmounted
    return () => backHandler.remove();
  }, []);
  const validateForm = () => {
    let newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async() => {
    if (validateForm()) {
      // Handle form submission here
      const data={name,phone}
      console.log('Form submitted:',data);
      try{
        const response=await AuthApi(data);
      if(response.message==="Success"){
        await AsyncStorage.setItem("name",response.result.name);
        await AsyncStorage.setItem("passengerId",response.result.passengerId);
        await AsyncStorage.setItem("phone",response.result.phone);
        await AsyncStorage.setItem("token",response.token);
        navigation.navigate("FirstScreen")
        console.log("login Successful")
        
      }
      }catch(error){
        console.log(error);
      }
      
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to RideNow</Text>
          <Text style={styles.subtitle}>Please enter your details to continue</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

