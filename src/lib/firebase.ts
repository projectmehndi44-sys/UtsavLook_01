

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, signOut, isSignInWithEmailLink as isFbSignInWithEmailLink, signInWithEmailLink as fbSignInWithEmailLink } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "studio-163529036-f9a8c",
  "appId": "1:240526745218:web:bf45387565e48cb9cf9e9b",
  "storageBucket": "studio-163529036-f9a8c.appspot.com",
  "apiKey": "AIzaSyD8DvhHJ3nzHmBXRFNDVzxgWcb7Nx5qkrY",
  "authDomain": "studio-163529036-f9a8c.firebaseapp.com",
  "messagingSenderId": "240526745218"
};


// --- Singleton Pattern for Firebase App Initialization ---
export const getFirebaseApp = (): FirebaseApp => {
    if (getApps().length === 0) {
        // In a Vercel production environment, dynamically set the authDomain
        if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_VERCEL_URL) {
            firebaseConfig.authDomain = process.env.NEXT_PUBLIC_VERCEL_URL;
        }
        return initializeApp(firebaseConfig);
    } else {
        return getApp();
    }
}

const app = getFirebaseApp();
const auth = getAuth(app);

// Initialize Firestore with offline persistence enabled.
// This is the SINGLE source of truth for the Firestore instance.
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});


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

export { app, auth, db, sendOtp, signOutUser, getStorage, isSignInWithEmailLink, signInWithEmailLink };

// This is required for the window.confirmationResult to be accessible
declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
        grecaptcha?: any;
    }
}
