import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { FIREBASE_AUTH, FIREBASE_DB } from "./.config";

export async function getInfo(){
    const q = query(collection(FIREBASE_DB, "users"));

    const querySnapshot = await getDocs(collection(FIREBASE_DB, "users"));
    querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    console.log(doc.id, " => ", doc.data());
    });
}

export async function getUserInfo() {
    const auth = FIREBASE_AUTH;
    const user = auth.currentUser;

    if (!user) {
        console.error("No user is currently logged in.");
        return null; // Handle case where user is not logged in
    }

    const db = FIREBASE_DB;
    const userDocRef = doc(db, "users", user.uid); // Reference to the specific user document

    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            console.log("User Data:", docSnap.data());
            return docSnap.data(); // Return the user data for further use
        } else {
            console.error("No such user document found!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}

//Future update
// const q = query(collection(db, "cities"), where("capital", "==", true));

// const querySnapshot = await getDocs(q);
// querySnapshot.forEach((doc) => {
//   // doc.data() is never undefined for query doc snapshots
//   console.log(doc.id, " => ", doc.data());
// });