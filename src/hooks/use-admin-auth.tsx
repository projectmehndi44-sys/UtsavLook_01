
'use client';

import * as React from 'react';
import { getAuth, onAuthStateChanged, type User, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getTeamMembers, saveTeamMembers, getCustomerByEmail } from '@/lib/services';
import type { TeamMember, Permissions } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { initialTeamMembers } from '@/lib/team-data';


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
        const initializeAdmin = async () => {
            try {
                let teamMembers = await getTeamMembers();
                const superAdmin = teamMembers.find(m => m.role === 'Super Admin');

                if (superAdmin && superAdmin.id === 'user_001') {
                    const defaultAdminEmail = 'utsavlook01@gmail.com';
                    try {
                        const userCredential = await createUserWithEmailAndPassword(auth, defaultAdminEmail, 'Abhi@204567');
                        const uid = userCredential.user.uid;
                        
                        const updatedMembers = teamMembers.map(m => 
                            m.id === 'user_001' ? { ...m, id: uid, username: defaultAdminEmail } : m
                        );
                        await saveTeamMembers(updatedMembers);
                         console.log("Super Admin user created and database record updated.");
                    } catch (error: any) {
                        if (error.code === 'auth/email-already-in-use') {
                            console.log("Super Admin email already exists in Auth. Attempting to sync UID.");
                             // This is tricky without signing in. We will rely on the onAuthStateChanged logic to fix this.
                             // For a more direct fix, you would need to sign in to get the UID.
                        } else {
                            console.error("Error creating superadmin in auth:", error);
                        }
                    }
                }
            } catch (error) {
                console.error("Error during admin initialization:", error);
            }
        };

        initializeAdmin();

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
            if (firebaseUser) {
                try {
                    let teamMembers = await getTeamMembers();
                    let memberProfile = teamMembers.find(m => m.id === firebaseUser.uid || m.username === firebaseUser.email);
                    
                    if (memberProfile) {
                        // Sync UID if it was a placeholder or mismatched
                        if (memberProfile.id !== firebaseUser.uid) {
                            memberProfile.id = firebaseUser.uid;
                            const updatedMembers = teamMembers.map(m => m.username === memberProfile.username ? memberProfile : m);
                            await saveTeamMembers(updatedMembers);
                            console.log("Synced Super Admin UID.");
                        }
                        setUser(memberProfile);
                    } else {
                        await auth.signOut();
                        setUser(null);
                        if (pathname !== '/admin/login') {
                            router.push('/admin/login');
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch team members:", error);
                    setUser(null);
                }
            } else {
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
