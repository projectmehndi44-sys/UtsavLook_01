
      'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Download, ChevronDown, CheckCircle, XCircle, MoreHorizontal, Eye, Trash2, UserPlus, ShieldOff, KeyRound, ShieldCheck, Star } from 'lucide-react';
import type { Artist } from '@/lib/types';
import { listenToCollection, createArtistWithId, deletePendingArtist, deleteArtist, updateArtist, getArtistByEmail } from '@/lib/services';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { exportToExcel } from '@/lib/export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/lib/firebase';


type PendingArtist = Omit<Artist, 'id'> & {
  id: string; // email is used as ID here
  status: 'Pending';
  [key: string]: any;
};

const onboardSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10}$/, "Must be a 10-digit phone number"),
  location: z.string().min(3, "Location is required"),
  charge: z.coerce.number().min(0, "Charge must be a positive number"),
});
type OnboardFormValues = z.infer<typeof onboardSchema>;


export default function ArtistManagementPage() {
    const router = useRouter();
    const { toast } } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
});

export function FeedbackForm({ onSubmit }: { onSubmit: (values: any) => Promise<void> }) {
  const form = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: '',
    },
  });

  function setRating(value: number) {
    form.setValue('rating', value);
  }

  async function onSubmitHandler(values: z.infer) {
    await onSubmit(values);
  }

  return (
    
      
        
          
        
        
          
        
        
          
        
      
      
        <Textarea placeholder="Share details of your own experience..." {...form.register('comment')} />
        {form.errors.comment && 
          
            {form.errors.comment.message}
          
        }
      
      
        <Button onClick={form.handleSubmit(onSubmitHandler)}>Submit Review</Button>
      
    
  );
}

    