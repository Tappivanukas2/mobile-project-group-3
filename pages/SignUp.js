import React, { useState, useContext } from "react";
import { View, TextInput, Text, Alert, TouchableOpacity } from "react-native";
import { auth, createUserWithEmailAndPassword, db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import styles from "../styles"
import { ThemeContext } from '../context/ThemeContext';

/* 
    The SignUp component allows users to register by providing
    their name, email, phone, and password.
    
    Firebase Authentication lets users sign up and sign in securely.

    Firestore is used to store additional user data such as name, phone number
    and other profile details that don't belong in Authentication.
*/

export default function SignUp({ navigation }) {
  // useState hooks to store input values from the user
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const { isDarkMode } = useContext(ThemeContext)

  // Function to handle user registration
  const handleRegister = async () => {
    // Check if all fields are filled
    if (!name || !email || !phone || !password) {
      Alert.alert("Error", "All fields are required.")
      return
    }
    
    try {
      // Create a new user in Firebase Authentication using email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Store additional user details in Firestore database
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        phone,
        uid: user.uid, // User ID
        groupsId: [],
        budget: {},
        remainingBudget: 0,
      })

      // Empty all input fields after a successful registration
      setName("")
      setEmail("")
      setPhone("")
      setPassword("")

      // Navigate the user to the SignIn screen
      Alert.alert("User registered successfully!")

      // Automatically navigate to Profile after successful sign-up
      navigation.reset({
        index: 0,
        routes: [{ name: 'Protected' }],
      })
      // navigation.navigate("SignIn")
    } catch (error) {
      Alert.alert("Error", error.message)
    }
  }

  return (
    <View style={isDarkMode ? styles.containerDarkMode : styles.container}>
      <Text style={styles.title}>SIGN UP</Text>
      <View style={isDarkMode ? styles.formDarkMode : styles.form}>
        <Text style={styles.link}>Name</Text>
        <TextInput 
          placeholder="" 
          value={name} 
          onChangeText={setName} 
          style={isDarkMode ? styles.formInputDarkMode : styles.formInput} 
        />
        <Text style={styles.link}>Email</Text>
        <TextInput 
          placeholder="" 
          value={email} 
          onChangeText={setEmail} 
          style={isDarkMode ? styles.formInputDarkMode : styles.formInput} 
          keyboardType="email-address" 
        />
        <Text style={styles.link}>Phone number</Text>
        <TextInput 
          placeholder="" 
          value={phone} 
          onChangeText={setPhone} 
          style={isDarkMode ? styles.formInputDarkMode : styles.formInput} 
          keyboardType="phone-pad" 
        />
        <Text style={styles.link}>Password</Text>
        <TextInput 
          placeholder="" 
          value={password} 
          onChangeText={setPassword} 
          style={isDarkMode ? styles.formInputDarkMode : styles.formInput} 
          secureTextEntry 
        />
      </View> 
        <TouchableOpacity style={styles.buttonTwo} onPress={handleRegister}>
          <Text style={styles.buttonTextMiddle}>
            Register
          </Text>
        </TouchableOpacity>

       <Text style={styles.link} onPress={() => navigation.navigate("SignIn")}>
          Already have an account? Sign in
       </Text>
    </View>
  )
}