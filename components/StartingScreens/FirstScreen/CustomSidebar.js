import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';


const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

const CustomSidebar = ({ isOpen, slideAnim, onClose }) => {
    const navigation = useNavigation();
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
      )}

      {/* Sidebar */}
      <Animated.View style={[
        styles.sidebar,
        {
          transform: [{ translateX: slideAnim }],
          width: DRAWER_WIDTH,
        }
      ]}>
        <ScrollView>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Icon name="person" size={40} color="#666" />
            </View>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profilePhone}>+1 234 567 8900</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            <MenuItem icon="history" text="Ride History" type='1' />
            <MenuItem icon="payment" text="Payment Methods"type='1' />
            <MenuItem icon="car" text="Become a Driver" onPress={()=>navigation.navigate("Verification")}type='0' />
            <MenuItem icon="local-offer" text="Promotions"type='1' />
            <MenuItem icon="settings" text="Settings"type='1' />
            <MenuItem icon="help" text="Help & Support"type='1' />
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </>
  );
};

// Helper component for menu items
const MenuItem = ({ icon, text, onPress,type }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
  {
    
    type==='1'?<Icon name={icon} size={24} color="#333" />:<Icon2 name={icon} size={24} color="#333" />
  }
    <Text style={styles.menuText}>{text}</Text>
  </TouchableOpacity>
);

export default CustomSidebar;

const styles=StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 999,
    },
    sidebar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 1000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    profileSection: {
      padding: 20,
      backgroundColor: '#f8f8f8',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
      alignItems: 'center',
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#ddd',
      marginBottom: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    profilePhone: {
      color: '#666',
      marginTop: 5,
    },
    menuContainer: {
      padding: 15,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    menuText: {
      marginLeft: 15,
      fontSize: 16,
      color: '#333',
    },
    logoutButton: {
      margin: 15,
      padding: 15,
      backgroundColor: '#ff4444',
      borderRadius: 8,
      alignItems: 'center',
    },
    logoutText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
});