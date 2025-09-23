

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  "projectId": "studio-163529036-f9a8c",
  "appId": "1:240526745218:web:807f89ba03731495cf9e9b",
  "storageBucket": "studio-163529036-f9a8c.firebasestorage.app",
  "apiKey": "AIzaSyBLauxXUk2zR5VBRrl2_9PBpDJLMB9gGOI",
  "authDomain": "studio-163529036-f9a8c.firebaseapp.com",
  "messagingSenderId": "240526745218"
};


// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Firestore Initialization with Offline Persistence (Singleton Pattern) ---
let dbInstance: Firestore | null = null;
let dbInitializationPromise: Promise<Firestore> | null = null;

const initializeDb = (): Promise<Firestore> => {
    // If an initialization promise is already in progress, return it to avoid re-initializing
    if (dbInitializationPromise) {
        return dbInitializationPromise;
    }
    
    // Start a new initialization process
    dbInitializationPromise = new Promise(async (resolve, reject) => {
        try {
            const db = getFirestore(app);

            // Only attempt to enable persistence in the browser
            if (typeof window !== 'undefined') {
                try {
                    await enableIndexedDbPersistence(db);
                    console.log("Firebase Offline Persistence enabled.");
                } catch (err: any) {
                    if (err.code === 'failed-precondition') {
                        // This can happen if multiple tabs are open, which is a normal scenario.
                        console.info("Firestore persistence failed-precondition. Multiple tabs open?");
                    } else if (err.code === 'unimplemented') {
                        // Persistence is not supported in this browser.
                        console.warn("Firestore persistence is not supported in this browser.");
                    } else {
                        console.error("Error enabling Firestore persistence", err);
                    }
                }
            }
            dbInstance = db;
            resolve(dbInstance);
        } catch (error) {
            console.error("Firestore initialization failed", error);
            dbInitializationPromise = null; // Reset promise on failure to allow retry
            reject(error);
        }
    });

    return dbInitializationPromise;
};

// Use this function in your services to get the initialized DB instance
export const getDb = async (): Promise<Firestore> => {
    // If the instance is already available, return it directly.
    if (dbInstance) {
        return dbInstance;
    }
    // Otherwise, wait for the initialization to complete.
    return initializeDb();
}
// ---------------------------------------------------------


const signInWithGoogle = (): Promise<User> => {
  return signInWithPopup(auth, googleProvider).then(result => result.user);
};

export const setupRecaptcha = (container: HTMLElement, readyCallback: () => void): void => {
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
    }
    const verifier = new RecaptchaVerifier(auth, container, {
        'size': 'invisible',
        'callback': (response: any) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            console.log("reCAPTCHA verified");
            readyCallback();
        },
        'expired-callback': () => {
            // Response expired. User needs to solve reCAPTCHA again.
             console.warn("reCAPTCHA expired");
        }
    });
    window.recaptchaVerifier = verifier;
    // Render the reCAPTCHA and call the ready callback
    verifier.render().then(() => {
      readyCallback();
    });
}


const sendOtp = (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    const fullPhoneNumber = `+91${phoneNumber}`; // Assuming Indian phone numbers
    return signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
}

const getFCMToken = async () => {
    const isMessagingSupported = await isSupported();
    if (!isMessagingSupported) {
        console.log("Firebase Messaging is not supported in this browser.");
        return null;
    }
    
    const messaging = getMessaging(app);
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE' });
            return token;
        } else {
            console.log('Unable to get permission to notify.');
            return null;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
        return null;
    }
};

const onForegroundMessage = () => {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
        console.log('Foreground message received. ', payload);
        // You can display a custom toast or notification here
    });
}

const createUser = async (email: string, password: string):Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

const signOutUser = () => {
    return signOut(auth);
}


export { app, auth, signInWithGoogle, getFCMToken, onForegroundMessage, sendOtp, createUser, signOutUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, updatePassword, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink };
declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
        grecaptcha?: any;
    }
}
