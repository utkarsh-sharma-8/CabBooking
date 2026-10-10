import React, {useState, useEffect, useRef} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  BackHandler,
  StatusBar,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {requestOtp, verifyOtp} from './AuthScreenApi';
import {setTokens, setUser} from '../../../utils/authStorage';
import {connectSocket} from '../../../utils/socket';
import {getErrorMessage} from '../../../utils/errorMessage';
import styles from './AuthStyles';
import {homeRoutesFor} from '../../../utils/navigationRef';
import {getActiveTrip} from '../../../utils/tripApi';

// Mirrors the backend's OTP_RESEND_COOLDOWN_SECONDS default (be/cab_booking_be/.env.example).
const RESEND_COOLDOWN_SECONDS = 30;

export default function Auth() {
  const navigation = useNavigation();
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const fadeAnim = new Animated.Value(0);
  const cooldownIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const backAction = () => {
      if (step === 'otp') {
        setStep('details');
        return true;
      }
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [step]);

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }
    cooldownIntervalRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validateDetails = () => {
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

  const handleRequestOtp = async () => {
    setFormError('');
    if (!validateDetails()) {
      return;
    }
    setIsLoading(true);
    try {
      await requestOtp(phone);
      if (!isMountedRef.current) return;
      setOtp('');
      setStep('otp');
      startCooldown();
    } catch (error) {
      if (isMountedRef.current) {
        setFormError(getErrorMessage(error, 'Could not send OTP. Please try again.'));
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) {
      return;
    }
    setFormError('');
    setIsLoading(true);
    try {
      await requestOtp(phone);
      if (!isMountedRef.current) return;
      setOtp('');
      startCooldown();
    } catch (error) {
      if (isMountedRef.current) {
        setFormError(getErrorMessage(error, 'Could not resend OTP. Please try again.'));
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setFormError('');
    if (!/^\d{6}$/.test(otp)) {
      setFormError('Enter the 6-digit code sent to your phone');
      return;
    }
    setIsLoading(true);
    try {
      const response = await verifyOtp(phone, otp, name);
      await setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      await setUser(response.user);
      connectSocket();
      // Logging back in mid-trip (new device, or after a logout) must land on
      // the trip, same as Splash does for a reopened app. The socket's own
      // on-connect active_trip push can't cover this: it may arrive while
      // this screen is still showing, and socket.js ignores it on Auth.
      // Best-effort — a failed lookup mustn't fail a login that succeeded;
      // the push still resumes the trip once the user is on Home.
      let activeTrip = null;
      try {
        activeTrip = await getActiveTrip();
      } catch (error) {
        console.log(`Auth: active trip check failed: ${error}`);
      }
      // Navigation is safe even if the component unmounted in the meantime —
      // it goes through the navigator, not local state — but skip local
      // state updates below if that happened.
      if (activeTrip) {
        navigation.reset({index: 0, routes: [{name: 'TripScreen', params: activeTrip}]});
      } else {
        navigation.reset({index: 0, routes: homeRoutesFor(response.user)});
      }
    } catch (error) {
      if (isMountedRef.current) {
        setFormError(getErrorMessage(error, 'Incorrect OTP. Please try again.'));
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

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
            <Text style={styles.subtitle}>
              {step === 'details'
                ? 'Your journey begins here'
                : `Enter the code sent to ${phone}`}
            </Text>
          </View>

          {step === 'details' ? (
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
              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRequestOtp}
                disabled={isLoading}>
                <Text style={styles.buttonText}>
                  {isLoading ? 'Please wait...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={{
                    height: 56,
                    fontSize: 24,
                    letterSpacing: 8,
                    textAlign: 'center',
                    color: '#1A1A1A',
                    borderWidth: 1.5,
                    borderColor: '#E0E0E0',
                    borderRadius: 12,
                    backgroundColor: '#F8F8F8',
                    paddingHorizontal: 16,
                  }}
                  placeholder={'------'}
                  value={otp}
                  onChangeText={text => setOtp(text.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor="#A0A0A0"
                />
              </View>
              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={isLoading}>
                <Text style={styles.buttonText}>
                  {isLoading ? 'Please wait...' : 'Verify & Continue'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{marginTop: 16, alignItems: 'center'}}
                onPress={handleResendOtp}
                disabled={cooldown > 0 || isLoading}>
                <Text style={{color: cooldown > 0 ? '#A0A0A0' : '#1A1A1A', fontWeight: '600'}}>
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{marginTop: 8, alignItems: 'center'}}
                onPress={() => setStep('details')}>
                <Text style={{color: '#666'}}>Change phone number</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
