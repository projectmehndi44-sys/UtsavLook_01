

import { getDb } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp, onSnapshot, Unsubscribe, runTransaction } from 'firebase/firestore';
import type { Artist, Booking, Customer, MasterServicePackage, PayoutHistory, TeamMember, Notification, Promotion, ImagePlaceholder, BenefitImage } from '@/lib/types';
import { initialTeamMembers } from './team-data';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirebaseApp } from './firebase';
import { compressImage } from './utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

// New function to upload images to Firebase Storage
export const uploadSiteImage = async (file: File, path: string, compress: boolean = true): Promise<string> => {
    const app = getFirebaseApp();
    const storage = getStorage(app);

    // Conditionally compress the image before uploading
    const fileToUpload = compress ? await compressImage(file) : file;
    
    // Use a unique name to prevent overwrites
    const fileName = `${Date.now()}-${fileToUpload.name.replace(/\s+/g, '-')}`;
    const storageRef = ref(storage, `${path}/${fileName}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, fileToUpload);
    
    // Get the permanent download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
};

// New function to delete images from Firebase Storage
export const deleteSiteImage = async (imageUrl: string): Promise<void> => {
    if (!imageUrl.includes('firebasestorage.googleapis.com')) {
        // Don't try to delete non-firebase images (like picsum)
        console.log("Skipping deletion for non-Firebase image.");
        return;
    }
    const app = getFirebaseApp();
    const storage = getStorage(app);
    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error: any) {
        // It's okay if the file doesn't exist.
        if (error.code === 'storage/object-not-found') {
            console.warn(`Image not found in storage, but proceeding with DB removal: ${imageUrl}`);
        } else {
            // For other errors, we should probably throw
            throw error;
        }
    }
}


// Generic function to get a single document
export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    const db = await getDb();
    const docRef = doc(db, collectionName, id);
    
    try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        return null;
    }
}


// Generic function to get a config document
async function getConfigDocument<T>(docId: string): Promise<T | null> {
    const db = await getDb();
    const docRef = doc(db, 'config', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.hasOwnProperty('packages')) return data.packages as T;
        if (data && data.hasOwnProperty('promos')) return data.promos as T;
        if (data && data.hasOwnProperty('locations')) return data as T; // Locations stored at root
        if (data && data.hasOwnProperty('images')) return data.images as T;
        if (data && data.hasOwnProperty('benefitImages')) return data.benefitImages as T;
        return data as T; // Fallback for flat config docs
    }
    return null;
}

// Generic function to set a config document
async function setConfigDocument(docId: string, data: any): Promise<void> {
    const db = await getDb();
    const docRef = doc(db, 'config', docId);
    
    let dataToSet = data;
    if (docId === 'masterServices') dataToSet = { packages: data };
    else if (docId === 'promotions') dataToSet = { promos: data };
    else if (docId === 'availableLocations') dataToSet = data; // Locations are stored at the root of the doc
    else if (docId === 'placeholderImages') dataToSet = { images: data };
    else if (docId === 'benefitImages') dataToSet = { benefitImages: data };
    
    await setDoc(docRef, dataToSet);
}


// --- Listener Functions for Real-Time Data ---

export const listenToCollection = <T>(collectionName: string, callback: (data: T[]) => void, q?: any): Unsubscribe => {
    let unsub: Unsubscribe = () => {};
    getDb().then(db => {
        const queryToUse = q || query(collection(db, collectionName));
        unsub = onSnapshot(queryToUse, (querySnapshot) => {
            const data: T[] = querySnapshot.docs.map(doc => {
                const docData = doc.data();
                // Convert Firestore Timestamps to JS Dates
                Object.keys(docData).forEach(key => {
                    if (docData[key] instanceof Timestamp) {
                        docData[key] = (docData[key] as Timestamp).toDate();
                    } else if (Array.isArray(docData[key])) {
                        docData[key] = docData[key].map(item => item instanceof Timestamp ? item.toDate() : item);
                    }
                });
                return { id: doc.id, ...docData } as T;
            });
            callback(data);
        }, (serverError) => {
             const permissionError = new FirestorePermissionError({
                path: q ? `query on ${collectionName}` : collectionName,
                operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            console.error(`Error listening to ${collectionName}: `, serverError);
        });
    }).catch(error => {
        console.error("Failed to get DB for listener:", error);
    });
    return () => unsub();
};


// --- Specific Functions ---

// Artists
export const getArtist = async (id: string): Promise<Artist | null> => {
    const artist = await getDocument<Artist>('artists', id);
    if (!artist) return null;
    
    // Convert Timestamps to JS Dates for client-side consistency
    const data = artist as any;
     Object.keys(data).forEach(key => {
        if (data[key] instanceof Timestamp) {
            data[key] = (data[key] as Timestamp).toDate();
        } else if (Array.isArray(data[key])) {
            data[key] = data[key].map(item => item instanceof Timestamp ? item.toDate() : item);
        }
    });

    // Ensure charges is an object, even if it's empty.
    data.charges = data.charges || {};

    return data as Artist;
};
export const getArtistByEmail = async (email: string): Promise<Artist | null> => {
    const db = await getDb();
    const q = query(collection(db, 'artists'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    const data = doc.data();
     // Convert Firestore Timestamps to JS Dates
    Object.keys(data).forEach(key => {
        if (data[key] instanceof Timestamp) {
            data[key] = (data[key] as Timestamp).toDate();
        } else if (Array.isArray(data[key])) {
            data[key] = data[key].map(item => item instanceof Timestamp ? item.toDate() : item);
        }
    });
    return { id: doc.id, ...data } as Artist;
};

// Creates only the Firestore document. Auth user is created separately.
export const createArtistWithId = async (data: Omit<Artist, 'id'> & {id: string}): Promise<void> => {
    const db = await getDb();
    const docRef = doc(db, "artists", data.id);
    const { id, ...dataToSave } = data; // Exclude id from the data being saved
    setDoc(docRef, dataToSave).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
};


export const updateArtist = async (id: string, data: Partial<Artist>): Promise<void> => {
    const db = await getDb();
    const artistRef = doc(db, "artists", id);
    updateDoc(artistRef, data).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: artistRef.path,
            operation: 'update',
            requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
};
export const deleteArtist = async (id: string): Promise<void> => {
    const db = await getDb();
    // This should ideally be a cloud function for security to delete the auth user as well.
    // For now, we will just delete the Firestore document.
    const artistRef = doc(db, "artists", id);
     deleteDoc(artistRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: artistRef.path,
            operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
};


// Bookings
export const createBooking = async (data: Omit<Booking, 'id'>) => {
    const db = await getDb();
    const bookingsCollection = collection(db, 'bookings');
    
    // This is the correct pattern. The addDoc function returns a promise.
    // We don't await it here; instead, we chain a .catch() to handle potential errors.
    addDoc(bookingsCollection, data)
        .then(async (docRef) => {
            // If the write is successful, update the document with its own ID.
            updateDoc(docRef, { id: docRef.id });
        })
        .catch((serverError) => {
            // This block specifically handles errors from the Firestore server, like permission denied.
            const permissionError = new FirestorePermissionError({
                path: bookingsCollection.path, // Use collection path for a create operation
                operation: 'create',
                requestResourceData: data, // Include the data that failed to be written
            } satisfies SecurityRuleContext);

            // Emit the rich, contextual error through the central emitter.
            errorEmitter.emit('permission-error', permissionError);
        });
};


export const updateBooking = async (id: string, data: Partial<Booking>): Promise<void> => {
    const db = await getDb();
    const bookingRef = doc(db, "bookings", id);
    updateDoc(bookingRef, data).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: bookingRef.path,
            operation: 'update',
            requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
};

// Customers
export const getCustomer = async (id: string): Promise<Customer | null> => getDocument<Customer>('customers', id);
export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    const db = await getDb();
    const q = query(collection(db, "customers"), where("phone", "==", phone));
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Customer;
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: `customers collection query`,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        return null;
    }
}
export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
    const db = await getDb();
    const q = query(collection(db, "customers"), where("email", "==", email));
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Customer;
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: `customers collection query`,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        return null;
    }
};
export const createCustomer = (data: Omit<Customer, 'id'> & {id: string}): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const db = await getDb();
        const customerId = data.id; // Use UID from Google or phone auth
        const customerRef = doc(db, "customers", customerId);
        const { id, ...dataToSave } = data;
        const finalData = { ...dataToSave, status: 'Active', createdOn: Timestamp.now() };

        setDoc(customerRef, finalData, { merge: true })
            .then(() => resolve(customerId))
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: customerRef.path,
                    operation: 'create',
                    requestResourceData: finalData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                reject(permissionError); // Reject the promise so the calling function knows it failed
            });
    });
};


export const updateCustomer = (id: string, data: Partial<Customer>): Promise<void> => {
     return new Promise(async (resolve, reject) => {
        const db = await getDb();
        const customerRef = doc(db, "customers", id);
        
        updateDoc(customerRef, data)
            .then(() => resolve())
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: customerRef.path,
                    operation: 'update',
                    requestResourceData: data,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                reject(permissionError);
            });
    });
};

export const deleteCustomer = async (id: string): Promise<void> => {
    const db = await getDb();
    const customerRef = doc(db, "customers", id);
    deleteDoc(customerRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: customerRef.path,
            operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
};


// Config
export const getPlaceholderImages = async (): Promise<ImagePlaceholder[]> => {
    const config = await getConfigDocument<{ images: ImagePlaceholder[] }>('placeholderImages');
    return config?.images || [];
};
export const savePlaceholderImages = (images: ImagePlaceholder[]) => setConfigDocument('placeholderImages', images);


export const getBenefitImages = async (): Promise<BenefitImage[]> => {
    const config = await getConfigDocument<{ benefitImages: BenefitImage[] }>('benefitImages');
    
    if (config && Array.isArray(config.benefitImages) && config.benefitImages.length > 0) {
        return config.benefitImages;
    }
    
    // If not, create and save the default set, then return it.
    const defaultBenefits: BenefitImage[] = [
        { id: 'set-your-own-price', title: "Set Your Own Price", description: "You know the value of your art. On UtsavLook, you're in control. Set your own prices for each service tier, no unfair fixed rates. Your talent, your price.", imageUrl: 'https://picsum.photos/seed/artist-price/800/600' },
        { id: 'verified-badge', title: "'UtsavLook Verified' Badge", description: "Don't get lost in the crowd. Our 'UtsavLook Verified' badge shows customers you're a trusted professional, leading to more high-quality bookings and better clients.", imageUrl: 'https://picsum.photos/seed/artist-verified/800/600' },
        { id: 'intelligent-scheduling', title: "Intelligent Scheduling", description: "Stop the back-and-forth phone calls. Our smart calendar lets you mark unavailable dates, so you only get booking requests for when you're actually free.", imageUrl: 'https://picsum.photos/seed/artist-schedule/800/600' },
        { id: 'referral-code', title: "Your Own Referral Code", description: "Turn your happy clients into your sales team. We provide a unique referral code. When a new customer uses it, they get a discount, and you get another confirmed booking.", imageUrl: 'https://picsum.photos/seed/artist-referral/800/600' },
        { id: 'transparent-payouts', title: "Transparent Payouts", description: "Get a professional dashboard to track all your bookings, earnings, and reviews in one place. With our clear and timely payouts, the accounting is always clean and simple.", imageUrl: 'https://picsum.photos/seed/artist-payout/800/600' },
        { id: 'zero-commission-welcome', title: "0% Commission Welcome", description: "We're invested in your success from day one. To welcome you, we take zero commission on your first 5 bookings through the platform. It's all yours.", imageUrl: 'https://picsum.photos/seed/artist-welcome/800/600' },
    ];
    await saveBenefitImages(defaultBenefits);
    return defaultBenefits;
};
export const saveBenefitImages = (images: BenefitImage[]) => setConfigDocument('benefitImages', images );

export const getPromotionalImage = async (): Promise<{ imageUrl: string } | null> => {
    return getConfigDocument<{ imageUrl: string }>('promotionalImage');
};

export const savePromotionalImage = async (data: { imageUrl: string }): Promise<void> => {
    return setConfigDocument('promotionalImage', data);
};

export const getAvailableLocations = async (): Promise<Record<string, string[]>> => {
    const config = await getConfigDocument<Record<string, string[]>>('availableLocations');
    return config || {};
};
export const saveAvailableLocations = async (locations: Record<string, string[]>): Promise<void> => {
    await setConfigDocument('availableLocations', locations);
};

export const getCompanyProfile = async () => {
    return await getConfigDocument<any>('companyProfile') || {
        companyName: 'UtsavLook',
        ownerName: 'Abhishek Jaiswal',
        address: '123 Glamour Lane, Mumbai, MH, 400001',
        phone: '+91 98765 43210',
        email: 'contact@utsavlook.com',
        gstin: '27ABCDE1234F1Z5',
        website: 'https://www.utsavlook.com',
    };
};
export const saveCompanyProfile = (data: any) => setConfigDocument('companyProfile', data);

export const getFinancialSettings = async () => {
    return await getConfigDocument<any>('financialSettings') || {
        platformFeePercentage: 10,
        platformRefundFee: 500,
    };
};
export const saveFinancialSettings = (data: any) => setConfigDocument('financialSettings', data);

export const getTeamMembers = async (): Promise<TeamMember[]> => {
    const db = await getDb();
    // This now reads from the top-level 'teamMembers' collection
    const querySnapshot = await getDocs(collection(db, 'teamMembers'));
    if (querySnapshot.empty) {
        // If the collection doesn't exist or is empty, seed it with initial data.
        await runTransaction(db, async (transaction) => {
            initialTeamMembers.forEach(member => {
                const docRef = doc(db, "teamMembers", member.id); // Uses the temporary ID from team-data
                transaction.set(docRef, member);
            });
        });
        return initialTeamMembers;
    }
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TeamMember);
};
export const saveTeamMembers = (members: TeamMember[]) => {
    // This function is now deprecated in favor of addOrUpdateTeamMember for better security.
};
export const addOrUpdateTeamMember = async (member: TeamMember) => {
    const db = await getDb();
    const memberRef = doc(db, "teamMembers", member.id);
    await setDoc(memberRef, member, { merge: true });
}
export const deleteTeamMember = async (id: string) => {
    const db = await getDb();
    const memberRef = doc(db, "teamMembers", id);
    await deleteDoc(memberRef);
}


export const getPromotions = async (): Promise<Promotion[]> => {
    const promos = await getConfigDocument<any>('promotions');
    return promos?.promos || [];
};
export const savePromotions = (promos: Promotion[]) => setConfigDocument('promotions', promos);


// Pending Artists
export const createPendingArtist = async (data: any): Promise<string> => {
    const db = await getDb();
    const pendingArtistsCollection = collection(db, "pendingArtists");
    const docRef = await addDoc(pendingArtistsCollection, data);
    return docRef.id;
};
export const deletePendingArtist = async (id: string): Promise<void> => {
    const db = await getDb();
    const artistRef = doc(db, "pendingArtists", id);
    await deleteDoc(artistRef);
};

// Notifications
export const createNotification = async (data: Omit<Notification, 'id'>): Promise<string> => {
    const db = await getDb();
    const notificationsCollection = collection(db, "notifications");
    const docRef = await addDoc(notificationsCollection, data);
    return docRef.id;
};

// To be DEPRECATED. Use listeners instead for performance.
async function getCollection<T>(collectionName: string): Promise<T[]> {
  const db = await getDb();
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => {
       const data = doc.data();
        // Convert Timestamps
        Object.keys(data).forEach(key => {
            if (data[key] instanceof Timestamp) {
                data[key] = (data[key] as Timestamp).toDate();
            } else if (Array.isArray(data[key])) {
                data[key] = data[key].map(item => item instanceof Timestamp ? item.toDate() : item);
            }
        });
        return { id: doc.id, ...data } as T;
  });
}

// DEPRECATED - use listeners instead.
export const getArtists = async (): Promise<Artist[]> => {
    const artists = await getCollection<Artist>('artists');
    return artists.map(artist => ({
        ...artist,
        charges: artist.charges || {}, // Ensure charges object exists
    }));
};
// DEPRECATED - use listeners instead.
export const getBookings = async (): Promise<Booking[]> => getCollection<Booking>('bookings');


export const getMasterServices = async (): Promise<MasterServicePackage[]> => {
    const config = await getConfigDocument<any>('masterServices');
    return config || [];
};

export { getDb };

    