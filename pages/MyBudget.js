import React, { useState, useContext, useEffect, useLayoutEffect } from 'react'; 
import {
  View, Text, TextInput, Button, Alert, ScrollView, TouchableOpacity,
  FlatList, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addBudgetField, deleteBudgetField, shareBudgetWithGroup, fetchUserGroups, getExpandedBudget } from '../firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import BudgetPieChart from '../components/BudgetPieChart';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import styles from "../styles";
import { Picker } from '@react-native-picker/picker';
import { addRecurringEntry } from '../firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export default function MyBudget() {
  const categories = ['Groceries', 'Home', 'Essentials', 'Investments', 'Entertainment', 'Hobbies', 'Other'];

  const [recurringModalVisible, setRecurringModalVisible] = useState(false)
  const navigation = useNavigation();
  const [expenseName, setExpenseName] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('monthly');
  const [remainingBudget, setRemainingBudget] = useState(null);
  const [budgetTotal, setBudgetTotal] = useState(null);
  const [message, setMessage] = useState('');
  const [budgetFields, setBudgetFields] = useState({});
  const [groups, setGroups] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [recurringItems, setRecurringItems] = useState([]);
  const { isDarkMode } = useContext(ThemeContext)
  const [monthlySavings, setMonthlySavings] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'My Budget',
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 15, marginRight: 15 }}>
          <TouchableOpacity onPress={() => navigation.navigate('BudgetSettings')}>
            <Ionicons name="settings-outline" size={24}
            color={isDarkMode ? "#fff" : "#4F4F4F"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="arrow-redo-outline" size={24}
            color={isDarkMode ? "#fff" : "#4F4F4F"} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleSlicePress = (category) => {
    setActiveCategory(category);
    setDetailModalVisible(true);
  };

  const fetchUserBudgetData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setBudgetTotal(data.budgetTotal ?? 0);

        const validBudget = {};
        const datesWithBudget = [];

        for (const [category, expenses] of Object.entries(data.budget || {})) {
          if (typeof expenses === 'object') {
            validBudget[category] = {};
            for (const [name, value] of Object.entries(expenses)) {
              if (typeof value === 'object' && typeof value.amount === 'number') {
                validBudget[category][name] = value;
                datesWithBudget.push(value.date ?? '2025-01-01');
              } else if (typeof value === 'number') {
                validBudget[category][name] = { amount: value, date: '2025-01-01' };
                datesWithBudget.push('2025-01-01');
              }
            }
          }
        }

        const marked = {};
        datesWithBudget.forEach(date => {
          marked[date] = { marked: true, dotColor: 'green' };
        });

        setBudgetFields(validBudget);
        setMarkedDates(marked);
        calculateRemainingBudget(validBudget);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
    }
  };

  const calculateRemainingBudget = async (budgetData) => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const data = userSnap.data();
    const totalBudget = data.budgetTotal || 0;

    let manualExpenses = 0;
    for (const category of Object.values(budgetData)) {
      for (const expense of Object.values(category)) {
        if (expense?.amount) {
          manualExpenses += expense.amount;
        }
      }
    }

    const recurring = await getExpandedBudget(new Date());
    const recurringExpenses = recurring
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    setRemainingBudget(totalBudget - manualExpenses - recurringExpenses);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserBudgetData(user);
      }
    });
    return unsubscribe;
  }, []);

  
  const calculateMonthlySavings = async () => {
    const user = auth.currentUser;
    if (!user) return [];

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return [];

    const data = userSnap.data();
    const budget = data.budget || {};
    const recurring = data.recurringEntries || [];
    const monthlyBudget = data.budgetTotal || 0;

    const monthlyExpenses = {};

    for (const [_, entries] of Object.entries(budget)) {
      for (const [__, entry] of Object.entries(entries)) {
        const date = entry.date || new Date().toISOString().split('T')[0];
        const month = date.slice(0, 7);
        if (!monthlyExpenses[month]) monthlyExpenses[month] = 0;
        monthlyExpenses[month] += entry.amount;
      }
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    recurring.forEach(entry => {
      if (entry.type === 'expense') {
        if (!monthlyExpenses[currentMonth]) monthlyExpenses[currentMonth] = 0;
        monthlyExpenses[currentMonth] += entry.amount;
      }
    });

    const savings = Object.entries(monthlyExpenses).map(([month, totalSpent]) => ({
      month,
      savings: monthlyBudget - totalSpent
    }));

    return savings;
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserBudgetData();
      fetchRecurring();
      calculateMonthlySavings().then(setMonthlySavings);
    }, [])
  );
  
  useEffect(() => {
    const loadGroups = async () => {
      const userGroups = await fetchUserGroups();
      setGroups(userGroups);
    };
    loadGroups();
  }, []);

  const fetchRecurring = async () => {
    const user = auth.currentUser;
    if (!user) return;
  
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      setRecurringItems(data.recurringEntries || [])
    }
  }  

  const handleAddField = async () => {
    const value = parseFloat(fieldValue);
    if (!expenseName || isNaN(value) || value <= 0) {
      Alert.alert('Please enter a valid name and amount');
      return;
    }

    if (isRecurring) {
      const today = new Date().toISOString().split('T')[0];
      const result = await addRecurringEntry(
        selectedCategory,
        expenseName,
        value,
        recurringInterval,
        today,
        null,
        'expense'
      );

      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setExpenseName('');
        setFieldValue('');
        //setMessage(`Recurring expense "${expenseName}" added.`);
        fetchUserBudgetData();
        calculateMonthlySavings().then(setMonthlySavings);
        fetchRecurring(); 
      }
      return;
    }

    const budgetDate = selectedDate || new Date().toISOString().split('T')[0];
    const result = await addBudgetField(selectedCategory, expenseName, value, budgetDate);

    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setExpenseName('');
      setFieldValue('');
      //setMessage(`Added "${expenseName}" to "${selectedCategory}" for €${value}`);
      fetchUserBudgetData();
      calculateMonthlySavings().then(setMonthlySavings);
    }
  };

  const handleDeleteField = async (category, expense) => {
    const confirm = await new Promise((resolve) =>
      Alert.alert('Delete Field', `Are you sure you want to delete "${expense}" from "${category}"?`, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ])
    );

    if (!confirm) return;

    const result = await deleteBudgetField(category, expense);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      //setMessage(`Deleted "${expense}" from "${category}"`);
      fetchUserBudgetData();
      calculateMonthlySavings().then(setMonthlySavings);
      setDetailModalVisible(false);
    }
  };

  const handleShareBudget = async (groupId) => {
    setModalVisible(false);
    if (!groupId) {
      Alert.alert('Error', 'Please select a group to share with.');
      return;
    }

    const result = await shareBudgetWithGroup(groupId);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Success', 'Budget shared successfully!');
    }
  };

  const filteredBudget = {};
  for (const [category, items] of Object.entries(budgetFields)) {
    filteredBudget[category] = {};
    for (const [name, entry] of Object.entries(items)) {
      const entryDate = entry.date ?? '2025-01-01';
      if (!startDate || !endDate || (entryDate >= startDate && entryDate <= endDate)) {
        filteredBudget[category][name] = entry.amount;
      }
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#1A1A1A' : '#' }}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1,}}
      keyboardVerticalOffset={100}
    >

  <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 10, paddingHorizontal: 5 }} style={isDarkMode ? styles.scrollViewDarkMode : styles.scrollView}>
   {/* Calendar Icon to Open Calendar */}
   <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <Text style={[isDarkMode ? styles.subtitleDarkMode : styles.subtitle, { flex: 1 }]}>
        {budgetTotal !== null && budgetTotal !== undefined 
          ? `Your Budget: €${budgetTotal.toFixed(2)}` 
          : 'Your Budget: €0.00'}
      </Text>
      <TouchableOpacity onPress={() => setShowCalendar(true)}>
        <Ionicons name="calendar-outline" size={30} color="#A984BE" />
      </TouchableOpacity>
    </View>
    {message ? <Text style={styles.message}>{message}</Text> : null}
        {remainingBudget !== null && (
          <Text style={[isDarkMode ? styles.subtitleDarkMode : styles.subtitle, { textAlign: 'left', flex: 1 }]}>Remaining Budget: €{remainingBudget.toFixed(2)}</Text>
        )}

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

        <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <View style={{ marginBottom: 10 }}>
          <BudgetPieChart data={filteredBudget} onSlicePress={handleSlicePress} />
          </View>


{Object.entries(filteredBudget).map(([category, expenses]) => {
  const total = Object.values(expenses).reduce((sum, val) => sum + val, 0);
  return (
    <TouchableOpacity key={category} onPress={() => handleSlicePress(category)}
      style={isDarkMode ? styles.categorySummaryDarkMode : styles.categorySummary}>
      <View style={styles.row}>
        <Text style={isDarkMode ? styles.categorySummaryTextDarkMode : styles.categorySummaryText}>{category.toUpperCase()}</Text>
        <Text style={isDarkMode ? styles.categorySummaryTextDarkMode : styles.categorySummaryText}>€{total}</Text>
      </View>
    </TouchableOpacity>
  );
})}

<Modal visible={modalVisible} animationType="slide" transparent>
  <View style={isDarkMode ? styles.modalOverlayDarkMode : styles.modalOverlay}>
    <View style={isDarkMode ? styles.modalContentDarkMode : styles.modalContent}>
    <View style={{marginBottom: 5}}>
      <Ionicons name="close" size={27} color={isDarkMode ? "#fff" : "#000"}
      onPress={() => setModalVisible(false)}/>
      <Text style={[styles.link, { marginTop: 10 }]}>Share Budget With</Text>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={isDarkMode ? styles.groupItemDarkMode : styles.groupItem} onPress={() => handleShareBudget(item.id)}>
            <Text style={isDarkMode ? styles.regularTextDarkMode : styles.regularText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      </View>
    </View>
  </View>
</Modal>

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
</View>

<View style={{ marginTop: 10, marginBottom: 20 }}>
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

      <View style={{ marginBottom: 10 }}>
      <TouchableOpacity
        onPress={() => setIsRecurring(!isRecurring)}
        style={[styles.buttonForm, {
        backgroundColor: isRecurring
          ? '#66bb6a'
          : isDarkMode
          ? '#313131'
          : '#ccc'
        }
      ]}>
    <Text style={styles.buttonTextMiddle}>
      {isRecurring ? 'Recurring Expense ✅' : 'One-time Expense'}
    </Text>
    </TouchableOpacity>
    </View>

        {isRecurring && (
          <View style={isDarkMode? styles.pickerWrapperDarkMode : styles.pickerWrapper}>
            <Picker
              style={isDarkMode? styles.regularTextDarkMode : styles.regularText}
              selectedValue={recurringInterval}
              onValueChange={(itemValue) => setRecurringInterval(itemValue)}
              dropdownIconColor= {isDarkMode ? '#fff' : '#4F4F4F'}
            >
              <Picker.Item label="Daily" value="daily" />
              <Picker.Item label="Weekly" value="weekly" />
              <Picker.Item label="Biweekly" value="biweekly" />
              <Picker.Item label="Monthly" value="monthly" />
              <Picker.Item label="Yearly" value="yearly" />
            </Picker>
          </View>
        )}

<View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 5 }}>
      <Ionicons 
        name="add-circle-outline" 
        size={33} color="#A984BE" 
        onPress={handleAddField}
      />
</View></View>

{recurringItems.filter(e => e.type === 'expense').length === 0 ? (
  <Text style={[
    isDarkMode ? styles.regularTextDarkMode : styles.regularText,
    styles.centerText]}>No recurring expenses yet.</Text>
) : (
  <TouchableOpacity onPress={() => setRecurringModalVisible(true)} style={isDarkMode ? styles.categorySummaryDarkMode : styles.categorySummary}>
    <View style={styles.row}>
      <Text style={isDarkMode ? styles.categorySummaryTextDarkMode : styles.categorySummaryText}>RECURRING EXPENSES</Text>
      <Text style={isDarkMode ? styles.categorySummaryTextDarkMode : styles.categorySummaryText}>
        €{recurringItems
          .filter(e => e.type === 'expense')
          .reduce((sum, e) => sum + e.amount, 0)
          .toFixed(2)}
      </Text>
    </View>
  </TouchableOpacity>
)}

<Modal visible={recurringModalVisible} animationType="slide" transparent>
  <View style={isDarkMode ? styles.modalOverlayDarkMode : styles.modalOverlay}>
    <View style={isDarkMode ? styles.modalContentDarkMode : styles.modalContent}>
    <Ionicons name="close" size={27} color={isDarkMode ? "#fff" : "#000"}
        onPress={() => setRecurringModalVisible(false)}/>
    <Text style={[styles.link, { marginTop: 10 }]}>Recurring Expenses</Text>
    {recurringItems
      ?.filter((item) => item.type === 'expense')
      .map((item, index) => (
      <View key={`${item.expense}-${index}`} style={isDarkMode ? styles.budgetItemDarkMode : styles.budgetItem}>
      <Text style={isDarkMode ? styles.regularTextDarkMode : styles.regularText}>
        {item.expense}: €{item.amount} ({item.interval})
      </Text>
      <TouchableOpacity
        onPress={async () => {
          const user = auth.currentUser;
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) return;

          const data = userSnap.data();
          const updated = (data.recurringEntries || []).filter((_, i) => i !== index);
          await updateDoc(userRef, { recurringEntries: updated });
          setRecurringItems(updated);

          calculateRemainingBudget(budgetFields);
          calculateMonthlySavings().then(setMonthlySavings);
        }}
      >
        <Text style={styles.deleteButton}>
          <Ionicons name="close-outline" size={25}></Ionicons></Text>
      </TouchableOpacity>
    </View>
  ))}
    </View>
  </View>
</Modal>
        <View style={{ marginTop: 15 }}>
          <Text style={[isDarkMode ? styles.subtitleDarkMode : styles.subtitle, styles.centerText]}>Monthly Savings</Text>
          {monthlySavings.map((item) => (
            <Text style={[isDarkMode ? styles.subtitleDarkMode : styles.subtitle, styles.centerText]} key={item.month}>{item.month}: €{item.savings.toFixed(2)}</Text>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView></View>
  );
}
