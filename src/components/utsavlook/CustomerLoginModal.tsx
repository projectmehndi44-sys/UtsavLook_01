

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
import { auth, sendSignInLinkToEmail } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import { Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface CustomerLoginModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulLogin: (customer: Customer) => void;
}

export function CustomerLoginModal({ isOpen, onOpenChange, onSuccessfulLogin }: CustomerLoginModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/finish-login`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, data.email, actionCodeSettings);

      // Save the email locally so we can retrieve it on the confirmation page
      window.localStorage.setItem('emailForSignIn', data.email);

      toast({
        title: 'Login Link Sent!',
        description: 'Please check your email for a link to sign in.',
        duration: 9000,
      });

      handleClose(); // Close the modal after sending the link

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

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset();
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold text-2xl">Login or Sign Up</DialogTitle>
          <DialogDescription>
            Enter your email to get a secure, password-free login link.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
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
      </DialogContent>
    </Dialog>
  );
}
