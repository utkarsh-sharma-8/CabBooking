import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import VerificationApi from './VerificationApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './VerificationStyle';

const DriverVerification = () => {
  const [name, setName] = useState('');
  const [carNo, setCarNo] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!carNo || !phone || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const data = {
      name: name,
      car_no: carNo,
      phone: phone,
    };

    try {
      const response = await VerificationApi(data);
      if (!response) {
        Alert.alert("Cannot Register");
      } else {
        await AsyncStorage.removeItem("passengerId");
        await AsyncStorage.removeItem("phone");
        await AsyncStorage.removeItem("name");
        await AsyncStorage.setItem("isDriver", "true");
        await AsyncStorage.setItem("carNo", carNo);
        await AsyncStorage.setItem("phone", phone);
        await AsyncStorage.setItem("name", name);
        Alert.alert('Success', 'Driver added successfully!');
        navigation.reset({
          index: 0,
          routes: [{ name: "DriverScreen" }],
        });
      }
      
      setName('');
      setPhone('');
      setCarNo('');
    } catch (error) {
      console.log(`error is ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Driver Verification</Text>
          <Text style={styles.subtitle}>Please enter your details below</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Car Number</Text>
            <TextInput
              style={styles.carInput}
              value={carNo}
              onChangeText={setCarNo}
              placeholder="Enter car number (e.g., ABC-123)"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Verify & Continue</Text>
                <Text style={styles.buttonSubtext}>Tap to complete registration</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};



export default DriverVerification;