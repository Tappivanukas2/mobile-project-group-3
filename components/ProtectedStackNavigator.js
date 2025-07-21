import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import NoGroups from '../pages/NoGroups';
import MyBudget from '../pages/MyBudget';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MyGroups from '../pages/MyGroups';
import Group from '../pages/Group';
import BudgetDetails from '../pages/BudgetDetails';
import GroupBudget from '../pages/GroupBudget';
import GroupSettings from '../pages/GroupSettings';
import BudgetSettings from '../pages/BudgetSettings';

/* 
    The ProtectedStackNavigator component handles navigation for authenticated users.
    
    It checks if a user is logged in by using the AuthContext. If no user is logged in, 
    it navigates to the SignIn screen. If the user is logged in, it provides access to 
    protected screens like Profile, Settings, MyBudget, etc.
*/

const Stack = createStackNavigator()

export default function ProtectedStackNavigator() {
  /*
    Use the AuthContext to access the current
    user information
  */
  const { user } = useContext(AuthContext)
  const navigation = useNavigation()

  if (user === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Navigate to the SignIn screen if no user is authenticated
  if (!user) {
    navigation.navigate('SignIn')
    return null
  }

  // If the user is authenticated, render the stack navigator with protected screens
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="NoGroups" component={NoGroups} />
      <Stack.Screen name="MyBudget" component={MyBudget} />
      <Stack.Screen name="MyGroups" component={MyGroups} />
      <Stack.Screen name="Group" component={Group} />
      <Stack.Screen name="BudgetDetails" component={BudgetDetails} />
      <Stack.Screen name="GroupBudget" component={GroupBudget} />
      <Stack.Screen name="GroupSettings" component={GroupSettings} />
      <Stack.Screen name="BudgetSettings" component={BudgetSettings} />
    </Stack.Navigator>
  )
}
