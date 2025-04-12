import { deleteDoc, doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "./.config";
import {deleteUser as firebaseDeleteUser} from "firebase/auth";
import { getStorage, ref, deleteObject, listAll } from "firebase/storage";

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
//!!!!!!!!!!!!!!!! NEVER DELETE ronnie@gmail.com  !!!!!!!!!!!!!!
export async function deleteUser(): Promise<void> {
  const user = FIREBASE_AUTH.currentUser;
  const storage = getStorage();

  if (!user) {
    throw new Error("User not logged in");
  }

  try {
    // Delete user document from Firestore
    const userRef = doc(FIREBASE_DB, "users", user.uid);
    const videoRef = collection(FIREBASE_DB, "users", user.uid, "videos");
    const folderRef = ref(storage, `videos/${user.uid}/`);
    const result = await listAll(folderRef);

    const videoDoc = await getDocs(videoRef);
    const deleteSubDocs = videoDoc.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deleteSubDocs);

    const deletePromises = result.items.map((itemRef) => deleteObject(itemRef));
    await Promise.all(deletePromises);
    
    await deleteDoc(userRef);


    // Delete user from Firebase Auth
    await firebaseDeleteUser(user);

    console.log("User account and data deleted successfully.");
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}
// Optional: define UserInfo type
export type UserInfo = {
  name: string
  password: string
  phone: string
  emg_name: string
  emg_phone: string  
};
