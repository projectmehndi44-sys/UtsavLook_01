
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLinkSent, setIsLinkSent] = React.useState(false);

  const emailForm = useForm<EmailLoginFormValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: '' },
  });

  const handleSendLink = async (data: EmailLoginFormValues) => {
    setIsSubmitting(true);
    try {
      const auth = getAuth(getFirebaseApp());
      const actionCodeSettings = {
        url: `${window.location.origin}/finish-login`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, data.email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', data.email);
      setIsLinkSent(true);
      toast({
        title: 'Check Your Email!',
        description: `A sign-in link has been sent to ${data.email}. Please check your inbox and spam folder.`,
        duration: 9000,
      });
    } catch (error: any) {
      console.error("Email link send error:", error);
      toast({ title: 'Failed to Send Link', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLinkSent) {
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
            <div className="max-w-md w-full text-center mb-8">
                <h1 className="font-headline text-5xl font-bold text-accent">
                    Utsav<span className="text-primary">Look</span>
                </h1>
            </div>
            <div className="max-w-md w-full space-y-6">
                <div className="bg-background p-8 rounded-lg shadow-lg text-center">
                    <Mail className="w-12 h-12 text-primary mx-auto mb-4"/>
                    <h2 className="text-xl font-bold mb-2">Email Sent!</h2>
                    <p className="text-muted-foreground">
                        A secure sign-in link has been sent to your email address. Please click the link in the email to log in. You can safely close this window.
                    </p>
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

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <div id="recaptcha-container"></div>
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
                    <form onSubmit={emailForm.handleSubmit(handleSendLink)} className="space-y-4">
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
                        
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mail className="mr-2 h-4 w-4" />}
                            {isSubmitting ? 'Sending Link...' : 'Send Sign-In Link'}
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
