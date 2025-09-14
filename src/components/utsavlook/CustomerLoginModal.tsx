

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '../icons';
import { auth, signInWithGoogle, setupRecaptcha, sendOtp, sendSignInLinkToEmail } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import { getCustomerByPhone, getCustomerByEmail, createCustomer } from '@/lib/services';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const phoneLoginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  otp: z.string().optional(),
  name: z.string().optional(),
});

const emailLoginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type PhoneLoginFormValues = z.infer<typeof phoneLoginSchema>;
type EmailLoginFormValues = z.infer<typeof emailLoginSchema>;

interface CustomerLoginModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulLogin: (customer: Customer) => void;
}

export function CustomerLoginModal({ isOpen, onOpenChange, onSuccessfulLogin }: CustomerLoginModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOtpSent, setIsOtpSent] = React.useState(false);
  const [isNewUser, setIsNewUser] = React.useState(false);
  const [isEmailLinkSent, setIsEmailLinkSent] = React.useState(false);
  const [isRecaptchaVerified, setIsRecaptchaVerified] = React.useState(false);


  const phoneForm = useForm<PhoneLoginFormValues>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { phone: '', otp: '', name: '' },
  });
  
  const emailForm = useForm<EmailLoginFormValues>({
      resolver: zodResolver(emailLoginSchema),
      defaultValues: { email: '' },
  });
  
  const onRecaptchaSuccess = React.useCallback(() => {
    setIsRecaptchaVerified(true);
    toast({
        title: 'Phone Verified',
        description: 'You can now send the OTP.',
    });
  }, [toast]);
  
  React.useEffect(() => {
    if (isOpen && !window.recaptchaVerifier) {
       setTimeout(() => {
            const recaptchaContainer = document.getElementById('recaptcha-container');
            if (recaptchaContainer) {
                 setupRecaptcha('recaptcha-container', onRecaptchaSuccess);
            }
       }, 500);
    }
  }, [isOpen, onRecaptchaSuccess]);

  const handleSendOtp = async () => {
    const phone = phoneForm.getValues('phone');
    if (!/^\d{10}$/.test(phone) || !window.recaptchaVerifier) {
        phoneForm.setError('phone', { type: 'manual', message: 'Please enter a valid phone number.' });
        return;
    }
    
    setIsSubmitting(true);
    const existingCustomer = await getCustomerByPhone(phone);
    setIsNewUser(!existingCustomer);
    
    try {
      const confirmationResult = await sendOtp(phone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      toast({
          title: 'OTP Sent',
          description: `An OTP has been sent to +91 ${phone}.`,
      });
    } catch (error) {
       console.error("OTP Error:", error);
       toast({
           title: 'Failed to Send OTP',
           description: 'Could not send OTP. Please ensure you are not using a test number and try again.',
           variant: 'destructive',
       });
    } finally {
        setIsSubmitting(false);
    }
  }

  const onPhoneSubmit = async (data: PhoneLoginFormValues) => {
    setIsSubmitting(true);
    
    if (!window.confirmationResult) {
        toast({ title: 'Verification failed. Please request a new OTP.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    if (!data.otp) {
        phoneForm.setError('otp', { type: 'manual', message: 'Please enter the OTP.' });
        setIsSubmitting(false);
        return;
    }
    
    try {
      const userCredential = await window.confirmationResult.confirm(data.otp);
      let customer: Customer | null;

      if (isNewUser) {
        if (!data.name) {
          phoneForm.setError('name', { type: 'manual', message: 'Name is required for new users.' });
          setIsSubmitting(false);
          return;
        }
        const newCustomerData: Omit<Customer, 'id'> & {id: string} = {
            id: userCredential.user.uid,
            name: data.name,
            phone: data.phone,
        };
        await createCustomer(newCustomerData);
        customer = newCustomerData;
        toast({ title: "Registration Successful!", description: `Welcome, ${customer.name}!` });
      } else {
        customer = await getCustomerByPhone(data.phone);
        toast({ title: "Login Successful!", description: `Welcome back, ${customer?.name}!` });
      }

      if (customer) {
          localStorage.setItem('currentCustomerId', customer.id);
          onSuccessfulLogin(customer);
          handleClose();
      } else {
          throw new Error("Customer data could not be retrieved or created.");
      }

    } catch (error) {
       console.error("Login/Registration Error:", error);
        toast({
            title: 'Action Failed',
            description: 'The OTP is incorrect or something went wrong. Please try again.',
            variant: 'destructive',
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      phoneForm.reset();
      emailForm.reset();
      setIsSubmitting(false);
      setIsOtpSent(false);
      setIsNewUser(false);
      setIsRecaptchaVerified(false);
      if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
      }
      setIsEmailLinkSent(false);
    }, 300);
  }

  const handleGoogleLogin = async () => {
    try {
        const user = await signInWithGoogle();
        if (user && user.email) {
            let customer = await getCustomerByEmail(user.email);

            if (!customer) { // If user doesn't exist, create a new account
               const newCustomerData: Omit<Customer, 'id'> & {id: string} = {
                  id: user.uid,
                  name: user.displayName || 'Google User',
                  phone: user.phoneNumber || '',
                  email: user.email,
              };
              await createCustomer(newCustomerData);
              customer = newCustomerData;
              toast({ title: "Registration Successful!", description: `Welcome, ${customer.name}!` });
            } else {
               toast({ title: 'Welcome Back!', description: `You are now logged in as ${customer.name}.` });
            }

            localStorage.setItem('currentCustomerId', customer.id);
            onSuccessfulLogin(customer);
            handleClose();
        }
    } catch (error: any) {
        if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Login Error:", error);
            toast({
              title: 'Google Action Failed',
              description: 'Could not log in or sign up with Google. Please try again.',
              variant: 'destructive',
            });
        }
    }
  };

  const onEmailSubmit = async (data: EmailLoginFormValues) => {
      setIsSubmitting(true);
      const actionCodeSettings = {
        url: `${window.location.origin}/finish-login`,
        handleCodeInApp: true,
      };

      try {
        await sendSignInLinkToEmail(auth, data.email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', data.email);
        setIsEmailLinkSent(true);
        toast({
          title: 'Check your email',
          description: `A sign-in link has been sent to ${data.email}.`,
        });
      } catch (error) {
        console.error("Email Link Error:", error);
        toast({
            title: 'Failed to Send Link',
            description: 'Could not send sign-in link. Please check the email address and try again.',
            variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Login or Sign Up</DialogTitle>
          <DialogDescription>
            Continue with your phone, email, or Google account.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="phone" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone"><Phone className="mr-2 h-4 w-4"/>Phone</TabsTrigger>
                <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4"/>Email</TabsTrigger>
            </TabsList>
            <TabsContent value="phone">
                 <Form {...phoneForm}>
                    <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4 pt-4">
                        <FormField control={phoneForm.control} name="phone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input type="tel" placeholder="9876543210" {...field} disabled={isOtpSent} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div id="recaptcha-container" className="flex justify-center"></div>

                        {isRecaptchaVerified && !isOtpSent && (
                           <Button type="button" onClick={handleSendOtp} disabled={isSubmitting} className="w-full">
                                {isSubmitting ? 'Sending...' : 'Send OTP'}
                           </Button>
                        )}

                        {isOtpSent && (
                        <>
                            {isNewUser && (
                                <FormField control={phoneForm.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Enter your full name" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            )}
                            <FormField control={phoneForm.control} name="otp" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Enter OTP</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Enter 6-digit OTP" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <DialogFooter>
                                <Button type="submit" className="w-full" disabled={!isOtpSent || isSubmitting}>
                                    {isSubmitting ? 'Verifying...' : (isNewUser ? 'Register & Login' : 'Login')}
                                </Button>
                            </DialogFooter>
                        </>
                        )}

                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="email">
                {isEmailLinkSent ? (
                     <Alert>
                        <Mail className="h-4 w-4" />
                        <AlertTitle>Magic Link Sent!</AlertTitle>
                        <AlertDescription>
                          Please check your email inbox for a link to sign in. You can close this window.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4 pt-4">
                            <FormField control={emailForm.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="your.email@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Sending...' : 'Send Magic Link'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </TabsContent>
        </Tabs>

        <div className="relative my-2">
            <Separator />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-background text-sm text-muted-foreground">OR</div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            <GoogleIcon className="mr-2 h-5 w-5"/>
            Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}
