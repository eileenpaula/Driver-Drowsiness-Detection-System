import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "./.config"; // Import Firebase instances

type accountParams = {
    name: string,
    email: string,
    password: string,
    phone: string,
    emg_name: string,
    emg_phone: string,
}

export const create_user = async ({name, email, password, phone, emg_name, emg_phone}: accountParams) => {
  try {
    // Step 1: Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
    const user = userCredential.user;

    // Step 2: Store extra user data in Firestore using the generated UID
    await setDoc(doc(FIREBASE_DB, "users", user.uid), {
      name,
      email, // Optional (Auth already stores email)
      password, 
      phone,
      emg_name,
      emg_phone,
      createdAt: new Date(),
    });

    console.log("User signed up & data saved in Firestore:", user.uid);
  } catch (error: any) {
    console.error("Signup error:", error.message);
    throw error;
  }
};
