'use server';
import type { Customer } from './types';

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
