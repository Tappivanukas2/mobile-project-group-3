import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TextInput, Button, Alert, TouchableOpacity, Modal } from 'react-native';
import { fetchGroupBudgetById, addGroupBudgetField, deleteGroupBudgetField, setGroupBudget, deleteBudget } from '../firebase/firestore';
import BudgetPieChart from '../components/BudgetPieChart.js';
import styles from "../styles.js";
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemeContext } from '../context/ThemeContext.js';
import { getAuth } from 'firebase/auth'

/*
  The GroupBudget component allows users to manage a group budget.
  Users can:
    - Set an initial group budget
    - View and edit the the budget
    - Add and delete expense categories
*/

export default function GroupBudget({ route, navigation }) {
  const categories = ['Groceries', 'Home', 'Essentials', 'Investments', 'Entertainment', 'Hobbies', 'Other'];
  
  const { budgetId } = route.params
  const [groupBudget, setGroupBudgetState] = useState(null)
  const [expenseName, setExpenseName] = useState('')
  const [fieldValue, setFieldValue] = useState('')
  const [initialBudget, setInitialBudget] = useState('')
  const [isEditingRemaining, setIsEditingRemaining] = useState(false)
  const [newRemainingValue, setNewRemainingValue] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(categories[0])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [markedDates, setMarkedDates] = useState({})
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const { isDarkMode } = useContext(ThemeContext)
  const [showCalendar, setShowCalendar] = useState(false)
  const currentUserId = getAuth().currentUser?.uid
  const isOwner = currentUserId === groupBudget?.ownerId;

  // Load group budget data
  useEffect(() => {
    fetchBudget();
  }, [budgetId]);
  
  const fetchBudget = async () => {
    try {
      const budgetData = await fetchGroupBudgetById(budgetId);
      console.log("Fetched Budget:", budgetData); // Check if the budget data is being fetched correctly
      setGroupBudgetState(budgetData);
    } catch (error) {
      console.error("Error fetching group budget:", error);
    }
  };  

  const updateRemainingBudget = async () => {
    const value = parseFloat(newRemainingValue)

    if (isNaN(value) || value < 0) {
      Alert.alert('Error', 'Please enter a valid remaining budget.')
      return
    }
  
    const result = await setGroupBudget(budgetId, value)
    if (result.error) {
      Alert.alert('Error', result.error)
    } else {
      setIsEditingRemaining(false)
      setNewRemainingValue('')
      fetchBudget()
    }
  }  

  // Handle setting the initial budget
  const handleSetInitialBudget = async () => {
    const budgetValue = parseFloat(initialBudget)
    if (isNaN(budgetValue) || budgetValue <= 0) {
      Alert.alert('Error', 'Please enter a valid initial budget amount.')
      return
    }

    const result = await setGroupBudget(budgetId, budgetValue)
    if (result.error) {
      Alert.alert('Error', result.error)
    } else {
      setInitialBudget('')
      fetchBudget()
    }
  }

  // Handle adding an expense field
  const handleAddField = async () => {
    const value = parseFloat(fieldValue)
    if (!expenseName || isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Please enter a valid name and amount.')
      return
    }

    const budgetDate = selectedDate || new Date().toISOString().split('T')[0];
    const result = await addGroupBudgetField(budgetId, selectedCategory, expenseName, value, budgetDate)
    if (result.error) {
      Alert.alert('Error', result.error)
    } else {
      setExpenseName('')
      setFieldValue('')
      fetchBudget()
    }
  }

  // Handle deleting an expense field
  const handleDeleteField = async (category, expense) => {
    const confirm = await new Promise((resolve) =>
      Alert.alert('Delete Field', `Are you sure you want to delete "${expense}" from "${category}"??`, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ])
    )

    if (!confirm) return

    const result = await deleteGroupBudgetField(budgetId, category, expense)
    if (result.error) {
      Alert.alert('Error', result.error)
    } else {
      fetchBudget()
    }
  }

  const handleDeleteBudgetPress = async () => {
    //confirmation alert
    const confirm = await new Promise((resolve) =>
        Alert.alert('Delete Budget', `Are you sure you want to delete this budget?`, [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
        ])
    );

    // If the user confirmed the deletion, proceed with deleting the budget
    if (confirm) {
        try {
            await deleteBudget(budgetId); // Make sure budgetId is defined
            navigation.navigate('MyGroups');
        } catch (error) {
            console.error("Error deleting budget:", error);
            Alert.alert("Error", "Failed to delete budget.");
        }
    } else {
        console.log("Budget deletion canceled.");
    }
  };

  const handleSlicePress = (category) => {
    setActiveCategory(category)
    setDetailModalVisible(true)
  }

  if (!groupBudget) {
    return (
      <View style={styles.container}>
        <Text>Error loading group budget.</Text>
      </View>
    )
  }

  const filteredBudget = {}
    Object.entries(groupBudget.budget || {}).forEach(([category, entries]) => {
      filteredBudget[category] = {}
      Object.entries(entries).forEach(([name, { amount, date }]) => {
        if (!startDate || !endDate || (date >= startDate && date <= endDate)) {
          filteredBudget[category][name] = amount
      }
    })
  })

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#1A1A1A' : '#' }}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1,}}
      keyboardVerticalOffset={100}
    >

  <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 10, paddingHorizontal: 5 }} style={isDarkMode ? styles.scrollViewDarkMode : styles.scrollView}>
    {/* Calendar Modal */}
    {showCalendar && (
          <Modal transparent={true} animationType="slide" visible={showCalendar}>
          <View style={isDarkMode ? styles.modalOverlayDarkMode : styles.modalOverlay}>
          <View style={isDarkMode ? styles.modalContentDarkMode : styles.modalContent}>
          <Ionicons name="close" size={27} color={isDarkMode ? "#fff" : "#000"}
            onPress={() => setShowCalendar(false)}/>
          <Calendar
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              setShowCalendar(false);
            }}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: '#00adf5',
              },
            }}
            theme={{
              backgroundColor: isDarkMode ? '#1A1A1A' : '#fff',
              calendarBackground: isDarkMode ? '#1A1A1A' : '#fff',
              dayTextColor: isDarkMode ? '#fff' : '#000',
              selectedDayBackgroundColor: '#00adf5',
              selectedDayTextColor: '#fff',
              arrowColor: isDarkMode ? '#fff' : '#000',
              monthTextColor: isDarkMode ? '#fff' : '#000',
              textSectionTitleColor: isDarkMode ? '#fff' : '#000',
            }}
            style={{ marginBottom: 20 }}
          />

        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.buttonForm}>
          <Text style={styles.buttonTextMiddle}>
            {startDate ? `Start: ${startDate}` : 'Select Start Date'}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate ? new Date(startDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (selectedDate) setStartDate(selectedDate.toISOString().split('T')[0]);
            }}
          />
        )}

        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.buttonForm}>
          <Text style={styles.buttonTextMiddle}>
            {endDate ? `End: ${endDate}` : 'Select End Date'}
          </Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate ? new Date(endDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (selectedDate) setEndDate(selectedDate.toISOString().split('T')[0]);
            }}
          />
        )}
      </View>
    </View>
  </Modal>
  )}

      {groupBudget.remainingBudget === undefined ? (
        <View>
          <Text style={isDarkMode ? styles.subtitleDarkMode : styles.subtitle}>Set Budget</Text>
          <TextInput
            style={isDarkMode ? styles.inputActiveDarkMode : styles.inputActive}
            placeholder="Enter budget amount"
            value={initialBudget}
            onChangeText={setInitialBudget}
            keyboardType="numeric"
          />
          <Button title="Set Budget" onPress={handleSetInitialBudget} />
        </View>
      ) : (
        <>
          <View style={styles.rowContainer}>
            {isEditingRemaining ? (
              <View style={styles.editRow}>

              <TextInput
                style={[isDarkMode ? styles.editInputDarkMode : styles.editInput, styles.remainingInputInline]}
                value={newRemainingValue}
                onChangeText={setNewRemainingValue}
                keyboardType="numeric"
                placeholder="Remaining budget"
              />

              <TouchableOpacity style={styles.buttonForm2} onPress={updateRemainingBudget}>
                <Text style={styles.buttonTextMiddle}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonForm2} onPress={() => {
                setIsEditingRemaining(false)
                setNewRemainingValue('')
              }}>
                <Text style={styles.buttonTextMiddle}>Cancel</Text>
              </TouchableOpacity>
              </View>
          ) : (
            <View style={styles.editRow}>
            <Text style={isDarkMode ? styles.subtitleDarkMode : styles.subtitle}>Budget: €{groupBudget.remainingBudget}</Text>
              <Ionicons
              name="pencil"
              size={20}
              color={isDarkMode ? "#fff" : "#000"}
              onPress={() => {
                setIsEditingRemaining(true)
                setNewRemainingValue(String(groupBudget.remainingBudget))
              }}/>
            </View>
              )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => setShowCalendar(true)} style={{ marginLeft: 'auto' }}>
            <Ionicons name="calendar-outline" size={30} color="#A984BE" />
          </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 10 }}>
          <BudgetPieChart data={filteredBudget} onSlicePress={handleSlicePress} />
          </View>

      {Object.entries(filteredBudget).map(([category, expenses]) => {
          const total = Object.values(expenses).reduce((sum, val) => sum + val, 0);
          return (
            <TouchableOpacity key={category} onPress={() => handleSlicePress(category)} style={isDarkMode? styles.categorySummaryDarkMode : styles.categorySummary}>
              <Text style={isDarkMode ? styles.regularTextDarkMode : styles.regularText}>{category.toUpperCase()}: ${total}</Text>
            </TouchableOpacity>
          );
        })}
        </>
      )}

<View style={{ marginTop: 10, marginBottom: 5 }}>
        <View style={isDarkMode? styles.pickerWrapperDarkMode : styles.pickerWrapper}>
          <Picker
            style={isDarkMode? styles.regularTextDarkMode : styles.regularText}
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            dropdownIconColor= {isDarkMode ? '#fff' : '#4F4F4F'}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <TextInput
          style={[isDarkMode ? styles.inputActiveDarkMode : styles.inputActive, { flex: 1 }]}
          placeholder="Description"
          placeholderTextColor={isDarkMode ? '#6B6B6B' : '#aaa'}
          value={expenseName}
          onChangeText={setExpenseName}
        />
        <TextInput
          style={[isDarkMode ? styles.inputActiveDarkMode : styles.inputActive, { width: 100 }]}
          placeholder="Amount"
          placeholderTextColor={isDarkMode ? '#6B6B6B' : '#aaa'}
          value={fieldValue}
          onChangeText={setFieldValue}
          keyboardType="numeric"
        /></View>

<View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 5 }}>
      <Ionicons 
        name="add-circle-outline" 
        size={33} color="#A984BE" 
        onPress={handleAddField}
      />
</View></View>

<Modal visible={detailModalVisible} animationType="slide" transparent>
  <View style={isDarkMode ? styles.modalOverlayDarkMode : styles.modalOverlay}>
    <View style={isDarkMode ? styles.modalContentDarkMode : styles.modalContent}>
    <Ionicons name="close" size={27} color={isDarkMode ? "#fff" : "#000"}
        onPress={() => setDetailModalVisible(false)}/>
      <Text style={[styles.link, { marginTop: 10 }]}>Details for {activeCategory?.toUpperCase()}</Text>
      <ScrollView style={{ maxHeight: 300 }}>
        {activeCategory && filteredBudget[activeCategory] && Object.entries(filteredBudget[activeCategory]).map(([name, value]) => (
          <View key={name} style={isDarkMode ? styles.budgetItemDarkMode : styles.budgetItem}>
            <Text style={isDarkMode ? styles.regularTextDarkMode : styles.regularText}>{name}: €{value}</Text>
            <TouchableOpacity onPress={() => handleDeleteField(activeCategory, name)}>
              <Text style={styles.deleteButton}>
                <Ionicons name="close-outline" size={25}></Ionicons></Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  </View>
</Modal>

        {isOwner && (
          <View style={styles.deleteWrapper}>
            <TouchableOpacity style={styles.deleteContainer} onPress={handleDeleteBudgetPress}>
              <Text style={styles.deleteText}>Delete Budget</Text>
              <Ionicons name="trash-outline" size={16} color={isDarkMode ? 'red' : '#4F4F4F'} />
            </TouchableOpacity>
          </View>
        )}
    </ScrollView>
    </KeyboardAvoidingView>
    </View>
  )
}
