
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { sendSignInLinkToEmail, getFirebaseApp } from '@/lib/firebase';
import { Mail, Loader2, Home } from 'lucide-react';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';

const emailLoginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type EmailLoginFormValues = z.infer<typeof emailLoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const auth = getAuth(getFirebaseApp());

  const emailForm = useForm<EmailLoginFormValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: '' },
  });

  const handleSendSignInLink = async (data: EmailLoginFormValues) => {
    setIsLoading(true);
    
    const actionCodeSettings = {
      url: `${window.location.origin}/finish-login`,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, data.email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', data.email);
      toast({
        title: 'Check Your Email',
        description: `A sign-in link has been sent to ${data.email}. Please check your inbox.`,
      });
      emailForm.reset();
    } catch (error: any) {
      console.error("Send sign in link error:", error);
      toast({
        title: 'Failed to send link',
        description: "Could not send a sign-in link. Please try again.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full text-center mb-8">
             <h1 className="font-headline text-5xl font-bold text-accent">
                Utsav<span className="text-primary">Look</span>
            </h1>
        </div>
        <div className="max-w-md w-full space-y-6">
            <div className="bg-background p-8 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-center mb-1">Login or Sign Up</h2>
                <p className="text-muted-foreground text-center mb-6">Enter your email to receive a secure sign-in link.</p>
                <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(handleSendSignInLink)} className="space-y-4">
                        <FormField
                            control={emailForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Email Address</FormLabel>
                                    <FormControl>
                                         <Input type="email" placeholder="your.email@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mail className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Sending...' : 'Send Sign-In Link'}
                        </Button>
                    </form>
                </Form>
            </div>
             <div className="text-center text-sm">
                <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                    <Home className="mr-1 h-4 w-4" />
                    Back to Home
                </Link>
            </div>
        </div>
    </div>
  );
}
