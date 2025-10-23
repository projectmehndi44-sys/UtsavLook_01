

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword, isSignInWithEmailLink as isFbSignInWithEmailLink, signInWithEmailLink as fbSignInWithEmailLink } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  "projectId": "studio-163529036-f9a8c",
  "appId": "1:240526745218:web:bf45387565e48cb9cf9e9b",
  "storageBucket": "studio-163529036-f9a8c.firebasestorage.app",
  "apiKey": "AIzaSyD8DvhHJ3nzHmBXRFNDVzxgWcb7Nx5qkrY",
  "authDomain": "studio-163529036-f9a8c.firebaseapp.com",
  "messagingSenderId": "240526745218"
};


// --- Singleton Pattern for Firebase App Initialization ---
let app: FirebaseApp;
const getFirebaseApp = (): FirebaseApp => {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    return app;
}

// Initialize on first call
getFirebaseApp();

const auth = getAuth(getFirebaseApp());
const googleProvider = new GoogleAuthProvider();

// --- Firestore Initialization with Offline Persistence ---
let dbInstance: Firestore | null = null;
let dbInitializationPromise: Promise<Firestore> | null = null;

const initializeDb = (): Promise<Firestore> => {
    if (dbInitializationPromise) {
        return dbInitializationPromise;
    }
    
    dbInitializationPromise = new Promise(async (resolve, reject) => {
        try {
            const db = getFirestore(getFirebaseApp());
            if (typeof window !== 'undefined') {
                await enableIndexedDbPersistence(db).catch((err: any) => {
                    console.warn("Firebase Persistence Error:", err.code);
                });
            }
            dbInstance = db;
            resolve(dbInstance);
        } catch (error) {
            console.error("Firestore initialization failed", error);
            dbInitializationPromise = null;
            reject(error);
        }
    });

    return dbInitializationPromise;
};

export const getDb = async (): Promise<Firestore> => {
    if (dbInstance) {
        return dbInstance;
    }
    return initializeDb();
}

const sendOtp = (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    const fullPhoneNumber = `+91${phoneNumber}`;
    return signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
}

const signOutUser = () => {
    return signOut(auth);
}

const isSignInWithEmailLink = (auth: any, link: any) => isFbSignInWithEmailLink(auth, link);
const signInWithEmailLink = (auth: any, email: any, link: any) => fbSignInWithEmailLink(auth, email, link);

// --- Firebase Functions ---
const functions = getFunctions(getFirebaseApp());
export const callFirebaseFunction = (functionName: string, data: any) => {
    const callable = httpsCallable(functions, functionName);
    return callable(data);
};


export { app, auth, sendOtp, signOutUser, getFirebaseApp, getFirestore, isSignInWithEmailLink, signInWithEmailLink };
declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
        grecaptcha?: any;
    }
}
