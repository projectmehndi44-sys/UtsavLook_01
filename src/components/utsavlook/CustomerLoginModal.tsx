

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
import { auth, sendOtp } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import { getCustomerByPhone, createCustomer } from '@/lib/services';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const loginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  otp: z.string().optional(),
  name: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface CustomerLoginModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulLogin: (customer: Customer) => void;
}

export function CustomerLoginModal({ isOpen, onOpenChange, onSuccessfulLogin }: CustomerLoginModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOtpSent, setIsOtpSent] = React.useState(false);
  const [isNewUser, setIsNewUser] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', otp: '', name: '' },
  });

  const handleSendOtp = async () => {
    const phone = form.getValues('phone');
    if (!/^\d{10}$/.test(phone)) {
        form.setError('phone', { type: 'manual', message: 'Please enter a valid phone number.' });
        return;
    }
    if (!window.recaptchaVerifier) {
        toast({ title: 'reCAPTCHA not ready', description: 'Please wait a moment and try again.', variant: 'destructive'});
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
           description: 'Could not send OTP. Please check the phone number and try again.',
           variant: 'destructive',
       });
       // Reset reCAPTCHA on error
       if (window.recaptchaVerifier) {
           window.recaptchaVerifier.render().then(function(widgetId) {
                // @ts-ignore
                window.grecaptcha.reset(widgetId);
            });
       }
    } finally {
        setIsSubmitting(false);
    }
  }

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    
    if (!window.confirmationResult) {
        toast({ title: 'Verification failed. Please request a new OTP.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    if (!data.otp || data.otp.length !== 6) {
        form.setError('otp', { type: 'manual', message: 'Please enter the 6-digit OTP.' });
        setIsSubmitting(false);
        return;
    }
    
    try {
      const userCredential = await window.confirmationResult.confirm(data.otp);
      let customer: Customer | null;

      if (isNewUser) {
        if (!data.name || data.name.length < 2) {
          form.setError('name', { type: 'manual', message: 'Name is required for new users.' });
          setIsSubmitting(false);
          return;
        }
        const newCustomerData: Omit<Customer, 'id'> & {id: string} = {
            id: userCredential.user.uid,
            name: data.name,
            phone: data.phone,
            email: userCredential.user.email || undefined,
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
          router.push('/account');
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
      form.reset();
      setIsSubmitting(false);
      setIsOtpSent(false);
      setIsNewUser(false);
    }, 300);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Login or Sign Up</DialogTitle>
          <DialogDescription>
            Enter your phone number to continue.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>10-digit Phone Number</FormLabel>
                        <FormControl>
                            <Input type="tel" placeholder="9876543210" {...field} disabled={isOtpSent} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                {!isOtpSent && (
                   <Button id="send-otp-button" type="button" onClick={handleSendOtp} disabled={isSubmitting} className="w-full">
                        {isSubmitting ? 'Sending...' : 'Send OTP'}
                   </Button>
                )}

                {isOtpSent && (
                <>
                    {isNewUser && (
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Enter your full name" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    )}
                    <FormField control={form.control} name="otp" render={({ field }) => (
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
      </DialogContent>
    </Dialog>
  );
}
