import {initializeApp} from 'firebase/app';
import { getFirestore, doc, collection, getDocs ,setDoc, query, where} from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from "./.config";
import { create_user } from './create_user';
import { getInfo } from './get_data';

async function testUsers(){
    const usersRef = collection(FIREBASE_DB, "users");
    const users = [
        {
          email: "ronnie@gmail.com",
          password: "123456",
          name: "Ronnie Bonnie",
          phone: "1234567890",
          emg_name: "Mum",
          emg_phone: "0987654321"
        },
        {
          email: "jane.doe@example.com",
          password: "password123",
          name: "Jane Doe",
          phone: "9876543210",
          emg_name: "Dad",
          emg_phone: "1122334455"
        },
        {
          email: "alice@example.com",
          password: "alicePassword",
          name: "Alice Johnson",
          phone: "1112223333",
          emg_name: "Brother",
          emg_phone: "3213214321"
        },
        {
          email: "bob@example.com",
          password: "bobPassword123",
          name: "Bob Smith",
          phone: "4445556666",
          emg_name: "Sister",
          emg_phone: "9879876543"
        },
        {
          email: "charlie@example.com",
          password: "charlie123",
          name: "Charlie Brown",
          phone: "7778889999",
          emg_name: "Wife",
          emg_phone: "1234567890"
        }
      ];
      for (let user = 0; user < users.length; user++){
        console.log(users[user]["name"], " created");
        await create_user(users[user])
        console.log("---------------")
      }
}     
// testUsers()

getInfo()