import { deleteDoc, doc, updateDoc, } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "./.config";
import {deleteUser as firebaseDeleteUser} from "firebase/auth";
export async function updateUserInfo(updatedFields: Partial<UserInfo>): Promise<void> {
  const user = FIREBASE_AUTH.currentUser;

  if (!user) {
    throw new Error("User not logged in");
  }

  const userRef = doc(FIREBASE_DB, "users", user.uid);

  try {
    await updateDoc(userRef, updatedFields);
    console.log("User info updated successfully.");
  } catch (error) {
    console.error("Error updating user info:", error);
    throw error;
  }
}
//Add reauth before deletion
// export async function deleteUser(): Promise<void> {
//   const user = FIREBASE_AUTH.currentUser;

//   if (!user) {
//     throw new Error("User not logged in");
//   }

//   try {
//     // Delete user document from Firestore
//     const userRef = doc(FIREBASE_DB, "users", user.uid);
//     await deleteDoc(userRef);

//     // Delete user from Firebase Auth
//     await firebaseDeleteUser(user);

//     console.log("User account and data deleted successfully.");
//   } catch (error) {
//     console.error("Error deleting user:", error);
//     throw error;
//   }
// }
// Optional: define UserInfo type
export type UserInfo = {
  name: string
  password: string
  phone: string
  emg_name: string
  emg_phone: string  
};
