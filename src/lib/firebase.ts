
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  "projectId": "studio-163529036-f9a8c",
  "appId": "1:240526745218:web:807f89ba03731495cf9e9b",
  "storageBucket": "studio-163529036-f9a8c.appspot.com",
  "apiKey": "AIzaSyBLauxXUk2zR5VBRrl2_9PBpDJLMB9gGOI",
  "authDomain": "studio-163529036-f9a8c.firebaseapp.com",
  "messagingSenderId": "240526745218"
};

// --- Singleton Pattern for Firebase App Initialization ---
let app: FirebaseApp;
const getFirebaseApp = (): FirebaseApp => {
    if (getApps().length === 0) {
        // Dynamically set authDomain for client-side environments
        if (typeof window !== 'undefined') {
            firebaseConfig.authDomain = window.location.hostname;
        }
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

export { app, auth, sendOtp, signOutUser, getFirebaseApp };
declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
        grecaptcha?: any;
    }
}
