// All Firestore interactions should be managed through a central Repository class.

// artists collection:
export interface Artist {
    id: string;
    name: string;
    email: string;
    phone: string;
    profilePicture: string; // URL to image in Firebase Storage
    workImages: string[]; // URLs
    services: string[]; // e.g., "mehndi", "makeup"
    serviceOfferings: ArtistServiceOffering[];
    location: string; // City, State
    charges: Map<string, number>;
    rating: number;
    styleTags: string[];
    unavailableDates: string[]; // ISO date strings
    reviews: Review[];
    state?: string;
    district?: string;
    locality?: string;
    servingAreas?: string;
}

export interface ArtistServiceOffering {
    servicePackageId: string;
    tierName: string; // e.g., "Normal", "Premium"
    price: number;
}

export interface Review {
    customerId: string;
    customerName: string;
    rating: number;
    comment: string;
    date: Date;
}


// customers collection:
export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
}


// bookings collection:
export interface Booking {
    id: string;
    artistIds: string[];
    customerId: string;
    customerName: string;
    serviceAddress: string;
    serviceDates: Date[];
    amount: number;
    status: "Pending" | "Confirmed" | "Completed" | "Cancelled" | "Disputed";
    eventType: string;
    eventDate: Date;
    completionCode: string;
    items: CartItem[];
}


// config collection (for master data):
export interface MasterServicePackage {
    id: string;
    name: string;
    service: "Mehndi" | "Makeup" | "Photography";
    description: string;
    image: string;
    tags: string[];
    categories: PackageCategory[];
}

export interface PackageCategory {
    name: "Normal" | "Premium" | "ULTRA PREMIUM";
    description: string;
    basePrice: number;
    image: string;
}

// Cart Item
export interface CartItem {
    id: string;
    servicePackage: MasterServicePackage;
    selectedTier: PackageCategory;
    artist?: Artist; // Undefined for Express Booking
    price: number;
}
