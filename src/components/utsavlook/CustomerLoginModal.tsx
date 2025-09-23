

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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { auth, sendSignInLinkToEmail, setupRecaptcha, sendOtp } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import { Mail, Phone, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { getCustomerByPhone, createCustomer } from '@/lib/services';
import type { ConfirmationResult } from 'firebase/auth';


const emailLoginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

const phoneLoginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
});

type EmailLoginFormValues = z.infer<typeof emailLoginSchema>;
type PhoneLoginFormValues = z.infer<typeof phoneLoginSchema>;

interface CustomerLoginModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulLogin: (customer: Customer) => void;
}

export function CustomerLoginModal({ isOpen, onOpenChange, onSuccessfulLogin }: CustomerLoginModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('email');
  
  // Phone auth state
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [isOtpSent, setIsOtpSent] = React.useState(false);
  const [isRecaptchaReady, setIsRecaptchaReady] = React.useState(false);

  const emailForm = useForm<EmailLoginFormValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: '' },
  });

  const phoneForm = useForm<PhoneLoginFormValues>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { phone: '' },
  });

  const handleEmailSubmit = async (data: EmailLoginFormValues) => {
    setIsSubmitting(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/finish-login`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, data.email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', data.email);

      toast({
        title: 'Login Link Sent!',
        description: 'Please check your email for a link to sign in.',
        duration: 9000,
      });

      handleClose();

    } catch (error) {
      console.error("Email link sign-in error:", error);
      toast({
        title: 'Failed to Send Link',
        description: 'Could not send the login link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Setup reCAPTCHA when phone tab is selected
  React.useEffect(() => {
    if (activeTab === 'phone' && !window.recaptchaVerifier) {
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        setupRecaptcha(recaptchaContainer, () => {
          setIsRecaptchaReady(true);
        });
      }
    }
  }, [activeTab]);
  

  const handleSendOtp = async (data: PhoneLoginFormValues) => {
    setIsSubmitting(true);
    setPhone(data.phone);
    if (!window.recaptchaVerifier) {
      toast({ title: 'reCAPTCHA not ready', variant: 'destructive'});
      setIsSubmitting(false);
      return;
    }
    
    try {
      const confirmationResult = await sendOtp(data.phone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      toast({
        title: 'OTP Sent!',
        description: 'Please check your phone for the verification code.',
      });
    } catch (error: any) {
      console.error("OTP send error:", error);
      toast({ title: 'Failed to send OTP', description: error.message, variant: 'destructive'});
      if (window.grecaptcha && window.recaptchaVerifier) {
        window.grecaptcha.reset(window.recaptchaVerifier.widgetId);
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
      const user = result.user;

      let customer = await getCustomerByPhone(phone);
      if (!customer) {
        // Create new customer
        const newCustomerData: Omit<Customer, 'id'> & { id: string } = {
          id: user.uid,
          name: `User ${phone.substring(6)}`,
          phone: phone,
        };
        await createCustomer(newCustomerData);
        customer = newCustomerData;
      }
      onSuccessfulLogin(customer);
      handleClose();

    } catch (error) {
      console.error("OTP verification error:", error);
      toast({ title: 'Invalid OTP', description: 'The code you entered is incorrect.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      emailForm.reset();
      phoneForm.reset();
      setIsSubmitting(false);
      setIsOtpSent(false);
      setOtp('');
      setPhone('');
      setActiveTab('email');
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Login or Sign Up</DialogTitle>
          <DialogDescription>
             Choose your preferred method to get a secure login.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4"/>Email</TabsTrigger>
                <TabsTrigger value="phone"><Phone className="mr-2 h-4 w-4"/>Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
                <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4 pt-4">
                    <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Sending Link...' : 'Send Login Link'}
                    </Button>
                </form>
                </Form>
            </TabsContent>
            <TabsContent value="phone">
                 {!isOtpSent ? (
                     <Form {...phoneForm}>
                        <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4 pt-4">
                             <FormField
                                control={phoneForm.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>10-Digit Mobile Number</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center">
                                                <span className="inline-block p-2 border rounded-l-md bg-muted">+91</span>
                                                <Input type="tel" placeholder="9876543210" {...field} className="rounded-l-none" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div id="recaptcha-container"></div>
                            <Button type="submit" disabled={isSubmitting || !isRecaptchaReady} className="w-full">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Phone className="mr-2 h-4 w-4" />}
                                {isSubmitting ? 'Sending...' : (isRecaptchaReady ? 'Send OTP' : 'Verifying...')}
                            </Button>
                        </form>
                    </Form>
                 ) : (
                    <div className="space-y-4 pt-4">
                         <div className="text-center">
                            <Label htmlFor="otp-input">Enter OTP</Label>
                            <p className="text-sm text-muted-foreground">Sent to +91 {phone}</p>
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
                            Verify & Login
                        </Button>
                        <Button variant="link" size="sm" onClick={() => setIsOtpSent(false)}>Back</Button>
                    </div>
                 )}
            </TabsContent>
        </Tabs>
        
      </DialogContent>
    </Dialog>
  );
}
