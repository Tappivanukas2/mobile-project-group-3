import React, { useState, useContext } from "react";
import { View, TextInput, Text, Alert, TouchableOpacity } from "react-native";
import { auth, signInWithEmailAndPassword } from "../firebase/config";
import styles from "../styles";
import { ThemeContext } from '../context/ThemeContext';

/* 
    The SignIn allows users to log in by providing
    their email and password.
    Firebase Authentication lets users sign up and sign in securely.
*/

export default function SignIn({ navigation }) {
  // useState hooks to store input values from the user
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isDarkMode } = useContext(ThemeContext)

  // Function to handle user sign in
  const handleSignIn = async () => {
    // Checks if all fields are filled
    if (!email || !password) {
      Alert.alert("Error");
      return;
    }

    try {
      // Sign in the user with Firebase Authentication using email and password
      await signInWithEmailAndPassword(auth, email, password);

      // Empty all input fields after a successful sign in
      setEmail("");
      setPassword("");
      
      //Alert.alert("Signed in successfully");
      // Reset navigation after logging-in
      navigation.reset({
        index: 0,
        routes: [{ name: "Protected" }],
      });
      //navigation.navigate("Protected"); // Navigates the user to the profile screen
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={isDarkMode ? styles.containerDarkMode : styles.container}>
      <Text style={styles.title}>SIGN IN</Text>
      <View style={isDarkMode ? styles.formDarkMode : styles.form}>
        <Text style={styles.link}>Email</Text>
        <TextInput
          placeholder=""
          value={email}
          onChangeText={setEmail}
          style={isDarkMode ? styles.formInputDarkMode : styles.formInput}
          keyboardType="email-address"
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
        <TouchableOpacity style={styles.buttonTwo} onPress={handleSignIn}>
          <Text style={styles.buttonTextMiddle}>
            Sign In
          </Text>
        </TouchableOpacity>
      <Text style={styles.link} onPress={() => navigation.navigate("SignUp")}>
        Don't have an account? Sign Up
      </Text>
    </View>
  );
}