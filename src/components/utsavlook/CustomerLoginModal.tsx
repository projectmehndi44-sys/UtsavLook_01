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
import { LogIn } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '../icons';
import { signInWithGoogle, setupRecaptcha, sendOtp } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import { getCustomerByPhone, getCustomerByEmail } from '@/lib/services';

const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  otp: z.string().min(6, { message: 'OTP must be 6 digits.' }).max(6, { message: 'OTP must be 6 digits.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface CustomerLoginModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulLogin: (customer: Customer) => void;
  onSwitchToRegister: () => void;
}

export function CustomerLoginModal({ isOpen, onOpenChange, onSuccessfulLogin, onSwitchToRegister }: CustomerLoginModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isOtpSent, setIsOtpSent] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', otp: '' },
  });

  const handlePhoneVerify = async () => {
    const phone = form.getValues('phone');
    if (!/^\d{10}$/.test(phone)) {
        form.setError('phone', { type: 'manual', message: 'Please enter a valid 10-digit phone number to verify.' });
        return;
    }
    const existingCustomer = await getCustomerByPhone(phone);
    if (!existingCustomer) {
        form.setError('phone', { type: 'manual', message: 'This number is not registered. Please register first.' });
        return;
    }

    setIsSendingOtp(true);
    try {
      if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = setupRecaptcha('recaptcha-container-login');
      }
      window.confirmationResult = await sendOtp(phone, window.recaptchaVerifier);
      setIsOtpSent(true);
      toast({
          title: 'OTP Sent',
          description: `An OTP has been sent to ${phone}.`,
      });
    } catch (error) {
       console.error("OTP Error:", error);
       toast({
           title: 'Failed to Send OTP',
           description: 'Could not send OTP. Please check your phone number or try again later.',
           variant: 'destructive',
       });
    } finally {
        setIsSendingOtp(false);
    }
  }

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    
     if (!window.confirmationResult) {
        toast({ title: 'Verification failed. Please request a new OTP.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }
    
    try {
      await window.confirmationResult.confirm(data.otp);
      const customer = await getCustomerByPhone(data.phone);

      if (customer) {
          toast({
            title: "Login Successful!",
            description: `Welcome back, ${customer.name}!`,
          });
          localStorage.setItem('currentCustomerId', customer.id);
          onSuccessfulLogin(customer);
          handleClose();
      } else {
          throw new Error("Customer not found after OTP verification.");
      }

    } catch (error) {
       console.error("Login Error:", error);
        toast({
            title: 'Login Failed',
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
      form.reset();
      setIsSubmitting(false);
      setIsOtpSent(false);
      setIsSendingOtp(false);
    }, 300);
  }

  const handleGoogleLogin = async () => {
    try {
        const user = await signInWithGoogle();
        if (user && user.email) {
            const customer = await getCustomerByEmail(user.email);

            if (customer) {
               toast({
                  title: 'Welcome Back!',
                  description: `You are now logged in as ${customer.name}.`,
               });
               localStorage.setItem('currentCustomerId', customer.id);
               onSuccessfulLogin(customer);
               handleClose();
            } else { 
               toast({
                  title: 'Account Not Found',
                  description: 'No account found with this Google account. Please register first.',
                  variant: 'destructive'
               });
            }
        }
    } catch (error: any) {
        if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Login Error:", error);
            toast({
              title: 'Google Login Failed',
              description: 'Could not log in with Google. Please try again.',
              variant: 'destructive',
            });
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Login to UtsavLook</DialogTitle>
          <DialogDescription>
            Enter your registered phone number to continue.
          </DialogDescription>
        </DialogHeader>
         <div id="recaptcha-container-login"/>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <div className="flex gap-2">
                        <FormControl>
                            <Input type="tel" placeholder="9876543210" {...field} disabled={isOtpSent} />
                        </FormControl>
                        <Button type="button" onClick={handlePhoneVerify} disabled={isSendingOtp || isOtpSent}>
                            {isSendingOtp ? 'Sending...' : (isOtpSent ? 'Sent' : 'Send OTP')}
                        </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />

                {isOtpSent && (
                    <FormField control={form.control} name="otp" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Enter OTP</FormLabel>
                            <FormControl>
                               <Input placeholder="Enter 6-digit OTP" {...field} />
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )} />
                )}

                <DialogFooter>
                    <Button type="submit" className="w-full" disabled={!isOtpSent || isSubmitting}>
                        {isSubmitting ? 'Logging In...' : <><LogIn className="mr-2 h-4 w-4" /> Login</>}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
        <div className="relative my-2">
            <Separator />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-background text-sm text-muted-foreground">OR</div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            <GoogleIcon className="mr-2 h-5 w-5"/>
            Continue with Google
        </Button>
        <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => { handleClose(); onSwitchToRegister(); }}>
                Register here
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
