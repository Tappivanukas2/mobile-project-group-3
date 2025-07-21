import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("darkMode")
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === "true")
      }
    }
    loadTheme()
  }, [])

  const toggleTheme = async () => {
    const newValue = !isDarkMode
    setIsDarkMode(newValue)
    await AsyncStorage.setItem("darkMode", newValue.toString())
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}