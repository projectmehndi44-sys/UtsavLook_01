
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
import { Mail, Loader2, Home, KeyRound, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { getAuth, RecaptchaVerifier, signInWithCredential, PhoneAuthProvider } from 'firebase/auth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import type { Customer } from '@/lib/types';
import { createCustomer, getCustomerByPhone } from '@/lib/services';

const phoneLoginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
});

type PhoneLoginFormValues = z.infer<typeof phoneLoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isOtpSent, setIsOtpSent] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);
  const auth = getAuth(getFirebaseApp());

  const phoneForm = useForm<PhoneLoginFormValues>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { phone: '' },
  });

  const handleSendOtp = async (data: PhoneLoginFormValues) => {
    setIsLoading(true);
    try {
        // Set language code to ensure proper functioning of reCAPTCHA
        auth.languageCode = 'en';

        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible'
        });
      
        const confirmationResult = await sendOtp(data.phone, recaptchaVerifier);

        window.confirmationResult = confirmationResult;
        setIsOtpSent(true);
        toast({
            title: 'OTP Sent!',
            description: `An OTP has been sent to +91 ${data.phone}.`,
        });
    } catch (error: any) {
        console.error("OTP Send error:", error);
        let description = "An unknown error occurred.";
        if (error.code === 'auth/too-many-requests') {
            description = "You have requested an OTP too many times. Please try again later.";
        } else if (error.code === 'auth/captcha-check-failed') {
            description = "The reCAPTCHA verification failed. Please try again."
        }
        toast({ title: 'Failed to send OTP', description: description, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!window.confirmationResult || otp.length !== 6) return;
    setIsVerifying(true);
    try {
        const credential = PhoneAuthProvider.credential(window.confirmationResult.verificationId, otp);
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;

        let customer = await getCustomerByPhone(user.phoneNumber!.substring(3)); // Remove +91

        if (!customer) {
            const newCustomerData: Omit<Customer, 'id'> & { id: string } = {
                id: user.uid,
                name: `User ${user.uid.substring(0, 5)}`, // Placeholder name
                phone: user.phoneNumber!.substring(3),
            };
            await createCustomer(newCustomerData);
            customer = newCustomerData;
        }

        localStorage.setItem('currentCustomerId', customer.id);
        toast({ title: 'Login Successful!', description: `Welcome back, ${customer.name}!` });
        router.push('/account');

    } catch (error: any) {
        console.error("OTP Verification error:", error);
        toast({ title: 'Verification Failed', description: 'The OTP is incorrect or has expired. Please try again.', variant: 'destructive'});
    } finally {
        setIsVerifying(false);
        setOtp('');
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
                        <p className="text-muted-foreground text-center mb-6">Enter your phone number to receive a one-time password (OTP).</p>
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
                                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm h-10">
                                                        +91
                                                    </span>
                                                    <Input type="tel" placeholder="10-digit mobile number" {...field} className="rounded-l-none" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mail className="mr-2 h-4 w-4" />}
                                    {isLoading ? 'Sending...' : 'Send OTP'}
                                </Button>
                            </form>
                        </Form>
                    </>
                 ) : (
                    <div className="text-center">
                        <h2 className="text-xl font-bold">Enter OTP</h2>
                        <p className="text-muted-foreground mb-6">Enter the 6-digit code sent to your phone.</p>
                        <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                         <Button onClick={handleVerifyOtp} disabled={isVerifying || otp.length < 6} className="w-full mt-6">
                            {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4"/>}
                            {isVerifying ? 'Verifying...' : 'Verify OTP & Login'}
                        </Button>
                        <Button variant="link" onClick={() => setIsOtpSent(false)} className="mt-2">Back</Button>
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
