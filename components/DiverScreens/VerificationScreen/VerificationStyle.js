import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 20,
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#1a1a1a',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      marginBottom: 32,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: '#1a1a1a',
    },
    // Distinct styling for each input
    carInput: {
      borderWidth: 1.5,
      borderColor: '#e6e6e6',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: '#1a1a1a',
      backgroundColor: '#f8f9fa',
      letterSpacing: 2,
    },
    phoneInput: {
      borderWidth: 1.5,
      borderColor: '#e6e6e6',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: '#1a1a1a',
      backgroundColor: '#fff',
    },
    nameInput: {
      borderWidth: 1.5,
      borderColor: '#e6e6e6',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: '#1a1a1a',
      backgroundColor: '#f8f9fa',
    },
    button: {
      backgroundColor: '#FFD700',
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    buttonDisabled: {
      backgroundColor: '#a6c4ff',
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    buttonSubtext: {
      color: '#fff',
      fontSize: 14,
      marginTop: 4,
      opacity: 0.8,
    },
  });