
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, KeyRound, RefreshCw, LogIn, ShieldQuestion } from 'lucide-react';
import { getCustomer, createCustomer } from '@/lib/services';

const OTPSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: "Please enter a valid 10-digit phone number." }),
});
type OTPFormValues = z.infer<typeof OTPSchema>;

const OTP_RESEND_TIMEOUT = 60; // seconds
const MAX_OTP_REQUESTS_PER_HOUR = 10;

const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
};

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isOtpSent, setIsOtpSent] = React.useState(false);
    const [otp, setOtp] = React.useState('');
    const [error, setError] = React.useState('');
    const [timer, setTimer] = React.useState(0);
    const [captcha, setCaptcha] = React.useState('');
    const [captchaInput, setCaptchaInput] = React.useState('');

    const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);
    const auth = getAuth(getFirebaseApp());

    const phoneForm = useForm<OTPFormValues>({
        resolver: zodResolver(OTPSchema),
        defaultValues: { phone: '' },
    });
    
    // Generate captcha on client-side only to prevent hydration errors
    React.useEffect(() => {
        setCaptcha(generateCaptcha());
    }, []);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const checkOtpRequestLimit = (phone: string): boolean => {
        const now = new Date().getTime();
        const requestTimestamps: number[] = JSON.parse(localStorage.getItem(`otp_req_${phone}`) || '[]');
        const recentRequests = requestTimestamps.filter(ts => now - ts < 60 * 60 * 1000); // 1 hour window

        if (recentRequests.length >= MAX_OTP_REQUESTS_PER_HOUR) {
            setError(`Too many requests. Please try again in an hour.`);
            return false;
        }

        recentRequests.push(now);
        localStorage.setItem(`otp_req_${phone}`, JSON.stringify(recentRequests));
        return true;
    };

    const handleSendOtp: SubmitHandler<OTPFormValues> = async (data) => {
        setError('');
        if (captcha.toLowerCase() !== captchaInput.toLowerCase()) {
            setError('CAPTCHA does not match. Please try again.');
            setCaptcha(generateCaptcha());
            setCaptchaInput('');
            return;
        }

        if (!checkOtpRequestLimit(data.phone)) {
            return;
        }
        
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
            setTimer(OTP_RESEND_TIMEOUT);
            toast({
                title: 'OTP Sent',
                description: `An OTP has been sent to ${data.phone}.`,
            });
        } catch (err: any) {
            console.error("OTP send error:", err);
            let errorMessage = "Failed to send OTP. Please try again.";
            if (err.code === 'auth/too-many-requests') {
                errorMessage = "You have requested an OTP too many times. Please try again later.";
            } else if (err.code === 'auth/captcha-check-failed') {
                errorMessage = "reCAPTCHA verification failed. Please try again.";
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
            } else if (err.code === 'auth/code-expired') {
                 errorMessage = "The OTP has expired. Please request a new one.";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };


    const renderPhoneForm = () => (
         <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                <div id="recaptcha-container" style={{ position: 'absolute', bottom: 0, right: 0, zIndex: -1, visibility: 'hidden' }}></div>
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

                 <div className="space-y-2">
                    <FormLabel>Enter the text below</FormLabel>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 p-2 text-center text-2xl font-bold tracking-[.5em] bg-muted rounded-md font-mono select-none">
                            {captcha}
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setCaptcha(generateCaptcha())}>
                            <RefreshCw className="w-5 h-5"/>
                        </Button>
                    </div>
                     <Input
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        placeholder="Enter CAPTCHA"
                        autoCapitalize="off"
                        autoCorrect="off"
                    />
                </div>

                {error && <Alert variant="destructive"><p>{error}</p></Alert>}

                <Button type="submit" disabled={isLoading || timer > 0} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {timer > 0 ? `Resend OTP in ${timer}s` : 'Send OTP'}
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
             <Button variant="link" onClick={() => phoneForm.handleSubmit(handleSendOtp)()} disabled={timer > 0}>
                {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
            </Button>
        </div>
    );

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full space-y-6">
             <div className="bg-background p-8 rounded-lg shadow-lg">
                <div className="text-center mb-6">
                    {isOtpSent ? (
                        <>
                         <KeyRound className="mx-auto w-12 h-12 text-primary mb-2"/>
                         <h2 className="text-xl font-bold">Verify Your Phone</h2>
                        </>
                    ) : (
                         <>
                         <ShieldQuestion className="mx-auto w-12 h-12 text-primary mb-2"/>
                         <h2 className="text-xl font-bold">Login with Phone</h2>
                         </>
                    )}
                </div>
                {isOtpSent ? renderOtpForm() : renderPhoneForm()}
            </div>
        </div>
    </div>
  );
}
