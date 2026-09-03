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
import { getUser, setUser } from '../../../utils/authStorage';
import { styles } from './VerificationStyle';

const DriverVerification = () => {
  const [name, setName] = useState('');
  const [carNo, setCarNo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!carNo || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const data = {
      name: name,
      car_no: carNo,
    };

    try {
      const response = await VerificationApi(data);
      if (!response?.success) {
        Alert.alert('Error', response?.message || 'Cannot register as driver');
      } else {
        const currentUser = await getUser();
        // currentUser should always exist here (set at OTP verification), but
        // guard anyway rather than silently persisting a user object missing
        // phone/passengerId if it's ever somehow absent.
        if (currentUser) {
          await setUser({...currentUser, isDriver: true, carNo});
          Alert.alert('Success', 'Driver added successfully!');
          navigation.reset({
            index: 0,
            routes: [{ name: "DriverScreen" }],
          });
        } else {
          Alert.alert('Error', 'Your session looks incomplete — please log in again.');
        }
      }

      setName('');
      setCarNo('');
    } catch (error) {
      const message = error?.response?.data?.message || 'Could not register as driver. Please try again.';
      Alert.alert('Error', message);
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
