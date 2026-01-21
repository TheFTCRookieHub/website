// Firebase Configuration for The FTC Rookie Hub
// These values are now active and the forum is live!

const firebaseConfig = {
    apiKey: "AIzaSyC9E55uE9D4-c2ljKbHhMudGSHcxk3iemw",
    authDomain: "ftc-rookie-hub.firebaseapp.com",
    projectId: "ftc-rookie-hub",
    storageBucket: "ftc-rookie-hub.firebasestorage.app",
    messagingSenderId: "1069455756758",
    appId: "1:1069455756758:web:3d8e919ee44ba9d5a4a877",
    measurementId: "G-PVEGX8WMQP"
};

// Initialize Firebase
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
    console.log("Firebase initialized successfully");
} else {
    console.warn("Firebase configuration is missing. Real-time forum posts will not work.");
    console.info("To enable real-time sync, update firebase-config.js with your credentials.");
}
