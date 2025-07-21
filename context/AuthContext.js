import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../firebase/config';

/* 
    The AuthProvider component manages the global authentication state of the app.
    
    It listens for changes in the user's authentication status using Firebase's 
    'onAuthStateChanged' listener. If the user is logged in, their data is stored in 
    the 'user' state and made available through the AuthContext to all child components.

    This context allows other parts of the app to access the current user and handle 
    user-specific actions like navigation and profile management.
*/

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  // useEffect hook runs once on component mount to set up the listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('User state:', user);
        setUser(user)
    })

    // Cleanup function to unsubscribe from the auth state listener when the component unmounts
    return () => unsubscribe()
  }, [])

  /*
    Provide the user data to all components wrapped
    within the AuthProvider
  */
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}
