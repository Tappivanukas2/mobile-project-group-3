import React, { useEffect, useRef, useState, useContext } from 'react'
import { Modal, View, Text, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { sendMessage, listenToMessages, markMessagesAsRead } from '../firebase/firestore'
import { auth } from '../firebase/config';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext';

export default function ChatModal({ visible, onClose, groupId }) {
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const flatListRef = useRef(null)
  const { isDarkMode } = useContext(ThemeContext)

  const userId = auth.currentUser?.uid

  useEffect(() => {
    if (!groupId) return

    const unsubscribe = listenToMessages(groupId, (msgs) => setMessages(msgs))
    return () => unsubscribe()
  }, [groupId])

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  useEffect(() => {
    if (visible && groupId) {
      markMessagesAsRead(groupId)
    }
  }, [visible, groupId])

  const handleSend = () => {
    if (messageText.trim()) {
      sendMessage(groupId, messageText.trim())
      setMessageText('')
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#121212' : '#fff', padding: 10 }}>
        <Ionicons name="close" size={27} color={isDarkMode ? "#fff" : "black"} onPress={onClose}/>
        {/* Message list */}
        <View style={{ flex: 1, marginTop: 30, marginHorizontal: 10 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isMine = item.senderId === userId
            const isRead = item.isRead
            return(
              <View
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  backgroundColor: isMine
                    ? (isDarkMode ? '#2e7d32' : '#DCF8C6')
                    : (isDarkMode ? '#333' : '#E5E5EA'),
                  borderRadius: 15,
                  marginBottom: 6,
                  maxWidth: '75%',
                  padding: 10,
                }}
              >
                {!isMine && (
                  <Text style={{ fontWeight: 'bold', marginBottom: 2, color: isDarkMode ? '#fff' : '#000' }}>
                    {item.senderName}
                  </Text>
                )}
                <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>{item.text}</Text>
              {/* Green Checkmark if message is read */}
                {isRead && (
                  <Ionicons
                    name='checkmark-circle'
                    size={18}
                    color="green"
                    style={{ position: "absolute", right: -20, bottom: 0,}}
                  />
                )}
              </View>
            )
          }}
        /></View>
        {/* Message input + send */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10}}>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder='Type a message...'
            placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
            style={{
              flex: 1,
              borderColor: isDarkMode ? '#555' : '#ccc',
              backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
              color: isDarkMode ? '#fff' : '#000',
              borderWidth: 1,
              borderRadius: 20,
              paddingHorizontal: 15,
              paddingVertical: 8,
            }}
          />
        <TouchableOpacity onPress={handleSend} style={{ marginLeft: 10 }}>
          <Ionicons name="send-outline" size={24} color= '#007AFF'/>
        </TouchableOpacity>
        </View>
        </View>
    </Modal>
  )
}
