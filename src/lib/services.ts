import type { Customer, RawArtistRecommendation } from './types';

// This is a placeholder file. In a real application, you would implement database interactions.
// NOTE: This placeholder does not interact with a real database.

export const getAvailableLocations = async (): Promise<Record<string, string[]>> => {
    console.log("Placeholder: getAvailableLocations called");
    // Returning mock data for demonstration purposes
    return {
        'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
        'Karnataka': ['Bangalore', 'Mysore'],
        'Delhi': ['New Delhi'],
    };
}

export const createPendingArtist = async (artistData: any) => {
    console.log("Placeholder: createPendingArtist called with:", artistData);
    // In a real implementation, this would save the data to Firestore.
    return 'pending-artist-id-123';
}

export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    console.log(`Placeholder: getCustomerByPhone called for ${phone}`);
    if (phone === '1234567890') {
        return { id: 'cust-existing', name: 'Existing User', phone: '1234567890' };
    }
    return null;
}

export const createCustomer = async (customerData: Omit<Customer, 'id'> & {id: string}): Promise<string> => {
    console.log("Placeholder: createCustomer called with:", customerData);
    return customerData.id; // Return the UID provided
}

export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
    console.log(`Placeholder: getCustomerByEmail called for ${email}`);
    if (email === 'existing-user@example.com') {
        return { id: 'cust-existing-email', name: 'Existing Email User', phone: '0987654321', email };
    }
    return null;
}

export const getCustomer = async (id: string): Promise<Customer | null> => {
    console.log(`Placeholder: getCustomer called for ${id}`);
    if (id === 'cust-existing' || id === 'test-google-uid' || id.startsWith('firebase-uid-for-')) {
        return { id: id, name: 'Test Customer', phone: '1234567890', email: 'test@example.com' };
    }
    return null;
}


export const fetchRecommendations = async (input: any): Promise<RawArtistRecommendation[]> => {
    console.log("Placeholder: fetchRecommendations called with:", input);
    // In a real app, you would call a Genkit flow here.
    return [];
}

export const listenToCollection = <T>(collectionName: string, callback: (data: T[]) => void): (() => void) => {
    console.log(`Placeholder: listenToCollection called for ${collectionName}`);
    // In a real app, this would set up a Firestore listener.
    // For now, we'll return an empty array and a no-op unsubscribe function.
    if (collectionName === 'artists') {
        // returning empty array
    } else if (collectionName === 'masterServices') {
        // returning empty array
    }
    callback([]);
    return () => console.log(`Placeholder: Unsubscribed from ${collectionName}`);
}