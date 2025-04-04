import { setDoc, doc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "./.config"; // Import Firebase instances
import { signInWithEmailAndPassword } from 'firebase/auth';

type accountParams = {
    email: string,
    password: string,
}

export const login_user = async ({email, password}: accountParams) => {
  try {
    // Step 1: Create user in Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
    const user = userCredential.user;

    console.log("User logged in:", user.uid);
  } catch (error: any) {
    console.error("Login error:", error.message);
  }
};
