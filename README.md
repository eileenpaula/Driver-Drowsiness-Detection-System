# Driver-Drowsiness-Detection-System

## Mobile App Design
This project implements an intuitive interface for users to interact with the Driver
Drowsiness Detection System.
Built with **React Native** and **Firebase**, the app allows users to create
accounts, securely log in, and eventually receive real-time alerts based on ML
predictions.
## Tech Stack
- **React Native** with Expo
- **Firebase Authentication** for user sign-in and sign-up
- **Firebase Firestore** for storing user profiles
- **TensorFlow.js** (integration in progress for model prediction)
- **TypeScript** for robust type safety and development
## Features
- **create_user.ts** \
Uses createUserWithEmailAndPassword() to register the user with
Firebase Auth.
Then creates a Firestore document under users/{uid} with profile data.
Ensures all required fields (e.g., phone number) are present and correctly
formatted.
- **login_user.ts** \
Uses signInWithEmailAndPassword() to authenticate user credentials.
Provides a clean separation of login logic from UI.
Logs and throws descriptive errors for use in the UI.
- **error_handling.ts** \
Converts Firebase error codes like auth/email-already-in-use or auth/
invalid-email into user-friendly strings.
Centralizes error messaging so they can be reused across the app.
- **Error Handling**
Clear and user-friendly error messages are displayed for incorrect credentials,
invalid inputs, or Firebase-related issues
- **Firestore Integration**
User information is securely stored in Firebase Firestore, including phone number
and emergency contact details.
- **ML Integration**
The trained multi-task model will be integrated into the app using TensorFlow.js
to allow for real-time drowsiness detection via the device’s camera.
## ML Integration
The backend model is trained using Keras and exported to a TensorFlow.js-
compatible format. It will be integrated into the mobile app to enable on-device
inference and real-time detection of drowsiness, yawning, and eye closure.

## Project Structure (Frontend)
```
/app
├── screens/
│ ├── Login.tsx # User login UI and Firebase authentication logic
│ ├── Signup.tsx # Sign-up screen with Firestore data creation
├── database/
│ ├── create_user.ts # Creates a new user and stores profile data in
Firestore
│ ├── login_user.ts # Authenticates user via Firebase
│ ├── error_handling.ts # Maps Firebase error codes to readable
messages
├── firebaseConfig.ts # Firebase project configuration and initialization
```

## How to Run the App
**1) Install dependencies**
Run the following command to install all necessary packages:
```
npm install
```

**2) Set up Firebase**
Create a project at Firebase Console
Enable Email/Password authentication
Create a Firestore database
Copy your Firebase config into the corresponding firebaseConfig.ts or
an .env file

Example .env: \
EXPO_PUBLIC_IP_ADDR = … \
EXPO_PUBLIC_API_KEY = … \
EXPO_PUBLIC_AUTH_DOMAIN = … \
EXPO_PUBLIC_PROJECT_ID = … \
EXPO_PUBLIC_STROAGE_BUCKET = … \
EXPO_PUBLIC_MESSAGING_SENDER_ID = … \
EXPO_PUBLIC_APP_ID = … \
EXPO_PUBLIC_MEASUREMENT_ID = …

**3) Start the app with Expo**
Launch the development server:
```
npx expo start
```

**4) Run on a device or emulator**
Scan the QR code with the Expo Go app or use an Android/iOS emulator.
