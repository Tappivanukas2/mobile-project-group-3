import { getFirestore, doc, setDoc, updateDoc, deleteDoc, collection, getDocs, addDoc, deleteField, arrayUnion, query, onSnapshot, where, serverTimestamp, orderBy } from "firebase/firestore"; 
import { getAuth, onAuthStateChanged, updateEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { auth, db, deleteUser } from "./config";

/* 
    How to navigate this page? 
    Each chapter start with comment: 'FUNCTION FOR XXX STARTS HERE'
    And ends with comment: 'FUNCTIONS FOR XXX ENDS HERE'

    When adding functions into this file add the functions to
    this navigation thing :) Please and thank you <3

    Naming for part:
      * AUTHENTICATION AND ACCOUNT 
          (onAuthStateChanged, getUserData, deleteAccount)
      * UPDATING USERS INFORMATION 
          (updateUserName, updateUserPhone, updateUserEmail, updateUserPassword)
      * USERS BUDGET 
          (addBudgetField, deleteBudgetField, updateUserBudget, updateRemainingUserBudget, updateUserIncome, getRemainingBudget)
      * SHARED BUDGET 
          (shareBudgetWithGroup, fetchSharedBudgets, listenToUserBudgetChanges, deleteSharedBudget, fetchBudgetById)
      * GROUP BUDGET 
          (createGroupBudget, fetchGroupBudgets, setGroupBudget, fetchGroupBudgetById, addGroupBudgetField, deleteGroupBudgetField)
      * GROUP
          (createGroup, normalizePhoneNumber, getRegisteredUsers, matchContactsToUsers, fetchUserGroups, fetchGroupById, deleteGroup)
	    * MESSAGE 
          (sendMessage, listenToMessages, markMessagesAsRead)
	    * GROUP MEMBER 
          (getUserByGroupId, removeMemberFromGroup, addMemberToGroup)
*/

        /* FUNCTIONS FOR AUTHENTICATION AND ACCOUNT STARTS HERE */

// Listen for authentication state changes
let unsubscribeFromBudgetChanges
onAuthStateChanged(auth, () => {
    const user = auth.currentUser;
    if (user) {
        console.log("User logged in:", user.uid);
        unsubscribeFromBudgetChanges = listenToUserBudgetChanges()
        // Call functions only after the user is logged in

        //updateUserIncome(50000);
        //updateUserBudget();
        //updateRemainingUserBudget(10000);
        getUserData();
    } else {
      // User is logged out, clean up any active listeners
      if (unsubscribeFromBudgetChanges) {
        unsubscribeFromBudgetChanges()
    }
        //console.error("No user logged in.");
    }
});

// Function to get user data from Firestore
async function getUserData() {
  const user = auth.currentUser;
  if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
          console.log("User data:", userSnap.data());
      } else {
          console.log("No user data found.");
      }
  }
}

// Function to delete the user's account and data
const deleteAccount = async () => {
  const user = auth.currentUser;

  if (!user) {
      console.error("No user logged in.")
      return
  }

  try {
      const userId = user.uid

      // Get the user's groups
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)
      if (!userSnap.exists()) {
          throw new Error("User document does not exist.")
      }
      const userData = userSnap.data()
      const userGroupsId = userData.groupsId || []

      // Loop through each group and handle ownership or deletion
      for (const groupId of userGroupsId) {
          const groupRef = doc(db, "groups", groupId)
          const groupSnap = await getDoc(groupRef)

          if (!groupSnap.exists()) continue
          const groupData = groupSnap.data()

          const updatedMembers = groupData.members.filter(m => m.uid !== userId)

          if (groupData.owner === userId) {
              if (updatedMembers.length === 0) {
                  // Only member: delete group
                  await deleteDoc(groupRef);
                  console.log(`Deleted group ${groupId} (user was only member)`)
              } else {
                  // Transfer ownership to another member
                  const newOwner = updatedMembers[0];
                  await updateDoc(groupRef, {
                      owner: newOwner.uid,
                      members: updatedMembers
                  })
                  console.log(`Transferred ownership of group ${groupId} to ${newOwner.uid}`)
              }
          } else {
              // Remove the user from members array
              await updateDoc(groupRef, {
                  members: updatedMembers
              })
          }

          // Update the user's presence in group documents
          const memberRef = doc(db, "users", userId)
          const memberSnap = await getDoc(memberRef)
          if (memberSnap.exists()) {
              const memberData = memberSnap.data()
              const updatedGroups = (memberData.groupsId || []).filter(id => id !== groupId)
              await updateDoc(memberRef, {
                  groupsId: updatedGroups
              })
          }
      }

      // Delete all user's shared budgets
      const sharedBudgetsRef = collection(db, "sharedBudgets")
      const q = query(sharedBudgetsRef, where("userId", "==", userId))
      const sharedBudgetsSnap = await getDocs(q)
      const deleteSharedBudgets = sharedBudgetsSnap.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteSharedBudgets)
      //console.log("Deleted all shared budgets related to user.")

      // Delete user document
      await deleteDoc(userRef)
      //console.log("Deleted user document from Firestore.")

      // Delete user from Firebase Auth
      await deleteUser(user)
      //console.log("Deleted user from Firebase Authentication.")
  
  } catch (error) {
      console.error("Error deleting account:", error.message)
  }
}
        /* FUNCTIONS FOR AUTHENTICATION ENDS HERE */

        /* FUNCTIONS FOR UPDATING USERS INFORMATION STARTS HERE */

// Function to update the user's name.
const updateUserName = async (name, currentPassword) => {
  const user = auth.currentUser // Get the currently logged-in user
  if (!user) {
      console.error("No user logged in.")
      return
  }
  // Create credential for re-authentication
  const credential = EmailAuthProvider.credential(user.email, currentPassword)

  try {
    await reauthenticateWithCredential(user, credential)

    // Update Firestore document
    await updateDoc(doc(db, "users", user.uid), {
      name: name
    }, {merge: true})
    console.log("User name updated!")

    const sharedBudgetsRef = collection(db, "sharedBudgets")
    const q = query(sharedBudgetsRef, where("userId", "==", user.uid))
    const querySnapshot = await getDocs(q)

    // Update all shared budgets with new name
    const updatePromises = querySnapshot.docs.map((sharedBudgetDoc) => {
      return updateDoc(sharedBudgetDoc.ref, {
        userName: name
      })
    })

    await Promise.all(updatePromises)

    const groupsRef = collection(db, "groups")
    const groupSnapshot = await getDocs(groupsRef)
    console.log("Group Snapshot:", groupSnapshot.docs)

    // Update all groups with new name
    const groupUpdatePromises = groupSnapshot.docs.map((groupDoc) => {
      const members = groupDoc.data().members
      const memberToUpdate = members.find(member => member.uid === user.uid)
      if (memberToUpdate) {
        const updatedMembers = members.map(member => {
        if (member.uid === user.uid) {
          return { ...member, name: name };
        }
        return member
        })
        return updateDoc(groupDoc.ref, {
          members: updatedMembers
        })
      } else {
          console.log("User is not a member of this group:", groupDoc.id)
      }
    })

    await Promise.all(groupUpdatePromises) 
  } catch (error) {
      console.error("Error updating user name:", error)
  }
}

// Function to update the user's phone number.
const updateUserPhone = async (phone, currentPassword) => {
  const user = auth.currentUser
  if (!user) {
      console.error("No user logged in.")
      return
  }
  // Create credential for re-authentication
  const credential = EmailAuthProvider.credential(user.email, currentPassword);

  try {
    await reauthenticateWithCredential(user, credential)

    // Update Firestore document
    await updateDoc(doc(db, "users", user.uid), {
      phone: phone
    }, {merge: true})
      console.log("User phone updated!")

    const sharedBudgetsRef = collection(db, "sharedBudgets")
    const q = query(sharedBudgetsRef, where("userId", "==", user.uid))
    const querySnapshot = await getDocs(q)
    const updatePromises = querySnapshot.docs.map((sharedBudgetDoc) => {
      return updateDoc(sharedBudgetDoc.ref, {
        userPhone: phone
      })
    })

    await Promise.all(updatePromises)
    console.log("Updated phone number in shared budgets.")

    const groupsRef = collection(db, "groups")
    const groupSnapshot = await getDocs(groupsRef)
    const groupUpdatePromises = groupSnapshot.docs.map((groupDoc) => {
      const members = groupDoc.data().members
      const memberToUpdate = members.find(member => member.uid === user.uid)
      if (memberToUpdate) {
        const updatedMembers = members.map(member => {
        if (member.uid === user.uid) {
          return { ...member, phone: phone };
        }
        return member
        })
        return updateDoc(groupDoc.ref, {
          members: updatedMembers
        })
      } else {
          console.log("User is not a member of this group:", groupDoc.id)
      }
    })

    await Promise.all(groupUpdatePromises)
    console.log("Updated phone number in groups.")

  } catch (error) {
      console.error("Error updating user phone:", error)
  }
}

// Function to update the user's email address (requires re-authentication).
const updateUserEmail = async (newEmail, currentPassword) => {
  const user = auth.currentUser

  if (!user) {
      console.error("No user logged in.")
      return
  }

  // Create credential for re-authentication
  const credential = EmailAuthProvider.credential(user.email, currentPassword);

  try {
      // Re-authenticate the user
      await reauthenticateWithCredential(user, credential)
      console.log("Re-authentication successful!")

      // Update email in Firebase Authentication
      await updateEmail(user, newEmail)
      console.log("Email updated successfully in Authentication!")

      // Update email in Firestore
      await updateDoc(doc(db, "users", user.uid), {
          email: newEmail,
      }, {merge: true})
      console.log("Email updated successfully in Firestore!")

  } catch (error) {
      console.error("Error updating email:", error.message)
  }
}

// Function to update the user's password (requires re-authentication).
const updateUserPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser
  
  if (!user) {
      console.error("No user logged in.")
      return
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword)

  try {
      // Re-authenticate the user
      await reauthenticateWithCredential(user, credential);
      console.log("Re-authentication successful!");

      // Update password in Firebase Authentication
      await updatePassword(user, newPassword)
      console.log("Password updated successfully!")

  } catch (error) {
      console.error("Error updating password:", error.message)
  }
}

        /* FUNCTIONS FOR UPDATING USERS INFORMATION ENDS HERE */

        /* FUNCTIONS FOR USERS BUDGET STARTS HERE */

// Add a new budget field and subtract from remaining budget
const addBudgetField = async (category, expense, amount, date = null) => {
    const user = auth.currentUser;
    if (!user) return { error: "No user logged in." };
  
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { error: "User document not found." };
  
    const data = userSnap.data();
    const currentRemaining = data.remainingBudget ?? 0;
  
    let updateData;

    if (typeof amount === "number") {
      category = category.replace(/[^a-zA-Z0-9_]/g, "_");
      expense = expense.replace(/[^a-zA-Z0-9_]/g, "_");

      today = date || new Date().toISOString().split("T")[0];
  
      const path = `budget.${category}.${expense}`;
      updateData = {
        [path]: {
          amount: amount,
          date: today,
        }
      };
    } else {
      updateData = {
        [`budget.${category}`]: {
          [expense]: { amount, date },
          remainingBudget: currentRemaining - amount,
        },
      };
    }
  
    try {
      await updateDoc(userRef, updateData);
      return { success: true, remainingBudget: updateData.remainingBudget };
    } catch (error) {
      console.error("Error adding budget field:", error);
      return { error: "Failed to update budget." };
    }
};  

// delete a budget field and add to remaining budget
const deleteBudgetField = async (category, expense) => {
  const user = auth.currentUser;
  
  if (!user) return { error: "No user logged in." };

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return { error: "User document not found." };

  const data = userSnap.data();
  const currentRemaining = data.remainingBudget ?? 0;

  let value = 0;
  let path;
  let categoryPath;

  if (expense !== null) {
    path = `budget.${category}.${expense}`;
    value = data.budget?.[category]?.[expense]?.amount ?? 0;
    categoryPath = `budget.${category}`;
  } else {
    path = `budget.${category}`;
    value = data.budget?.[category]?.amount ?? 0;
    categoryPath = `budget.${category}`;
  }

  try {
    await updateDoc(userRef, {
      [path]: deleteField(),
      remainingBudget: currentRemaining + value,
    });

    // After deletion, check if the category is now empty
    const updatedUserSnap = await getDoc(userRef);
    const updatedData = updatedUserSnap.data();

    // If the category has no expenses left, remove the entire category
    if (expense !== null) {
      const isCategoryEmpty = !updatedData.budget?.[category] || Object.keys(updatedData.budget?.[category]).length === 0;
      
      if (isCategoryEmpty) {
        await updateDoc(userRef, {
          [categoryPath]: deleteField(),
        });
      }
    }

    return { success: true, remainingBudget: currentRemaining + value };
  } catch (error) {
    console.error("Error deleting budget field:", error);
    return { error: "Failed to delete budget field." };
  }
};

// Function to create a budget field and update it to Firestore 
// Luultavasti turha, koska budjetti on jo luotu ja se on tallennettu Firestoreen
const updateUserBudget = async (budget) => {
  const user = auth.currentUser;

  if (!user) {
      console.error("No user logged in.");
      return;
  } else {
      try {
          await updateDoc(doc(db, "users", user.uid), {
              budget: budget, // Add or update the "budget" field
          }, {merge: true});
          console.log("Budget field added/updated!");
          console.log("User budget:", budget);
          } catch (error) {
          console.error("Error updating user data:", error);
          }
  }
};

const updateRemainingUserBudget = async (remainingBudget) => {
  const user = auth.currentUser;

  if (!user) {
      console.error("No user logged in.");
      return;
  } else {
      try {
          await updateDoc(doc(db, "users", user.uid), {
              remainingBudget: remainingBudget, // Add or update the "budget" field
          }, {merge: true});
          console.log("remainingBudget field added/updated!");
          console.log("Remaining User budget:", remainingBudget);
          } catch (error) {
          console.error("Error updating user data:", error);
          }
  }
};

// Function to create an income field and update it to Firestore
const updateUserIncome = async (income) => {
  const user = auth.currentUser;

  if (!user) {
    console.error("No user logged in.");
    return;
  } else {
      try {
          await updateDoc(doc(db, "users", user.uid), {
              income: income, // Add or update the "income" field
          }, {merge: true});
          console.log("Income field added/updated!");
          console.log("User income:", income);
          } catch (error) {
          console.error("Error updating user data:", error);
          }
  }
};

// Get remaining budget from Firestore
const getRemainingBudget = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  const userRef = doc(db, "users", user.uid);
  // get data from the user document
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
      const data = userSnap.data();
      return data.remainingBudget ?? data.budget ?? 0;
  } else {
      // If no document, create one with default budget
      await setDoc(userRef, {
          budget: 10000,
          remainingBudget: 10000
      });
      return 10000;
  }
};

/* Functions for recurring budget start */

const addRecurringEntry = async (category, expense, amount, interval, startDate, endDate = null, type = "expense") => {
  const user = auth.currentUser;
  if (!user) return { error: "No user logged in." };

  const userRef = doc(db, "users", user.uid);
  const recurringEntry = {
    category,
    expense,
    amount,
    interval, // daily, weekly, biweekly, monthly, yearly
    startDate,
    endDate,
    type, // "income" or "expense"
  };

  try {
    await updateDoc(userRef, {
      recurringEntries: arrayUnion(recurringEntry),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding recurring entry:", error);
    return { error: "Failed to add recurring entry." };
  }
};

const generateRecurringInstances = (entry, upToDate) => {
  const results = [];
  const { interval, startDate, endDate, amount, category, expense, type } = entry;

  let currentDate = new Date(startDate);
  const finalDate = endDate ? new Date(endDate) : new Date(upToDate);

  while (currentDate <= finalDate && currentDate <= new Date(upToDate)) {
    results.push({
      category,
      expense,
      amount,
      date: new Date(currentDate),
      type,
    });

    switch (interval) {
      case "daily": currentDate.setDate(currentDate.getDate() + 1); break;
      case "weekly": currentDate.setDate(currentDate.getDate() + 7); break;
      case "biweekly": currentDate.setDate(currentDate.getDate() + 14); break;
      case "monthly": currentDate.setMonth(currentDate.getMonth() + 1); break;
      case "yearly": currentDate.setFullYear(currentDate.getFullYear() + 1); break;
    }
  }

  return results;
};

const getExpandedBudget = async (upToDate = new Date()) => {
  const user = auth.currentUser;
  if (!user) return [];

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return [];

  const data = userSnap.data();
  const recurringEntries = data.recurringEntries || [];

  const allEntries = recurringEntries.flatMap(entry => 
    generateRecurringInstances(entry, upToDate)
  );

  return allEntries;
};

const getRemainingBudgetWithRecurring = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;

  const data = userSnap.data();
  let baseBudget = data.income || 0;
  let manualExpenses = 0;

  if (data.budget) {
    for (const category in data.budget) {
      const items = data.budget[category];
      if (typeof items === 'object') {
        for (const field in items) {
          if (items[field].amount) {
            manualExpenses += items[field].amount;
          }
        }
      }
    }
  }

  const recurringEntries = await getExpandedBudget(new Date());

  recurringEntries.forEach(entry => {
    if (entry.type === 'income') baseBudget += entry.amount;
    else if (entry.type === 'expense') manualExpenses += entry.amount;
  });

  return baseBudget - manualExpenses;
};

/* Functions for recurring budget end */

        /* FUNCTIONS FOR USERS BUDGET ENDS HERE */

        /* FUNCTIONS FOR SHARED BUDGET STARTS HERE */

// Share the user's budget with a group
const shareBudgetWithGroup = async (groupId) => {
  const user = auth.currentUser

  if (!user) {
      console.error("No user logged in.")
      return
  }

  // Check if the user has already shared their budget with this group
  const sharedBudgetsRef = collection(db, "sharedBudgets")
  const q = query(sharedBudgetsRef, where("userId", "==", user.uid), where("groupId", "==", groupId))
  const querySnapshot = await getDocs(q)

  if (!querySnapshot.empty) {
      console.error("Budget already shared with this group.")
      return
  }

  // Get the user's budget
  const userRef = doc(db, "users", user.uid)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) {
      console.error("User document not found.")
      return
  }

  // Get user's current budget
  const userBudget = userSnap.data().budget
  const userData = userSnap.data()
  const userName = userData.name || "Unknown User"

  // Create a new shared budget document
  try {
      await setDoc(doc(sharedBudgetsRef), {
          userId: user.uid,
          userName: userName,
          groupId: groupId,
          budget: userBudget,
      })
      console.log("Budget shared successfully!")
  } catch (error) {
      console.error("Error sharing budget:", error)
  }
}

// Fetch all shared budgets for a given group
const fetchSharedBudgets = async (groupId) => {

  if (!groupId) {
      console.error("Group ID is required.")
      return []
  }

  try {
      const sharedBudgetsRef = collection(db, "sharedBudgets")
      const q = query(sharedBudgetsRef, where("groupId", "==", groupId))
      const querySnapshot = await getDocs(q)

      // Map over the documents and return an array of shared budgets
      const sharedBudgets = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }))

      return sharedBudgets // Return the fetched budgets
  } catch (error) {
      console.error("Error fetching shared budgets:", error)
      return []
  }
}

// Listen for changes to the user's budget in the database
const listenToUserBudgetChanges = () => {
  const user = auth.currentUser

  if (!user) {
      console.error("No user logged in.")
      return
  }

  const userRef = doc(db, "users", user.uid)

  // Set up a real-time listener for changes to the user's document
  const unsubscribe = onSnapshot(userRef, async (doc) => {
      if (doc.exists()) {
          const updatedBudget = doc.data().budget // Get updated budget value

          const sharedBudgetsRef = collection(db, "sharedBudgets")

          // Query shared budgets where the user is the owner
          const q = query(sharedBudgetsRef, where("userId", "==", user.uid))
          const querySnapshot = await getDocs(q)

          // Update all shared budgets with the new budget value
          const updatePromises = querySnapshot.docs.map((sharedBudgetDoc) => {
              return updateDoc(sharedBudgetDoc.ref, {
                  budget: updatedBudget,
              })
          })

          // Wait for all updates to complete
          await Promise.all(updatePromises)
          console.log("Shared budgets updated successfully!")
      }
  })
  return unsubscribe
}

// Delete a shared budget in a specific group
const deleteSharedBudget = async (groupId) => {
  const user = auth.currentUser

  if (!user) {
      console.error("No user logged in.")
      return
  }

  try {
      // Find the shared budget where the userId matches the logged-in user
      const sharedBudgetsRef = collection(db, "sharedBudgets")

      // Create a query to find the shared budget document where:
      // - The userId matches the logged-in user
      // - The groupId matches the provided groupId
      const q = query(sharedBudgetsRef, where("userId", "==", user.uid), where("groupId", "==", groupId))
    
      // Execute the query and get the matching documents
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
          console.error("No shared budget found for this user in the group.")
          return
      }

      // Delete all matching budget documents (should usually be just one)
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      console.log("Shared budget deleted successfully!")
  } catch (error) {
      console.error("Error deleting shared budget:", error)
  }
}

// Fetches shared budget by Id
const fetchBudgetById = async (budgetId) => {
  try {
      const budgetRef = doc(db, "sharedBudgets", budgetId)
      const budgetSnap = await getDoc(budgetRef)
      if (budgetSnap.exists()) {
          return budgetSnap.data()
      } else {
          console.error("No such budget!")
          return null
      }
  } catch (error) {
      console.error("Error fetching budget:", error)
      return null
  }
}

        /* FUNCTIONS FOR SHARED BUDGET ENDS HERE */

        /* FUNCTIONS FOR GROUP BUDGET STARTS HERE */

// Set initial budget for the group
const createGroupBudget = async ({ budgetName, groupId }) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("No user logged in.");
    return null;
  }

  try {
    // Get the group's info (optional, if needed for other properties)
    const groupBudgetRef = collection(db, "groupBudget");

    // Create a new budget with ownerId set to the current user's UID
    const newBudget = await addDoc(groupBudgetRef, {
      name: budgetName,
      groupId: groupId,
      budget: {}, // You can fill this with your actual budget structure
      ownerId: user.uid, // Add the ownerId field here
      remainingBudget: 2722, // Example: initial budget for the group (if needed)
    });

    console.log("Budget created with ID:", newBudget.id);
    return newBudget.id;
  } catch (error) {
    console.error("Error creating budget:", error);
    return null;
  }
}

// Using for listing
const fetchGroupBudgets = async (groupId) => {
  if (!groupId) {
      console.error("fetchGroupBudgets called with undefined groupId.");
      return [];
  }

  try {
      console.log("Querying Firestore for budgets with groupId:", groupId);
      const budgetsRef = collection(db, "groupBudget");
      const q = query(budgetsRef, where("groupId", "==", groupId));
      const budgetsSnap = await getDocs(q);


      if (budgetsSnap.empty) {
          console.warn("No budgets found for groupId:", groupId);
      }

      const budgets = budgetsSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          budget: doc.data().budget,
      }));
      
      console.log("Fetched budgets:", budgets);
      return budgets;
  } catch (error) {
      console.error("Error fetching group budgets: ", error);
      return [];
  }
};

const setGroupBudget = async (groupId, budgetValue) => {
  if (!auth.currentUser) return { error: "Not authenticated." }

  const groupBudgetRef = doc(db, 'groupBudget', groupId)
  const groupBudgetSnap = await getDoc(groupBudgetRef)
  if (!groupBudgetSnap.exists()) return { error: "Group not found." }

  try {
      await updateDoc(groupBudgetRef, {
          remainingBudget: budgetValue,
          budget: {}
      })
      return { success: true }
  } catch (err) {
      console.error("Error setting group budget:", err)
      return { error: "Failed to set group budget." }
  }
}

// Using for navigation
const fetchGroupBudgetById = async (budgetId) => {
  try {
      const budgetRef = doc(db, "groupBudget", budgetId)
      const budgetSnap = await getDoc(budgetRef)
      if (budgetSnap.exists()) {
          return budgetSnap.data()
      } else {
          console.error("No such budget!")
          return null
      }
  } catch (error) {
      console.error("Error fetching budget:", error)
      return null
  }
}

// Add an expense field to a group (subtract from the overall budget)
const addGroupBudgetField = async (groupId, category, expense, amount, date = null) => {
  if (!auth.currentUser) return { error: "Not authenticated." }

  const groupBudgetRef = doc(db, 'groupBudget', groupId)
  const groupBudgetSnap = await getDoc(groupBudgetRef)
  if (!groupBudgetSnap.exists()) return { error: "Group not found." }

  const currentBudget = groupBudgetSnap.data().remainingBudget ?? 0

  if (typeof amount !== 'number' || amount > currentBudget) {
    return { error: "Invalid or insufficient budget amount." }
  }

  const safeCategory = category.replace(/[^a-zA-Z0-9_]/g, "_")
  const safeExpense = expense.replace(/[^a-zA-Z0-9_]/g, "_")
  const today = date || new Date().toISOString().split("T")[0]

  const path = `budget.${safeCategory}.${safeExpense}`

  try {
    await updateDoc(groupBudgetRef, {
      [path]: {
        amount: amount,
        date: today,
      },
      remainingBudget: currentBudget - amount,
    })
    return { success: true }
  } catch (err) {
    console.error("Error adding group expense:", err)
    return { error: "Failed to update group budget." }
  }
}

// Delete an expense field from a group (add back to the overall budget)
const deleteGroupBudgetField = async (groupId, category, expense = null) => {
  if (!auth.currentUser) return { error: "Not authenticated." };

  const groupBudgetRef = doc(db, 'groupBudget', groupId);
  const groupBudgetSnap = await getDoc(groupBudgetRef);
  if (!groupBudgetSnap.exists()) return { error: "Group not found." }

  const data = groupBudgetSnap.data();
  const currentRemaining = data.remainingBudget ?? 0;

  let value = 0;
  let path;
  let categoryPath = `budget.${category}`;

  if (expense !== null) {
    path = `budget.${category}.${expense}`;
    value = data.budget?.[category]?.[expense]?.amount ?? 0;
  } else {
    path = `budget.${category}`;
    value = data.budget?.[category]?.amount ?? 0;
  }

  try {
    await updateDoc(groupBudgetRef, {
      [path]: deleteField(),
      remainingBudget: currentRemaining + value,
    });

    // Fetch updated group budget to check if the category is now empty
    const updatedSnap = await getDoc(groupBudgetRef);
    const updatedData = updatedSnap.data();

    if (expense !== null) {
      const isCategoryEmpty =
        !updatedData.budget?.[category] ||
        Object.keys(updatedData.budget?.[category]).length === 0;

      if (isCategoryEmpty) {
        await updateDoc(groupBudgetRef, {
          [categoryPath]: deleteField(),
        });
      }
    }

    return { success: true, remainingBudget: currentRemaining + value };
  } catch (error) {
    console.error("Error deleting group budget field:", error);
    return { error: "Failed to delete group budget field." };
  }
}

        /* FUNCTIONS FOR GROUP BUDGET ENDS HERE */

        /* FUNCTIONS FOR GROUP STARTS HERE */

const createGroup = async (groupName, selectedMembers) => {
  const user = auth.currentUser // Get the currently logged-in user
        
  if (!user) {
    return alert("You need to be logged in to create a group")
  }
        
  if (!groupName.trim()) {
    return alert("Enter a valid group name")
  }
          
  // Fetch the owner's details from Firestore
  const userDocRef = doc(db, "users", user.uid)
  const userDocSnap = await getDoc(userDocRef)
      
  let ownerDetails = {
    uid: user.uid,
    phone: user.phone || "Unknown",
    name: user.displayName || "Unknown",
  }
      
  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    ownerDetails = {
      uid: user.uid,
      phone: userData.phone || "Unknown",
      name: userData.name || user.displayName || "Unknown",
    };
  }
      
  //Ensure the owner is in the members list
  const allMembers = [...selectedMembers]
      
  //Check if owner is already in the list; if not add them
  if (!selectedMembers.some(member => member.uid === user.uid)) {
    allMembers.push(ownerDetails)
  }
      
  // Remove contactName before saving to Firestore
  const filteredMembers = allMembers.map(({ contactName, ...rest }) => rest)
        
  // Prepare group data
  const newGroup = {
    name: groupName,
    owner: user.uid, // Set the creator as the owner
    members: filteredMembers, //Store all members
  }
          
  try {
    //Create the group and get the generated groupId
    const groupRef = await addDoc(collection(db, "groups"), newGroup)
    const groupId = groupRef.id
      
    //Update each user's groupsId field to include the new groupId
    const updatePromises = filteredMembers.map((member) =>
      updateDoc(doc(db, "users", member.uid), {
        groupsId: arrayUnion(groupId),
      })
    )
      
    await Promise.all(updatePromises)
  } catch (error) {
      console.error("Error creating group:", error)
      alert("Failed to create group")
  }
}

// Normalize phone numbers by removing non-digit characters
const normalizePhoneNumber = (number) => {
  if (!number) return ""
  let formatted = number.replace(/\D/g, "") // Remove all non-digit characters
  if (formatted.startsWith("0")) {
    formatted = "358" + formatted.slice(1) // Convert local Finnish numbers to international format
  }
  return formatted
}

// Fetch all registered users from database
const getRegisteredUsers = async () => {
  const usersRef = collection(db, "users")
  const snapshot = await getDocs(usersRef)

  return snapshot.docs.map((doc) => ({
      uid: doc.id, // Get user ID
      phone: normalizePhoneNumber(doc.data().phone),
      name: doc.data().name, // Get name from database
  }))
}

// Check if contacts exist in database
const matchContactsToUsers = async (contacts) => {
  const usersFromDB = await getRegisteredUsers()

  return contacts
    .map((contact) => {
      const phoneNumber = normalizePhoneNumber(contact.phoneNumbers?.[0]?.number)
      const matchedUser = usersFromDB.find(user => user.phone === phoneNumber)
      if (matchedUser) {
          return {
              id: contact.id,
              uid: matchedUser.uid,
              contactName: contact.name,
              name: matchedUser.name,
              phone: phoneNumber,
          }
      }
      return null
    })
    .filter(Boolean)
}

//Function to fetch the logged-in user's groups
const fetchUserGroups = async () => {
  const user = auth.currentUser
  if (!user) return []

  try {
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      const userData = userSnap.data()
      const userGroupsId = userData.groupsId || [] //Get the array of group IDs

      if (userGroupsId.length === 0) return []

      let groups = []
      const batchSize = 10

      for (let i = 0; i < userGroupsId.length; i += batchSize) {
          const batchIds = userGroupsId.slice(i, i + batchSize)
          const q = query(collection(db, "groups"), where("__name__", "in", batchIds))
          const groupsSnap = await getDocs(q)
              
          groups.push(...groupsSnap.docs.map((doc) => ({
              id: doc.id,
              name: doc.data().name,
          })))
      }
  
      return groups
  } catch (error) {
      console.error("Error fetching groups: ", error)
      return []
  }
}

const fetchGroupById = async (groupId) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
          console.error("Group not found:", groupId);
          return null;
      }

      console.log("Fetched group:", groupSnap.data());
      return { id: groupSnap.id, ...groupSnap.data() };
  } catch (error) {
      console.error("Error fetching group:", error);
      return null;
  }
}

const deleteGroup = async (groupId) => {
  const user = auth.currentUser;
  if (!user) {
      console.error("No user logged in.");
      return;
  }

  try {
    const groupRef = doc(db, "groups", groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
        console.error("Group does not exist.");
        return;
    }

    const groupData = groupSnap.data();
    if (groupData.owner !== user.uid) {
        console.error("User is not the owner of the group.");
        return;
    }

      // Fetch all budgets associated with the group
      const budgetsRef = collection(db, "groupBudget");
      const q = query(budgetsRef, where("groupId", "==", groupId));
      const budgetsSnap = await getDocs(q);

      // Delete each budget associated with the group
      const deleteBudgetPromises = budgetsSnap.docs.map((budgetDoc) => deleteBudget(budgetDoc.id));
      await Promise.all(deleteBudgetPromises);

      // Removes the groupId from all users who are members of the group
      const members = groupData.members || [];
      const updatePromises = members.map(async (member) => {
        const userRef = doc(db, "users", member.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const updatedGroups = (userData.groupsId || []).filter(id => id !== groupId);
            await updateDoc(userRef, {
                groupsId: updatedGroups
            });
        }
      });
      await Promise.all(updatePromises);
  
      // Deletes all shared budgets associated with the group
      const sharedBudgetsRef = collection(db, "sharedBudgets");
      const sharedBudgetsQuery = query(sharedBudgetsRef, where("groupId", "==", groupId));
      const sharedBudgetsSnap = await getDocs(sharedBudgetsQuery);
      const deleteSharedBudgetsPromises = sharedBudgetsSnap.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deleteSharedBudgetsPromises);
  
      // deletes the group
      await deleteDoc(groupRef);
      console.log("Group deleted successfully!");
    } catch (error) {
        console.error("Error deleting group:", error.message);
    }
  };

        /* FUNCTIONS FOR GROUP ENDS HERE */

        /* FUNCTIONS FOR MESSAGE STARTS HERE */

/* Message functions */
const sendMessage = async (groupId, text) => {
  const currentUser = auth.currentUser//Get logged-in user
  //Stop if user is not logged-in or message is empty
  if (!currentUser || !text.trim()) return
  try {
    //Fetch info from users collection(name and phone)
    const userDocRef = doc(db, "users", currentUser.uid)
    const userSnap = await getDoc(userDocRef)
    //Use either custom 'name' from DB or fallback to firebase displayName
    const userData = userSnap.exists() ? userSnap.data() : {}
    const senderId = currentUser.uid
    const senderName = userData.name || currentUser.displayName || "Unknown"
    //Message object fields
    const message = {
      text: text.trim(),
      senderId: senderId,
      senderName: senderName,
      timestamp: serverTimestamp(),
      type: "text",
      readBy: [senderId],
    }
    //Get reference to the group's chat subcollection
    //Firestore path: messages/{groupId}/chats
    const messagesRef = collection(db, "messages", groupId, "chats")
    //Add messages to firestore
    await addDoc(messagesRef, message)
  } catch (error) {
    console.error("Error sending message: ", error)
  }
}

const listenToMessages = (groupId, callback) => {
  const messagesRef = collection(db, "messages", groupId, "chats")
  const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"))

  //Real-time listener
  const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(messages) //Update state in UI
  })
  return unsubscribe //Call this to stop listening
}

const markMessagesAsRead = async (groupId) => {
  const user = auth.currentUser
  if (!user) return

  try {
    const messagesRef = collection(db, "messages", groupId, "chats")
    //Find messages NOT read by this user
    const q = query(messagesRef, where("readBy", "not-in", [user.uid]))

    const snapshot = await getDocs(q)
    const unreadMessages = snapshot.docs.filter(
      (doc) => !doc.data().readBy?.includes(user.uid)
    )
    const updatePromises = unreadMessages.map((doc) => {
      return updateDoc(doc.ref, {
        readBy: arrayUnion(user.uid),
        isRead: true,
      })
    })
    
    await Promise.all(updatePromises)
  } catch (error) {
    console.error("Error marking messages as read: ", error)
  }
}

const deleteBudget = async (budgetId) => {
    const user = auth.currentUser;
    if (!user) {
        console.error("No user logged in.");
        return;
    }

    try {
        const groupBudgetRef = doc(db, "groupBudget", budgetId);
        const groupBudgetSnap = await getDoc(groupBudgetRef);

        if (!groupBudgetSnap.exists()) {
            console.error("Group budget does not exist.");
            return;
        }

        // Verify the current user is the owner
        const groupBudgetData = groupBudgetSnap.data();
        if (groupBudgetData.ownerId !== user.uid) {
            console.error("Only the owner can delete the budget.");
            return;
        }

        await deleteDoc(groupBudgetRef);
        console.log("Budget deleted successfully!");
    } catch (error) {
        console.error("Error deleting budget:", error.message);
    }
};

        /* FUNCTIONS FOR MESSAGE ENDS HERE */

        /* FUNCTIONS FOR GROUP MEMBER STARTS HERE */

//Fetch for group members
const getUserByGroupId = async (groupId) => {
  try {
      console.log("Fetching group data for groupId:", groupId)

      const groupRef = doc(db, "groups", groupId)
      const groupSnap = await getDoc(groupRef)

      if (!groupSnap.exists()) {
          console.error("No group found for groupId:", groupId)
          return null
      }

      const groupData = groupSnap.data()
      //console.log("Fetched group data:", groupData)

      if (!groupData.members || !Array.isArray(groupData.members)) {
          console.error("No valid members array found for group:", groupId)
          return null
        }
      
        const members = groupData.members.map((member) => ({ ...member }))
    
        console.log("Fetched group members:", members)

      return {
          members: groupData.members,
          ownerId: groupData.owner,
      }
  } catch (error) {
      console.error("Error fetching group members:", error)
      return null
  }
}

const removeMemberFromGroup = async (groupId, memberUid) => {
  const groupRef = doc(db, "groups", groupId)
  const groupSnap = await getDoc(groupRef)

  if (!groupSnap.exists()) throw new Error("Group not found")
  
  const groupData = groupSnap.data()
  //Prevent removing the owner
  if (groupData.owner === memberUid) {
      throw new Error("The owner cannot remove themselves from the group.")
  }
  //Remove the full member object from the group's members array
  const updatedMembers = groupData.members.filter(
      (member) => member.uid !== memberUid
  )

  //Update group document
  await updateDoc(groupRef, {
      members: updatedMembers
  })

  //Remove groupId from the user's document in users collection
  const userRef = doc(db, "users", memberUid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
      const userData = userSnap.data()
      const updatedGroups = (userData.groupsId || []).filter(id => id !== groupId)

      await updateDoc(userRef, {
          groupsId: updatedGroups
      })
  }

}

const addMemberToGroup = async (groupId, members) => {
  try {
    const groupRef = doc(db, "groups", groupId)
    // Remove contactName before adding to group
    const cleanedMembers = members.map(({ contactName, ...rest }) => rest)

    await updateDoc(groupRef, {
      members: arrayUnion(...cleanedMembers)
    })

    const updatePromises = cleanedMembers.map(member => {
      const userRef = doc(db, "users", member.uid)
      return updateDoc(userRef, {
        groupsId: arrayUnion(groupId)
      })
    })
    await Promise.all(updatePromises)
  } catch (error) {
    console.error("Error adding members: to group: ", error)
  }
}

        /* FUNCTIONS FOR GROUP MEMBER ENDS HERE */

export {
    fetchSharedBudgets, shareBudgetWithGroup,
    createGroup, matchContactsToUsers, updateUserIncome, 
    updateUserBudget, getUserData, updateUserPhone, 
    updateUserName, updateUserEmail, updateUserPassword, 
    deleteAccount, getRemainingBudget, addBudgetField, 
    fetchUserGroups, fetchGroupById, createGroupBudget,
    deleteBudgetField, fetchGroupBudgets, fetchBudgetById,
    deleteSharedBudget, deleteGroup, sendMessage, listenToMessages,
    markMessagesAsRead, fetchGroupBudgetById, deleteGroupBudgetField,
    addGroupBudgetField, setGroupBudget, getUserByGroupId,
    removeMemberFromGroup, addMemberToGroup, deleteBudget,
    addRecurringEntry, generateRecurringInstances, getExpandedBudget,
    getRemainingBudgetWithRecurring
};