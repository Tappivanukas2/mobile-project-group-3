import React, { useEffect, useState, useContext } from 'react'
import { matchContactsToUsers, addMemberToGroup } from '../firebase/firestore'
import * as Contacts from 'expo-contacts'
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from "@expo/vector-icons/Ionicons"
import styles from '../styles'
import { ThemeContext } from '../context/ThemeContext';

export default function AddMembersModal({ visible, onClose, groupId, currentGroupMembers, onMembersUpdated }) {
  const [suggestedMembers, setSuggestedMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const { isDarkMode } = useContext(ThemeContext)

  useEffect(() => {
    const fetchSuggestedMembers = async () => {
      try {
        const { status } = await Contacts.requestPermissionsAsync()
        if (status === "granted") {
          const { data: contacts } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name]
          })
          const matchedMembers = await matchContactsToUsers(contacts)
          const newSuggestedMembers = matchedMembers.filter(member => 
            !currentGroupMembers.includes(member.uid)
        )
          setSuggestedMembers(newSuggestedMembers)
        }
      } catch (error) {
        console.error("Error loading suggested members: ", error)
      }
    }
    if (visible) {
      fetchSuggestedMembers()
    }
  }, [visible])

  const handleAddMembers = async () => {
    try {
      await addMemberToGroup(groupId, selectedMembers)
      if (onMembersUpdated) {
        await onMembersUpdated()
      }
      onClose()
    } catch (error) {
      console.error("Error adding members: ", error)
    }
  }

  const toggleMemberSelection = (member) => {
    setSelectedMembers(prevSelected => {
      if (prevSelected.includes(member)) {
        return prevSelected.filter(selected => selected !== member)
      } else {
        return [...prevSelected, member]
      }
    })
  }

  return (
    <Modal
      visible={visible}
      animationType='slide'
    >
      <View style={isDarkMode ? styles.modalOverlayDarkMode : styles.modalOverlay}>
        <View style={isDarkMode ? styles.modalContentDarkMode : styles.modalContent}>
        <Ionicons name="close" size={27} color={isDarkMode ? "#fff" : "#000"} onPress={onClose}/>
        <Text style={[styles.link, { marginTop: 10 }]}>Add Members to Group</Text>
        <FlatList
          data={suggestedMembers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => toggleMemberSelection(item)}>
              <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 8,
                  backgroundColor: selectedMembers.includes(item)
                  ? (isDarkMode ? '#3A3A3A' : '#D0E6FF')
                  : (isDarkMode ? '#1F1F1F' : 'white'),
                  borderRadius: 8,
                  marginBottom: 8
                }}>
                <Ionicons 
                  name="person" 
                  size={20}
                  color={isDarkMode ? "#fff" : "#000"} 
                  style={{ marginRight: 10 }}
                />
                <Text style={isDarkMode ? styles.listTextDarkMode : styles.listText}>
                  {item.contactName} ({item.name}) ({item.phone})
                </Text>
                </View>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={styles.buttonForm} onPress={handleAddMembers}>
            <Text style={styles.buttonTextMiddle}>Add member</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
