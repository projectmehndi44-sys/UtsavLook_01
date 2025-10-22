

'use client';

import * as React from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';
import { getDocument } from '@/lib/services';
import type { TeamMember, Permissions } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';

interface AdminAuthContextType {
    user: TeamMember | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasPermission: (module: keyof Permissions, level: 'edit' | 'view') => boolean;
}

const AdminAuthContext = React.createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<TeamMember | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const auth = getAuth(getFirebaseApp());
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
            // Bypass auth logic on the login page itself to allow setup/login
            if (pathname === '/admin/login') {
                setIsLoading(false);
                return;
            }

            if (firebaseUser) {
                try {
                    // This now fetches the specific team member document by UID.
                    const memberProfile = await getDocument<TeamMember>('teamMembers', firebaseUser.uid); 
                    
                    if (memberProfile) {
                        setUser(memberProfile);
                    } else {
                        // If a Firebase user exists but has no profile in teamMembers, they are not an admin.
                        await auth.signOut();
                        setUser(null);
                        router.push('/admin/login');
                    }
                } catch (error) {
                    console.error("Failed to fetch team member profile:", error);
                    await auth.signOut();
                    setUser(null);
                    router.push('/admin/login');
                }
            } else {
                setUser(null);
                 router.push('/admin/login');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [auth, router, pathname]);

    const hasPermission = (module: keyof Permissions, level: 'edit' | 'view'): boolean => {
        if (!user) return false;
        if (user.role === 'Super Admin') return true;
        
        const userPermission = user.permissions[module];
        if (level === 'view') {
            return userPermission === 'view' || userPermission === 'edit';
        }
        if (level === 'edit') {
            return userPermission === 'edit';
        }
        return false;
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        hasPermission,
    };

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = React.useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};
