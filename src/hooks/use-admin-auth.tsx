
'use client';

import * as React from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getTeamMembers, saveTeamMembers } from '@/lib/services';
import type { TeamMember, Permissions } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { initialTeamMembers } from '@/lib/team-data';
import { createUserWithEmailAndPassword } from 'firebase/auth';

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
                const teamMembers = await getTeamMembers();
                const superAdmin = teamMembers.find(m => m.role === 'Super Admin');

                if (superAdmin && superAdmin.id === 'user_001') {
                     // Check if the user exists in Firebase Auth
                    const defaultAdminEmail = 'utsavlook01@gmail.com';
                     try {
                        // This will create the user if they don't exist.
                        const userCredential = await createUserWithEmailAndPassword(auth, defaultAdminEmail, 'Abhi@204567');
                        const uid = userCredential.user.uid;
                        
                        // Update the team member with the correct Firebase UID
                        const updatedMembers = teamMembers.map(m => 
                            m.id === 'user_001' ? { ...m, id: uid } : m
                        );
                        await saveTeamMembers(updatedMembers);
                        console.log("Super Admin user created in Firebase Auth and database record updated.");

                    } catch (error: any) {
                        if (error.code === 'auth/email-already-exists') {
                            // User already exists, which is fine. The logic will proceed to check onAuthStateChanged.
                            console.log("Super Admin user already exists in Firebase Auth.");
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
                    const teamMembers = await getTeamMembers();
                    const memberProfile = teamMembers.find(m => m.id === firebaseUser.uid);
                    
                    if (memberProfile) {
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
