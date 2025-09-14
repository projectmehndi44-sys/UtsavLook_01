
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
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [pendingArtists, setPendingArtists] = React.useState<PendingArtist[]>([]);
    const [onboardFormOpen, setOnboardFormOpen] = React.useState(false);
    const [dialogState, setDialogState] = React.useState<{type: 'delete' | 'delete-pending' | 'reset-pass'; data: Artist | PendingArtist | null}>({type: 'delete', data: null});

    React.useEffect(() => {
        const unsubscribeArtists = listenToCollection<Artist>('artists', setArtists);
        const unsubscribePending = listenToCollection<PendingArtist>('pendingArtists', setPendingArtists);

        return () => {
            unsubscribeArtists();
            unsubscribePending();
        }
    }, []);
    
    const form = useForm<OnboardFormValues>({
        resolver: zodResolver(onboardSchema),
        defaultValues: { name: '', email: '', phone: '', location: '', charge: 0 },
    });
    
    const handleDownload = (selectedArtists?: Artist[]) => {
        const artistsToExport = selectedArtists || artists;
        if(artistsToExport.length === 0){
            toast({ title: 'No artists to export', variant: 'destructive'});
            return;
        }
        exportToExcel(artistsToExport.map(artist => ({
            artist,
            bookings: [], // In a real scenario, you'd fetch relevant bookings
            reviews: artist.reviews || [],
        })));
         toast({ title: 'Export Started', description: `Exporting data for ${artistsToExport.length} artists.`});
    };
    
    const handleApprove = async (pendingArtist: PendingArtist) => {
        const auth = getAuth(app);
        
        try {
            // Check if user already exists in Firebase auth
            const existingAuthUser = await getArtistByEmail(pendingArtist.email).catch(() => null);

            let uid;
            if (existingAuthUser) {
                uid = existingAuthUser.id;
            } else {
                 // 1. Create user in Firebase Authentication (will send password reset email)
                const userCredential = await createUserWithEmailAndPassword(auth, pendingArtist.email, `tempPass${Date.now()}`);
                uid = userCredential.user.uid;
                await sendPasswordResetEmail(auth, pendingArtist.email);
            }

            // 2. Create artist document in 'artists' collection with the new UID
            const newArtist: Omit<Artist, 'id'> = {
                name: pendingArtist.fullName,
                email: pendingArtist.email,
                phone: pendingArtist.phone,
                location: pendingArtist.locality,
                state: pendingArtist.state,
                district: pendingArtist.district,
                locality: pendingArtist.locality,
                servingAreas: pendingArtist.servingAreas,
                profilePicture: `https://api.dicebear.com/7.x/initials/svg?seed=${pendingArtist.fullName}`,
                workImages: [], // This would be URLs from storage
                services: ['mehndi', 'makeup', 'photography'], // Default services, can be changed later
                charge: 5000,
                charges: { mehndi: 5000, makeup: 7000, photography: 10000 },
                rating: 0,
                styleTags: ['bridal', 'traditional'],
            };
            
            await createArtistWithId({ id: uid, ...newArtist });
            
            // 3. Delete from 'pendingArtists'
            await deletePendingArtist(pendingArtist.id);

            toast({
                title: 'Artist Approved!',
                description: `${pendingArtist.fullName} is now a registered artist. A password creation email has been sent.`,
            });

        } catch (error: any) {
            console.error("Approval error: ", error);
            toast({
                title: 'Approval Failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleReject = async (pendingArtistId: string) => {
        await deletePendingArtist(pendingArtistId);
        toast({
            title: 'Application Rejected',
            variant: 'destructive',
        });
    };

    const confirmAction = async () => {
        if (!dialogState.data) return;

        const {type, data} = dialogState;

        try {
            if (type === 'delete' && data.role !== 'Super Admin') {
                await deleteArtist(data.id);
                toast({ title: 'Artist Deleted', description: `${data.name} has been removed.`, variant: 'destructive'});
            } else if (type === 'delete-pending') {
                 await deletePendingArtist(data.id);
                toast({ title: 'Pending Application Deleted', variant: 'destructive'});
            } else if (type === 'reset-pass' && 'email' in data) {
                 const auth = getAuth(app);
                 await sendPasswordResetEmail(auth, data.email);
                 toast({ title: 'Password Reset Email Sent', description: `An email has been sent to ${data.name}.`});
            } else if (data.role === 'Super Admin') {
                 toast({ title: 'Action Denied', description: 'Super Admin cannot be deleted.', variant: 'destructive' });
            }
        } catch(error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setDialogState({type: 'delete', data: null});
        }
    };
    
    const handleOnboardSubmit: SubmitHandler<OnboardFormValues> = async (data) => {
         const auth = getAuth(app);
        try {
            // This flow is for admin-led onboarding, so we create the auth user
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, `tempPass${Date.now()}`);
            const uid = userCredential.user.uid;

             const newArtist: Omit<Artist, 'id'> = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                location: data.location,
                profilePicture: `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}`,
                workImages: [],
                services: ['mehndi'], // Default
                charge: data.charge,
                charges: { mehndi: data.charge },
                rating: 0,
                styleTags: [],
            };
            await createArtistWithId({ id: uid, ...newArtist });
            
            // Send email to set password
            await sendPasswordResetEmail(auth, data.email);

            toast({ title: 'Artist Onboarded', description: `${data.name} has been added. A password setup email has been sent.` });
            setOnboardFormOpen(false);
            form.reset();

        } catch (error: any) {
             toast({ title: 'Onboarding Failed', description: error.message, variant: 'destructive' });
        }
    }
    
    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Artist Management</h1>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleDownload()}>
                        <Download className="mr-2 h-4 w-4"/> Download All
                    </Button>
                    {hasPermission('artists', 'edit') && (
                        <Button onClick={() => setOnboardFormOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4"/> Onboard New Artist
                        </Button>
                    )}
                 </div>
            </div>
            <Tabs defaultValue="approved">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="approved">Approved Artists ({artists.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending Applications ({pendingArtists.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="approved" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Approved Artists</CardTitle>
                            <CardDescription>
                                View, manage, and verify registered artists on the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Artist</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Services</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Status</TableHead>
                                        {hasPermission('artists', 'edit') && <TableHead><span className="sr-only">Actions</span></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {artists.map(artist => (
                                        <TableRow key={artist.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={artist.profilePicture} alt={artist.name}/>
                                                        <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <button onClick={() => router.push(`/admin/artists/${artist.id}`)} className="font-semibold hover:underline">{artist.name}</button>
                                                        <div className="text-sm text-muted-foreground">{artist.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{artist.district}, {artist.state}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                {(artist.services || []).map(service => <Badge key={service} variant="secondary" className="capitalize">{service}</Badge>)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                 <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400"/> {artist.rating.toFixed(1)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                 <Badge variant={artist.verified ? "default" : "outline"} className={artist.verified ? "bg-green-100 border-green-300 text-green-800" : ""}>
                                                    {artist.verified ? <ShieldCheck className="mr-1 h-3.5 w-3.5"/> : <ShieldOff className="mr-1 h-3.5 w-3.5"/>}
                                                    {artist.verified ? 'Verified' : 'Not Verified'}
                                                </Badge>
                                            </TableCell>
                                             {hasPermission('artists', 'edit') && (
                                                <TableCell className="text-right">
                                                     <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onSelect={() => router.push(`/admin/artists/${artist.id}`)}><Eye className="mr-2"/>View Details</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => updateArtist(artist.id, { verified: !artist.verified })}>
                                                                {artist.verified ? <ShieldOff className="mr-2"/> : <ShieldCheck className="mr-2"/>}
                                                                {artist.verified ? 'Revoke Verification' : 'Mark as Verified'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => setDialogState({type: 'reset-pass', data: artist})}>
                                                                <KeyRound className="mr-2"/>Send Password Reset
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator/>
                                                            <DropdownMenuItem onSelect={() => setDialogState({type: 'delete', data: artist})} className="text-destructive">
                                                                <Trash2 className="mr-2"/>Delete Artist
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                             )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="pending" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Pending Applications</CardTitle>
                            <CardDescription>
                                Review and approve new artist registrations. Approving sends an email to the artist to set their password.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Applicant</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingArtists.length > 0 ? pendingArtists.map(pa => (
                                        <TableRow key={pa.id}>
                                            <TableCell>
                                                <div className="font-medium">{pa.fullName}</div>
                                                <div className="text-sm text-muted-foreground">{pa.email}</div>
                                            </TableCell>
                                            <TableCell>{pa.locality}, {pa.district}, {pa.state}</TableCell>
                                            <TableCell>{new Date(pa.submissionDate).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button size="sm" variant="outline" onClick={() => handleReject(pa.id)}>
                                                    <XCircle className="mr-2 h-4 w-4"/> Reject
                                                </Button>
                                                <Button size="sm" onClick={() => handleApprove(pa)}>
                                                    <CheckCircle className="mr-2 h-4 w-4"/> Approve
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">No pending applications.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <AlertDialog open={!!dialogState.data} onOpenChange={() => setDialogState({type: 'delete', data: null})}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogState.type === 'delete' && `This action will permanently delete the artist '${dialogState.data?.name}'. This cannot be undone.`}
                            {dialogState.type === 'delete-pending' && `This action will permanently delete the pending application from '${dialogState.data?.name}'.`}
                            {dialogState.type === 'reset-pass' && `This will send a password reset link to '${dialogState.data?.name}'.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction} className={dialogState.type.startsWith('delete') ? 'bg-destructive hover:bg-destructive/90' : ''}>
                           Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={onboardFormOpen} onOpenChange={setOnboardFormOpen}>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Onboard New Artist</AlertDialogTitle>
                        <AlertDialogDescription>Manually create a new artist profile. They will be sent an email to set their password.</AlertDialogDescription>
                    </AlertDialogHeader>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleOnboardSubmit)} className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field}/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field}/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={form.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={form.control} name="charge" render={({ field }) => ( <FormItem><FormLabel>Default Base Charge</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem> )}/>
                            <AlertDialogFooter>
                                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                                <AlertDialogAction type="submit">Onboard Artist</AlertDialogAction>
                            </AlertDialogFooter>
                        </form>
                    </Form>
                 </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
