import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
      color: '#1E1E1E',
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 30,
      color: '#666666',
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      marginBottom: 8,
      color: '#1E1E1E',
    },
    input: {
      borderWidth: 1,
      borderColor: '#DDDDDD',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: '#F8F8F8',
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 12,
      marginTop: 4,
    },
    button: {
      backgroundColor: '#FFD700',
      padding: 16,
      borderRadius: 8,
      marginTop: 20,
    },
    buttonText: {
      color: '#1E1E1E',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
});
export default styles;