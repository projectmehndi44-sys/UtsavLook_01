
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getAuth, RecaptchaVerifier, type ConfirmationResult } from 'firebase/auth';
import { getFirebaseApp, sendOtp } from '@/lib/firebase';
import { Alert } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, KeyRound } from 'lucide-react';
import { getCustomer, createCustomer } from '@/lib/services';

const OTPSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: "Please enter a valid 10-digit phone number." }),
});
type OTPFormValues = z.infer<typeof OTPSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isOtpSent, setIsOtpSent] = React.useState(false);
    const [otp, setOtp] = React.useState('');
    const [error, setError] = React.useState('');

    const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);
    const auth = getAuth(getFirebaseApp());

    const phoneForm = useForm<OTPFormValues>({
        resolver: zodResolver(OTPSchema),
        defaultValues: { phone: '' },
    });

    const handleSendOtp: SubmitHandler<OTPFormValues> = async (data) => {
        setError('');
        setIsLoading(true);

        try {
            if (recaptchaVerifierRef.current) {
              recaptchaVerifierRef.current.clear();
            }
            
            const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible'
            });

            recaptchaVerifierRef.current = verifier;

            const confirmationResult = await sendOtp(data.phone, verifier);

            window.confirmationResult = confirmationResult;
            setIsOtpSent(true);
            toast({
                title: 'OTP Sent',
                description: `An OTP has been sent to ${data.phone}.`,
            });
        } catch (err: any) {
            console.error("OTP send error:", err);
            let errorMessage = "Failed to send OTP. Please try again.";
            if (err.code === 'auth/too-many-requests') {
                errorMessage = "You have requested an OTP too many times. Please try again later.";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleVerifyOtp = async () => {
        setError('');
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }
        setIsLoading(true);
        try {
            if (window.confirmationResult) {
                const result = await window.confirmationResult.confirm(otp);
                const user = result.user;
                
                let customer = await getCustomer(user.uid);
                
                if (!customer) {
                    const newCustomerData = {
                        id: user.uid,
                        name: `User ${user.uid.substring(0, 5)}`,
                        phone: user.phoneNumber || phoneForm.getValues('phone'),
                        email: user.email || ''
                    };
                    await createCustomer(newCustomerData);
                    customer = newCustomerData;
                }

                localStorage.setItem('currentCustomerId', customer.id);
                toast({
                    title: 'Login Successful!',
                    description: `Welcome back, ${customer.name}!`,
                });
                router.push('/account');
            } else {
                 throw new Error("Confirmation result not found.");
            }

        } catch (err: any) {
            console.error("OTP verification error:", err);
            let errorMessage = "Failed to verify OTP. Please check the code and try again.";
            if (err.code === 'auth/invalid-verification-code') {
                errorMessage = "Invalid OTP. Please try again.";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };


    const renderPhoneForm = () => (
         <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                <div id="recaptcha-container" style={{ position: 'absolute', bottom: 0, right: 0, zIndex: -1 }}></div>
                <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <Input type="tel" placeholder="Enter your 10-digit number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {error && <Alert variant="destructive"><p>{error}</p></Alert>}
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send OTP
                </Button>
            </form>
        </Form>
    );

    const renderOtpForm = () => (
        <div className="space-y-4 text-center">
            <p className="text-muted-foreground">Enter the 6-digit code sent to +91 {phoneForm.getValues('phone')}</p>
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className="mx-auto">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>
            
            {error && <Alert variant="destructive"><p>{error}</p></Alert>}

            <Button onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP
            </Button>
            <Button variant="link" onClick={() => setIsOtpSent(false)} disabled={isLoading}>
                Change Number
            </Button>
        </div>
    );

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full space-y-6">
             <div className="bg-background p-8 rounded-lg shadow-lg">
                <div className="text-center mb-6">
                    <KeyRound className="mx-auto w-12 h-12 text-primary mb-2"/>
                    <h2 className="text-xl font-bold">Login with Phone</h2>
                </div>
                {isOtpSent ? renderOtpForm() : renderPhoneForm()}
            </div>
        </div>
    </div>
  );
}
