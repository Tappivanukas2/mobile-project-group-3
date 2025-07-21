import React, { useEffect, useState, useContext } from 'react'
import { FlatList, View, Text, Alert, TouchableOpacity } from 'react-native'
import { 
  getUserByGroupId, 
  removeMemberFromGroup,
  deleteGroup
} from '../firebase/firestore'
import { getAuth } from 'firebase/auth'
import Ionicons from '@expo/vector-icons/Ionicons';
import styles from '../styles'
import AddMembersModal from '../components/AddMembersModal';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function GroupSettings({ route }) {
  const { groupId } = route.params
  const [members, setmembers] = useState([])
  const [ownerId, setOwnerId] = useState(null)
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const { isDarkMode } = useContext(ThemeContext)
  const currentUserId = getAuth().currentUser?.uid
  const isOwner = currentUserId === ownerId
  const navigation = useNavigation();

  const fetchMembers = async () => {
    try {
      const fetchedMembers = await getUserByGroupId(groupId)

      if (fetchedMembers) {
        setmembers(fetchedMembers.members)
        setOwnerId(fetchedMembers.ownerId)
      } else {
        setError('Failed to load group members.')
      }
    } catch (error) {
      setError('Error fetching group members.')
    } 
  }
  useEffect(() => {
    fetchMembers()
  }, [groupId])

  const handleRemoveMember = (memberUid, memberName) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMemberFromGroup(groupId, memberUid)
              setmembers(prev => prev.filter(m => m.uid !== memberUid))
            } catch (error) {
              alert(error.message || "Failed to remove member.")
            }
          }
        }
      ]
    )
  }

  const handleCloseModal = async () => {
    setOpenAddMembersModal(false)
  }

  const handleDeleteGroup = async () => {
    const confirm = await new Promise((resolve) =>
      Alert.alert('Delete group', 'Are you sure you want to delete this group?', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ])
    );
  
    if (!confirm) return;
  
    try {
      await deleteGroup(groupId);
      navigation.navigate('MyGroups');
    } catch (error) {
      console.error("Error deleting group:", error);
      Alert.alert("Error", "Failed to delete group.");
    }
  };
  

  return (
    <View
      style={[
        isDarkMode ? styles.settingsContainer2DarkMode : styles.settingsContainer2
      ]}>

      <View style={styles.membersSection}>
        <Text style={[styles.link, styles.membersLabel]}>Group Members</Text>
  
        <FlatList
          style={styles.membersList}
          data={members}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <View style={[styles.editRow, isDarkMode ? styles.categorySummaryDarkMode : styles.categorySummary, {paddingVertical: 8 }]}>
              <Text style={isDarkMode ? styles.regularTextDarkMode : styles.regularText}>
                {item.name}
              </Text>
              {isOwner && item.uid !== ownerId && (
                <Ionicons
                  name="person-remove-outline"
                  size={20}
                  color={isDarkMode ? "#fff" : "#4F4F4F"}
                  onPress={() => handleRemoveMember(item.uid, item.name)}
                />
              )}
            </View>
          )}
        />
  
        {isOwner && (
          <Text
            style={[styles.link, styles.addMembersLink]}
            onPress={() => setOpenAddMembersModal(true)}
          >
            + Add Members
          </Text>
        )}
      </View>
  
      <AddMembersModal
        visible={openAddMembersModal}
        onClose={handleCloseModal}
        groupId={groupId}
        currentGroupMembers={members.map(member => member.uid)}
        onMembersUpdated={fetchMembers}
      />

      {isOwner && (
        <View style={styles.deleteWrapper}>
          <TouchableOpacity style={styles.deleteContainer} onPress={handleDeleteGroup}>
            <Text style={styles.deleteText}>Delete Group</Text>
            <Ionicons name="trash-outline" size={16} color={isDarkMode ? "red" : "#4F4F4F"} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )  
}
