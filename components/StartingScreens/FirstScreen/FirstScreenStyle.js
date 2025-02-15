import { StyleSheet, Dimensions } from "react-native";

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    searchContainer: {
      position: 'absolute',
      top: 40,
      zIndex: 1,
      width: '100%',
      paddingHorizontal: 20,
    },
    inputCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
    },
    input: {
      flex: 1,
      marginLeft: 10,
      fontSize: 16,
      color: '#333',
    },
    divider: {
      height: 1,
      backgroundColor: '#EEEEEE',
      marginVertical: 10,
    },
    map: {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    },
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      justifyContent:'center',
      alignItems:'center'
    },
    bottomSheetText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
  });
  
export default styles;  