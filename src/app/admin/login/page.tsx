
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home, AlertTriangle, KeyRound, ShieldPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getTeamMembers, saveTeamMembers } from '@/lib/services';
import type { TeamMember } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const setupSchema = z.object({
    name: z.string().min(2, "Name is required."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
});
type SetupFormValues = z.infer<typeof setupSchema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth(app);
    
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');
    const [pageState, setPageState] = React.useState<'loading' | 'setup' | 'login'>('loading');

    const loginForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });
    const setupForm = useForm<SetupFormValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
    });

    React.useEffect(() => {
        const checkAdminExists = async () => {
            try {
                const members = await getTeamMembers();
                const superAdminExists = members.some(m => m.role === 'Super Admin');
                setPageState(superAdminExists ? 'login' : 'setup');
            } catch (error) {
                console.error("Failed to check for super admin:", error);
                setPageState('setup'); // Fallback to setup if check fails
                toast({ title: 'Error', description: 'Could not verify admin status.', variant: 'destructive'});
            }
        };
        checkAdminExists();
    }, [toast]);

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
            toast({ title: 'Password Reset Email Sent', description: `If an account exists, a reset link has been sent.` });
            setIsForgotPasswordOpen(false);
        } catch (error: any) {
            toast({ title: 'Error', description: 'Could not send password reset email.', variant: 'destructive' });
        }
    };

    const handleSetup = async (data: SetupFormValues) => {
        try {
            // Step 1: Create the Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const authUser = userCredential.user;

            // Step 2: Create the team member document in Firestore
            const newAdminMember: TeamMember = {
                id: authUser.uid,
                name: data.name,
                username: data.email,
                role: 'Super Admin',
                permissions: {
                    dashboard: 'edit', bookings: 'edit', artists: 'edit',
                    customers: 'edit', artistDirectory: 'edit', payouts: 'edit',
                    transactions: 'edit', packages: 'edit', settings: 'edit',
                    notifications: 'edit',
                },
            };
            
            // Get existing members (should be empty, but good practice)
            const currentMembers = await getTeamMembers();
            await saveTeamMembers([...currentMembers, newAdminMember]);
            
            toast({
                title: "Super Admin Created!",
                description: "Your account is set up. You can now log in.",
            });
            setPageState('login'); // Switch to login view
            loginForm.setValue('email', data.email); // Pre-fill email for convenience

        } catch (error: any) {
            let description = 'An unexpected error occurred.';
            if (error.code === 'auth/email-already-in-use') {
                description = 'This email is already in use. Please try logging in or use a different email.';
            }
            toast({ title: 'Setup Failed', description, variant: 'destructive' });
        }
    };

    const renderLoading = () => (
        <Card className="mx-auto grid w-[400px] gap-6 p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <CardTitle>Verifying Admin Setup</CardTitle>
            <CardDescription>Please wait...</CardDescription>
        </Card>
    );

    const renderSetup = () => (
        <Card className="mx-auto grid w-[400px] gap-6">
            <CardHeader className="text-center">
                <ShieldPlus className="w-12 h-12 mx-auto text-primary" />
                <CardTitle className="text-2xl font-bold text-primary">Super Admin Setup</CardTitle>
                <CardDescription>This is a one-time setup to create the first administrator account for your platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...setupForm}>
                    <form onSubmit={setupForm.handleSubmit(handleSetup)} className="grid gap-4">
                        <FormField control={setupForm.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={setupForm.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Login Email</FormLabel><FormControl><Input type="email" placeholder="admin@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={setupForm.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="submit" className="w-full" disabled={setupForm.formState.isSubmitting}>
                            {setupForm.formState.isSubmitting ? 'Creating...' : 'Create Super Admin'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
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
                {pageState === 'loading' && renderLoading()}
                {pageState === 'setup' && renderSetup()}
                {pageState === 'login' && renderLogin()}
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
