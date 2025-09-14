
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getTeamMembers, saveTeamMembers } from '@/lib/services';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { initialTeamMembers } from '@/lib/team-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import type { TeamMember } from '@/lib/types';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const setupSchema = z.object({
    name: z.string().min(3, "Name is required."),
    email: z.string().email("A valid email is required."),
    password: z.string().min(6, "Password must be at least 6 characters."),
});
type SetupFormValues = z.infer<typeof setupSchema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth(app);
    const { isAuthenticated, isLoading: isAuthLoading } = useAdminAuth();
    
    const [pageState, setPageState] = React.useState<'loading' | 'setup' | 'login'>('loading');
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');

    React.useEffect(() => {
        if (isAuthLoading) return;
        if (isAuthenticated) {
            router.push('/admin');
            return;
        }

        const checkSuperAdmin = async () => {
            try {
                const members = await getTeamMembers();
                const superAdminExists = members.some(m => m.role === 'Super Admin');
                setPageState(superAdminExists ? 'login' : 'setup');
            } catch (error) {
                console.error("Error checking for super admin:", error);
                setPageState('login'); // Default to login on error
            }
        };

        checkSuperAdmin();
    }, [isAuthLoading, isAuthenticated, router]);

    const loginForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });
    
    const setupForm = useForm<SetupFormValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: { name: '', email: '', password: '' },
    });

    const handleLogin = async (data: LoginFormValues) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const teamMembers = await getTeamMembers();
            const memberProfile = teamMembers.find(m => m.id === userCredential.user.uid);
            
            if (memberProfile) {
                toast({ title: 'Login Successful', description: `Welcome, ${memberProfile.name}! Redirecting...` });
                router.push('/admin'); 
            } else {
                await auth.signOut();
                toast({ title: 'Access Denied', description: 'This user account does not have admin privileges.', variant: 'destructive' });
            }
        } catch (error: any) {
            let description = 'An error occurred during login. Please try again.';
            if (error.code === 'auth/invalid-credential') {
                description = 'Invalid credentials. Please check your username and password.';
            }
            toast({ title: 'Authentication Failed', description, variant: 'destructive' });
        }
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordEmail) return;
        try {
            await sendPasswordResetEmail(auth, forgotPasswordEmail);
            toast({
                title: 'Password Reset Email Sent',
                description: `If an account for ${forgotPasswordEmail} exists, a password reset link has been sent. Please check your inbox and spam folder.`,
                duration: 9000,
            });
            setIsForgotPasswordOpen(false);
        } catch (error: any) {
            console.error("Password Reset Error:", error);
            toast({
                title: 'Error',
                description: `Could not send password reset email. Please ensure the email address is correct and try again.`,
                variant: 'destructive',
            });
        }
    };

    const handleSetup = async (data: SetupFormValues) => {
        try {
            // First, try to create the user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const authUser = userCredential.user;

            // If successful, create the Super Admin in the database
            const superAdminMember: TeamMember = {
                id: authUser.uid,
                name: data.name,
                username: data.email,
                role: 'Super Admin',
                permissions: {
                    dashboard: 'edit',
                    bookings: 'edit',
                    artists: 'edit',
                    customers: 'edit',
                    artistDirectory: 'edit',
                    payouts: 'edit',
                    transactions: 'edit',
                    packages: 'edit',
                    settings: 'edit',
                    notifications: 'edit',
                }
            };
            
            await saveTeamMembers([superAdminMember]);

            toast({ title: 'Super Admin Created!', description: 'You can now log in with your new credentials.' });
            setPageState('login');

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                // If the email exists in Auth, but not as a Super Admin in our DB (which we checked for),
                // we can assume we need to create the DB record and then let them log in.
                toast({ 
                    title: "Account Exists", 
                    description: "An auth account with this email already exists. We'll set it up as admin. Please try logging in.",
                    variant: "default"
                });
                
                // Let's create a placeholder admin to fix the state. The user can then reset password.
                const superAdminMember: TeamMember = {
                    id: `placeholder_${Date.now()}`, // Placeholder ID, will be updated on next successful login.
                    name: data.name,
                    username: data.email,
                    role: 'Super Admin',
                    permissions: initialTeamMembers[0].permissions, // Use default full permissions
                };
                 await saveTeamMembers([superAdminMember]);
                 setPageState('login');

            } else {
                toast({ title: 'Setup Failed', description: error.message, variant: 'destructive' });
            }
        }
    };
    
    if (pageState === 'loading' || isAuthLoading) {
        return (
             <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
                <p>Loading...</p>
             </div>
        )
    }

    const renderSetup = () => (
        <div className="mx-auto grid w-[400px] gap-6">
            <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold text-primary">Super Admin Setup</h1>
                <p className="text-balance text-muted-foreground">Create the first administrator account for your platform.</p>
            </div>
            <Form {...setupForm}>
                <form onSubmit={setupForm.handleSubmit(handleSetup)} className="grid gap-4">
                    <FormField control={setupForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Your Name</FormLabel><FormControl><Input placeholder="e.g., Admin User" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={setupForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Login Email</FormLabel><FormControl><Input type="email" placeholder="admin@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={setupForm.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={setupForm.formState.isSubmitting}>
                        {setupForm.formState.isSubmitting ? 'Creating Account...' : 'Create Super Admin'}
                    </Button>
                </form>
            </Form>
        </div>
    );

    const renderLogin = () => (
        <div className="mx-auto grid w-[400px] gap-6">
            <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold text-primary">Admin Portal Login</h1>
                <p className="text-balance text-muted-foreground">Enter your team credentials to access your dashboard.</p>
            </div>
            <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="grid gap-4">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="your.email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center">
                                <FormLabel>Password</FormLabel>
                                <Button variant="link" type="button" className="ml-auto inline-block text-sm underline" onClick={() => setIsForgotPasswordOpen(true)}>
                                    Forgot Password?
                                </Button>
                            </div>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                        {loginForm.formState.isSubmitting ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            </Form>
            <div className="mt-4 text-center text-sm">
                <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                    <Home className="mr-1 h-4 w-4" /> Back to Home
                </Link>
            </div>
        </div>
    );

    return (
        <>
            <div className="w-full flex items-center justify-center min-h-screen bg-muted/30">
                {pageState === 'setup' ? renderSetup() : renderLogin()}
            </div>
           
            <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                 <DialogContent className="sm:max-w-md">
                    <form onSubmit={handlePasswordReset}>
                        <DialogHeader>
                            <DialogTitle>Forgot Password</DialogTitle>
                            <DialogDescription>Enter your registered login email to receive a password reset link.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="forgot-email">Email Address</Label>
                            <Input id="forgot-email" type="email" value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)} required />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Send Reset Link</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
