
'use client';

import * as React from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getTeamMembers } from '@/lib/services';
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
    const auth = getAuth(app);
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
            if (firebaseUser) {
                try {
                    const teamMembers = await getTeamMembers();
                    // Find the user profile in the database by their unique Firebase UID.
                    const memberProfile = teamMembers.find(m => m.id === firebaseUser.uid);
                    
                    if (memberProfile) {
                        // If found, they are a valid admin.
                        setUser(memberProfile);
                    } else {
                        // If not found, they are not an authorized admin. Log them out.
                        await auth.signOut();
                        setUser(null);
                        if (pathname !== '/admin/login') {
                            router.push('/admin/login');
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch team members:", error);
                    await auth.signOut();
                    setUser(null);
                }
            } else {
                // No Firebase user is logged in.
                setUser(null);
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
