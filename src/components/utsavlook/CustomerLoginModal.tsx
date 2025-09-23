

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
import { auth, sendOtp } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import { Phone, Loader2 } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { getCustomerByPhone, createCustomer } from '@/lib/services';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';


const phoneLoginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
});

type PhoneLoginFormValues = z.infer<typeof phoneLoginSchema>;

interface CustomerLoginModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulLogin: (customer: Customer) => void;
}

export function CustomerLoginModal({ isOpen, onOpenChange, onSuccessfulLogin }: CustomerLoginModalProps) {
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
      const verifier = await new Promise<RecaptchaVerifier>((resolve) => {
        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {
                resolve(recaptchaVerifier);
            }
        });
        recaptchaVerifier.render();
      });

      const confirmationResult = await sendOtp(data.phone, verifier);
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      toast({
        title: 'OTP Sent!',
        description: 'Please check your phone for the verification code.',
      });
    } catch (error: any) {
      console.error("OTP send error:", error);
      toast({ title: 'Failed to send OTP', description: error.message, variant: 'destructive'});
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
      phoneForm.reset();
      setIsSubmitting(false);
      setIsOtpSent(false);
      setOtp('');
      setPhone('');
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Login or Sign Up</DialogTitle>
          <DialogDescription>
             Enter your phone number to receive a secure one-time password (OTP).
          </DialogDescription>
        </DialogHeader>

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
                    
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Phone className="mr-2 h-4 w-4" />}
                        {isSubmitting ? 'Sending...' : 'Send OTP'}
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
      </DialogContent>
    </Dialog>
  );
}
