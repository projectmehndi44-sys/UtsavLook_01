
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
import { sendOtp, getFirebaseApp } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import { Phone, Loader2, Home } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { getCustomerByPhone, createCustomer } from '@/lib/services';
import { ConfirmationResult, RecaptchaVerifier, getAuth } from 'firebase/auth';
import Link from 'next/link';

const phoneLoginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
});

type PhoneLoginFormValues = z.infer<typeof phoneLoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [isOtpSent, setIsOtpSent] = React.useState(false);

  const phoneForm = useForm<PhoneLoginFormValues>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { phone: '' },
  });
  
  const handleSendOtp = async (data: PhoneLoginFormValues) => {
    setIsSubmitting(true);
    setPhone(data.phone);

    try {
        const auth = getAuth(getFirebaseApp());
        // The reCAPTCHA container is now on the login page itself
        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
        });
        
        const confirmationResult = await sendOtp(data.phone, recaptchaVerifier);

        window.confirmationResult = confirmationResult;
        setIsOtpSent(true);
        toast({
            title: 'OTP Sent!',
            description: 'Please check your phone for the verification code.',
        });
    } catch (error: any) {
        console.error("OTP send error:", error);
        if (error.code === 'auth/too-many-requests') {
             toast({ title: 'Too Many Requests', description: "You've requested too many OTPs. Please wait a while before trying again.", variant: 'destructive'});
        } else {
            toast({ title: 'Failed to send OTP', description: error.message, variant: 'destructive'});
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    try {
      const confirmationResult: ConfirmationResult | undefined = window.confirmationResult;
      if (!confirmationResult) {
        throw new Error("No confirmation result found.");
      }
      
      const result = await confirmationResult.confirm(otp);
      
      let customer = await getCustomerByPhone(phone);
      if (!customer) {
        // Create new customer
        const newCustomerData: Omit<Customer, 'id'> & { id: string } = {
          id: result.user.uid,
          name: `User ${phone.substring(6)}`,
          phone: phone,
          email: result.user.email || undefined,
        };
        await createCustomer(newCustomerData);
        customer = newCustomerData;
      }
      
      // Store customer ID and redirect
      localStorage.setItem('currentCustomerId', customer.id);
      toast({
            title: 'Login Successful',
            description: `Welcome back, ${customer.name}!`,
        });
      router.push('/account');

    } catch (error) {
      console.error("OTP verification error:", error);
      toast({ title: 'Invalid OTP', description: 'The code you entered is incorrect.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {!isOtpSent ? (
                    <>
                        <h2 className="text-xl font-bold text-center mb-1">Login or Sign Up</h2>
                        <p className="text-muted-foreground text-center mb-6">Enter your phone number to get an OTP.</p>
                        <Form {...phoneForm}>
                            <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                                <FormField
                                    control={phoneForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="sr-only">Phone Number</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <span className="inline-block p-2 border rounded-l-md bg-muted">+91</span>
                                                    <Input type="tel" placeholder="10-digit mobile number" {...field} className="rounded-l-none" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Phone className="mr-2 h-4 w-4" />}
                                    {isSubmitting ? 'Sending...' : 'Send OTP'}
                                </Button>
                            </form>
                        </Form>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center">
                            <h2 className="text-xl font-bold mb-1">Verify Your Number</h2>
                            <p className="text-muted-foreground">Enter the 6-digit code sent to +91 {phone}</p>
                        </div>
                        <InputOTP
                            id="otp-input"
                            maxLength={6}
                            value={otp}
                            onChange={setOtp}
                            containerClassName="justify-center"
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                        <Button onClick={handleVerifyOtp} disabled={isSubmitting || otp.length < 6} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify & Continue
                        </Button>
                        <Button variant="link" size="sm" onClick={() => setIsOtpSent(false)}>Back to phone number</Button>
                    </div>
                )}
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
