import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import { AuthProvider } from './context/AuthContext';
import ProtectedStackNavigator from './components/ProtectedStackNavigator';
import Footer from './components/Footer';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';

const Stack = createStackNavigator()

function AppNavigator() {
  const { isDarkMode } = useContext(ThemeContext)

  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName="SignIn">
        {/* Public Routes */}
        <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
        <Stack.Screen name="SignIn" component={SignIn} options={{ headerShown: false }} />

        {/* Protected Routes */}
        <Stack.Screen name="Protected" component={ProtectedStackNavigator} options={{ headerShown: false }} />
      </Stack.Navigator>
      <Footer />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <AppNavigator/>
    </AuthProvider>
    </ThemeProvider>
  )
}