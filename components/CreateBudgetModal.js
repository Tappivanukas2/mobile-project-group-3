import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Modal, Alert, TouchableOpacity } from 'react-native';
import { createGroupBudget, fetchGroupById } from '../firebase/firestore';
import Ionicons from '@expo/vector-icons/Ionicons';
import styles from '../styles';
import { ThemeContext } from '../context/ThemeContext';

export default function CreateBudgetModal({ visible, onClose, groupId }) {
  const [budgetName, setBudgetName] = useState('');
  const [group, setGroup] = useState(null);
  const { isDarkMode } = useContext(ThemeContext)

  useEffect(() => {
    const fetchGroup = async () => {
    try {
      if (groupId) {
        const groupData = await fetchGroupById(groupId);
      if (groupData) {
        setGroup(groupData);
      } else {
        console.warn("Group not found.");
      }
      }
    } catch (error) {
      console.error("Error fetching group:", error);
    }
    };

    fetchGroup();
  }, [groupId]);


  const handleCreateBudget = async () => {
    console.log("groupId:", groupId); 
    if (!budgetName.trim()) {
      Alert.alert("Error", "Please enter a budget name");
      return;
    }

    try {
      await createGroupBudget({ budgetName, groupId });
      Alert.alert("Success", "Budget Created!");
      setBudgetName('');
      onClose();
    } catch (error) {
      console.error("Error creating budget:", error);
      Alert.alert("Error", "Could not create budget");
    }
  };

  return (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={isDarkMode ? styles.modalOverlayDarkMode : styles.modalOverlay}>
			<View style={isDarkMode ? styles.modalContentDarkMode : styles.modalContent}>
		    <Ionicons name="close" size={27} color={isDarkMode ? "#fff" : "#000"} onPress={onClose}/>
        <Text style={[styles.link, { marginTop: 10 }]}>Create New Budget</Text>
        <TextInput
          placeholder="Budget Name"
          placeholderTextColor={isDarkMode ? '#6B6B6B' : '#aaa'}
          value={budgetName}
          onChangeText={setBudgetName}
          style={isDarkMode ? styles.inputActiveDarkMode : styles.inputActive}
        />
        <TouchableOpacity style={styles.buttonForm} onPress={handleCreateBudget}>
          <Text style={styles.buttonTextMiddle}>Create</Text>
        </TouchableOpacity>
			</View>
    </View>
  </Modal>
  );
};