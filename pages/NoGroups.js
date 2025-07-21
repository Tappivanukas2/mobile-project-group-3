import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles';
import CreateGroupModal from '../components/CreateGroupModal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fetchUserGroups } from '../firebase/firestore';
import { ThemeContext } from '../context/ThemeContext';

export default function NoGroups ({ navigation }) {
  const [openCreateGroupModal, setOpenCreateGroupModal] = useState(false)
  const { isDarkMode } = useContext(ThemeContext)
	
  const handleCloseModal = async () => {
    setOpenCreateGroupModal(false)

    const userGroups = await fetchUserGroups()
    // Navigate to MyGroups if a group is created
    if (userGroups.length > 0) {
      navigation.navigate('MyGroups')
    }
  }
  
  return (
    <View style={isDarkMode ? styles.containerDarkMode : styles.container}>
      <Text style={styles.title}>My Groups</Text>
      <View style={isDarkMode ? styles.formTwoDarkMode : styles.formTwo}>
        <Text style={isDarkMode ? styles.regularTextDarkMode : styles.regularText}>You're not in a group.</Text>
				<Text style={isDarkMode ? styles.regularTextDarkMode : styles.regularText}>Start here!</Text>
      </View>

      <TouchableOpacity 
        style={styles.buttonOne} 
        onPress={() => setOpenCreateGroupModal(true)}>
      	<Text style={styles.buttonText}>Create group</Text>
				<Ionicons name="add" size={20} color="white" style={styles.iconStyle} />
      </TouchableOpacity>

      <CreateGroupModal 
        visible={openCreateGroupModal}
        onClose={handleCloseModal}
      />
      </View>
    );
  };