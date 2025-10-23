'use client';

import { getFirebaseApp } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { FirebaseProvider } from './provider';

// This provider ensures that Firebase is initialized only on the client side.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize Firebase on the client
  const app = getFirebaseApp();
  const auth = getAuth(app);
  // This is the correct way to initialize Firestore with persistence on the client
  const firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });

  return (
    <FirebaseProvider value={{ app, auth, firestore }}>
      {children}
    </FirebaseProvider>
  );
}
