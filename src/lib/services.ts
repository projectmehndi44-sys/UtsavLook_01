

import { getDb } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp, onSnapshot, Unsubscribe, runTransaction } from 'firebase/firestore';
import type { Artist, Booking, Customer, MasterServicePackage, PayoutHistory, TeamMember, Notification, Promotion, ImagePlaceholder, BenefitImage } from '@/lib/types';
import { initialTeamMembers } from './team-data';


// Generic function to get a single document
async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    const db = await getDb();
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as T;
}


// Generic function to get a config document
async function getConfigDocument<T>(docId: string): Promise<T | null> {
    const db = await getDb();
    const docRef = doc(db, 'config', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.hasOwnProperty('packages')) return data.packages as T;
        if (data && data.hasOwnProperty('members')) return data.members as T;
        if (data && data.hasOwnProperty('promos')) return data.promos as T;
        if (data && data.hasOwnProperty('locations')) return data.locations as T;
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
    if(docId === 'teamMembers') dataToSet = { members: data };
    else if (docId === 'masterServices') dataToSet = { packages: data };
    else if (docId === 'promotions') dataToSet = { promos: data };
    else if (docId === 'availableLocations') dataToSet = data; // Locations are now stored at the root of the doc
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
        }, (error) => {
            console.error(`Error listening to ${collectionName}: `, error);
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
    await setDoc(docRef, dataToSave);
};


export const updateArtist = async (id: string, data: Partial<Artist>): Promise<void> => {
    const db = await getDb();
    const artistRef = doc(db, "artists", id);
    await updateDoc(artistRef, data);
};
export const deleteArtist = async (id: string): Promise<void> => {
    const db = await getDb();
    // This should ideally be a cloud function for security to delete the auth user as well.
    // For now, we will just delete the Firestore document.
    const artistRef = doc(db, "artists", id);
    await deleteDoc(artistRef);
}


// Bookings
export const createBooking = async (data: Omit<Booking, 'id'>): Promise<string> => {
    const db = await getDb();
    const bookingsCollection = collection(db, "bookings");
    const docRef = await addDoc(bookingsCollection, data);
    // Also update the ID in the doc
    await updateDoc(docRef, {id: docRef.id});
    return docRef.id;
};
export const updateBooking = async (id: string, data: Partial<Booking>): Promise<void> => {
    const db = await getDb();
    const bookingRef = doc(db, "bookings", id);
    await updateDoc(bookingRef, data);
};

// Customers
export const getCustomer = async (id: string): Promise<Customer | null> => getDocument<Customer>('customers', id);
export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    const db = await getDb();
    const q = query(collection(db, "customers"), where("phone", "==", phone));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
}
export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
    const db = await getDb();
    const q = query(collection(db, "customers"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
};
export const createCustomer = async (data: Omit<Customer, 'id'> & {id: string}): Promise<string> => {
    const db = await getDb();
    const customerId = data.id; // Use UID from Google or phone auth
    const customerRef = doc(db, "customers", customerId);
    const { id, ...dataToSave } = data;
    await setDoc(customerRef, { ...dataToSave, status: 'Active', createdOn: Timestamp.now() }, { merge: true });
    return customerId;
};

export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<void> => {
    const db = await getDb();
    const customerRef = doc(db, "customers", id);
    await updateDoc(customerRef, data);
};

export const deleteCustomer = async (id: string): Promise<void> => {
    const db = await getDb();
    // This should ideally be a cloud function for security to delete the auth user as well.
    // For now, we will just delete the Firestore document.
    const customerRef = doc(db, "customers", id);
    await deleteDoc(customerRef);
};


// Config
export const getPlaceholderImages = async (): Promise<ImagePlaceholder[]> => {
    const config = await getConfigDocument<any>('placeholderImages');
    return (config as any)?.images || [];
};
export const savePlaceholderImages = (images: ImagePlaceholder[]) => setConfigDocument('placeholderImages', images);


export const getBenefitImages = async (): Promise<BenefitImage[]> => {
    const config = await getConfigDocument<{ benefitImages: BenefitImage[] }>('benefitImages');
    if (config && config.benefitImages) {
        return config.benefitImages;
    }
    // Return a default structure if it doesn't exist
    const defaultBenefits: BenefitImage[] = [
        { id: 'Set Your Own Price', title: "Set Your Own Price", description: "You know the value of your art. On UtsavLook, you're in control. Set your own prices for each service tier, no unfair fixed rates. Your talent, your price.", imageUrl: 'https://picsum.photos/seed/artist-price/800/600' },
        { id: "'UtsavLook Verified' Badge", title: "'UtsavLook Verified' Badge", description: "Don't get lost in the crowd. Our 'UtsavLook Verified' badge shows customers you're a trusted professional, leading to more high-quality bookings and better clients.", imageUrl: 'https://picsum.photos/seed/artist-verified/800/600' },
        { id: 'Intelligent Scheduling', title: "Intelligent Scheduling", description: "Stop the back-and-forth phone calls. Our smart calendar lets you mark unavailable dates, so you only get booking requests for when you're actually free.", imageUrl: 'https://picsum.photos/seed/artist-schedule/800/600' },
        { id: 'Your Own Referral Code', title: "Your Own Referral Code", description: "Turn your happy clients into your sales team. We provide a unique referral code. When a new customer uses it, they get a discount, and you get another confirmed booking.", imageUrl: 'https://picsum.photos/seed/artist-referral/800/600' },
        { id: 'Transparent Payouts', title: "Transparent Payouts", description: "Get a professional dashboard to track all your bookings, earnings, and reviews in one place. With our clear and timely payouts, the accounting is always clean and simple.", imageUrl: 'https://picsum.photos/seed/artist-payout/800/600' },
        { id: '0% Commission Welcome', title: "0% Commission Welcome", description: "We're invested in your success from day one. To welcome you, we take zero commission on your first 5 bookings through the platform. It's all yours.", imageUrl: 'https://picsum.photos/seed/artist-welcome/800/600' },
    ];
    // Optionally save the default structure to Firestore
    await saveBenefitImages(defaultBenefits);
    return defaultBenefits;
};
export const saveBenefitImages = (images: BenefitImage[]) => setConfigDocument('benefitImages', { benefitImages: images });

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
    const docRef = doc(db, 'config', 'teamMembers');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data()?.members?.length > 0) {
        const data = docSnap.data();
        return (data.members || []) as TeamMember[];
    }
    // If the document doesn't exist or has no members, seed it with initial data.
    await setConfigDocument('teamMembers', initialTeamMembers);
    return initialTeamMembers;
};
export const saveTeamMembers = (members: TeamMember[]) => setConfigDocument('teamMembers', members);


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
