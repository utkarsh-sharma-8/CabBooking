import React, {useState, useEffect} from 'react';
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
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AuthApi from './AuthScreenApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './AuthStyles';
const {width, height} = Dimensions.get('window');

export default function Auth() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

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

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        const data = {name, phone};
        const response = await AuthApi(data);
        if (response.message === 'Success') {
          await AsyncStorage.setItem('name', response.result.name);
          await AsyncStorage.setItem(
            'passengerId',
            response.result.passengerId,
          );
          await AsyncStorage.setItem('phone', response.result.phone);
          await AsyncStorage.setItem('token', response.token);
          navigation.navigate('FirstScreen');
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  let InputField = ({
    label,
    value,
    onChange,
    placeholder,
    keyboardType,
    maxLength,
    error,
    autoCapitalize,
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          {
            height: 56,
            fontSize: 16,
            color: '#1A1A1A',
            borderWidth: 1.5,
            borderColor: error ? '#FF3B30' : '#E0E0E0',
            borderRadius: 12,
            backgroundColor: '#F8F8F8',
            paddingHorizontal: 16,
          },
          error && styles.inputWrapperError,
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#A0A0A0"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🚕</Text>
            </View>
            <Text style={styles.title}>Welcome to RideNow</Text>
            <Text style={styles.subtitle}>Your journey begins here</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[
                  {
                    height: 56,
                    fontSize: 16,
                    color: '#1A1A1A',
                    borderWidth: 1.5,
                    borderColor: errors.name ? '#FF3B30' : '#E0E0E0',
                    borderRadius: 12,
                    backgroundColor: '#F8F8F8',
                    paddingHorizontal: 16,
                  },
                  errors.name && styles.inputWrapperError,
                ]}
                placeholder={'Enter Your Name'}
                value={name}
                onChangeText={setName}
                autoCapitalize={'words'}
                placeholderTextColor="#A0A0A0"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[
                  {
                    height: 56,
                    fontSize: 16,
                    color: '#1A1A1A',
                    borderWidth: 1.5,
                    borderColor: errors.phone ? '#FF3B30' : '#E0E0E0',
                    borderRadius: 12,
                    backgroundColor: '#F8F8F8',
                    paddingHorizontal: 16,
                  },
                  errors.phone && styles.inputWrapperError,
                ]}
                placeholder={'Enter Your Phone Number'}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor="#A0A0A0"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}>
              <Text style={styles.buttonText}>
                {isLoading ? 'Please wait...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
