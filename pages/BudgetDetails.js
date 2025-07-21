import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { fetchBudgetById } from '../firebase/firestore'; 
import BudgetPieChart from '../components/BudgetPieChart.js';
import styles from "../styles.js";
import { ThemeContext } from '../context/ThemeContext.js';
import Ionicons from '@expo/vector-icons/Ionicons';

/* 
    The BudgetDetails component displays information about a specific
    shared budget based on the provided budgetId. No one can add or delete
    fields from this page.
*/

export default function BudgetDetails({ route }) {
    const { budgetId } = route.params
    const [budget, setBudget] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const { isDarkMode } = useContext(ThemeContext)

    useEffect(() => {
        const loadBudgetData = async () => {
            try {
                const budgetData = await fetchBudgetById(budgetId)
                setBudget(budgetData)
            } catch (error) {
                console.error('Error fetching budget:', error)
            }
        }

        loadBudgetData()
    }, [budgetId])

    if (!budget || !budget.budget || typeof budget.budget !== 'object') {
        return (
          <View style={styles.container}>
            <Text style={styles.budgetAmount}>No budget data available.</Text>
          </View>
        )
    }
    
    // Format budget into category totals and breakdown
    const formattedBudget = {}
      for (const [category, items] of Object.entries(budget.budget)) {
        formattedBudget[category] = {}
        for (const [name, value] of Object.entries(items)) {
          if (typeof value === 'object' && typeof value.amount === 'number') {
            formattedBudget[category][name] = value.amount
          } else if (typeof value === 'number') {
            formattedBudget[category][name] = value
          }
        }
    }
    
    const handleCategoryPress = (category) => {
        setSelectedCategory(category)
        setDetailModalVisible(true)
    }

    return (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 5 }} style={isDarkMode ? styles.scrollViewDarkMode : styles.scrollView}>
        <View style={{ marginBottom: 10 }}>
          <BudgetPieChart data={formattedBudget} onSlicePress={handleCategoryPress} />
        </View>
        {Object.entries(formattedBudget).map(([category, expenses]) => {
            const total = Object.values(expenses).reduce((sum, val) => sum + val, 0);
            return (
            <TouchableOpacity key={category} onPress={() => handleCategoryPress(category)}
            style={isDarkMode ? styles.categorySummaryDarkMode : styles.categorySummary}>
                <View style={styles.row}>
                <Text style={isDarkMode ? styles.categorySummaryTextDarkMode : styles.categorySummaryText}>{category.toUpperCase()}</Text>
                <Text style={isDarkMode ? styles.categorySummaryTextDarkMode : styles.categorySummaryText}>€{total}</Text>
                </View>
            </TouchableOpacity>
        )
    })}

        <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={isDarkMode ? styles.modalOverlayDarkMode : styles.modalOverlay}>
          <View style={isDarkMode ? styles.modalContentDarkMode : styles.modalContent}>
          <Ionicons name="close" size={27} color={isDarkMode ? "#fff" : "#000"}
            onPress={() => setDetailModalVisible(false)}/>
            <Text style={[styles.link, { marginTop: 10 }]}>Details for {selectedCategory?.toUpperCase()}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {selectedCategory &&
                formattedBudget[selectedCategory] &&
                Object.entries(formattedBudget[selectedCategory]).map(([name, value]) => (
                  <View key={name} style={isDarkMode ? styles.groupItemDarkMode : styles.groupItem}>
                    <Text style={isDarkMode ? styles.regularTextDarkMode : styles.regularText}>{name}: ${value}</Text>
                  </View>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
    )
}
