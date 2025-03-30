import { collection, getDocs, query, where } from 'firebase/firestore'
import { FIREBASE_AUTH, FIREBASE_DB } from "./.config";

export async function getInfo(){
    const q = query(collection(FIREBASE_DB, "users"));

    const querySnapshot = await getDocs(collection(FIREBASE_DB, "users"));
    querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    console.log(doc.id, " => ", doc.data());
    });
}

//Future update
// const q = query(collection(db, "cities"), where("capital", "==", true));

// const querySnapshot = await getDocs(q);
// querySnapshot.forEach((doc) => {
//   // doc.data() is never undefined for query doc snapshots
//   console.log(doc.id, " => ", doc.data());
// });