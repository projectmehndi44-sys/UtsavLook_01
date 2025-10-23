
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types';
import { useArtistPortal } from '../layout';
import { MapPin, User, Calendar, IndianRupee, FileText, Check, AlertTriangle, Clock } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateBooking, getFinancialSettings } from '@/lib/services';
import { Timestamp } from 'firebase/firestore';
import { BookingDetailsModal } from '@/components/utsavlook/BookingDetailsModal';


function getSafeDate(date: any): Date {
    if (!date) return new Date();
    if (date instanceof Date && isValid(date)) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') {
        const parsed = parseISO(date);
        if (isValid(parsed)) return parsed;
    }
    return new Date();
}

export default function ArtistBookingsPage() {
    const { artistBookings, fetchData } = useArtistPortal();
    const { toast } = useToast();
    
    // State for the modals
    const [isCompletionModalOpen, setIsCompletionModalOpen] = React.useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
    const [completionCode, setCompletionCode] = React.useState('');
    const [platformFee, setPlatformFee] = React.useState(0.1);

    React.useEffect(() => {
        getFinancialSettings().then(settings => {
            setPlatformFee(settings.platformFeePercentage / 100);
        });
    }, []);


    const handleStatusUpdate = async () => {
        if (!selectedBooking) return;
        
        if (selectedBooking.completionCode !== completionCode) {
            toast({
                title: "Invalid Code",
                description: "The completion code is incorrect. Please check with the customer.",
                variant: "destructive"
            });
            return;
        }

        await updateBooking(selectedBooking.id, { status: 'Completed' });
        await fetchData(); // Refetch data
        
        toast({
            title: "Booking Completed!",
            description: `Booking #${selectedBooking.id.substring(0,7)} has been marked as completed.`
        });

        setIsCompletionModalOpen(false);
        setSelectedBooking(null);
        setCompletionCode('');
    }

    const openCompletionModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsCompletionModalOpen(true);
    };

    const openDetailsModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailsModalOpen(true);
    }

    const getStatusInfo = (status: Booking['status']) => {
        switch (status) {
            case 'Completed': return { variant: 'default', icon: <Check className="w-4 h-4"/>, text: 'Completed' };
            case 'Confirmed': return { variant: 'secondary', icon: <Check className="w-4 h-4 text-green-600"/>, text: 'Confirmed' };
            case 'Pending Approval': return { variant: 'outline', icon: <Clock className="w-4 h-4"/>, text: 'Pending Approval' };
            case 'Cancelled': return { variant: 'destructive', icon: <AlertTriangle className="w-4 h-4"/>, text: 'Cancelled' };
            case 'Disputed': return { variant: 'destructive', icon: <AlertTriangle className="w-4 h-4"/>, text: 'Disputed' };
            default: return { variant: 'outline', icon: <Clock className="w-4 h-4"/>, text: status };
        }
    };

    if (!artistBookings) {
        return <Card><CardContent><p>Loading bookings...</p></CardContent></Card>
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>Manage your upcoming and past bookings. Use the customer's unique completion code to mark bookings as 'Completed' and request your payout.</CardDescription>
            </CardHeader>
            <CardContent>
                {artistBookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {artistBookings.map(booking => {
                            const statusInfo = getStatusInfo(booking.status);
                             return (
                                <Card key={booking.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{booking.customerName}</CardTitle>
                                                <CardDescription>For: {booking.eventType}</CardDescription>
                                            </div>
                                            <Badge variant={statusInfo.variant} className="gap-1 pl-2">
                                                {statusInfo.icon}
                                                {statusInfo.text}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="text-sm space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground"/>
                                                <span>{format(getSafeDate(booking.serviceDates[0]), "PPP")} {booking.serviceDates.length > 1 ? `(+${booking.serviceDates.length - 1} more)` : ''}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-muted-foreground"/>
                                                <span>{booking.locality}, {booking.district}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-2">
                                        <Button variant="outline" className="w-full" onClick={() => openDetailsModal(booking)}>
                                            <FileText className="w-4 h-4 mr-2"/>
                                            View Details
                                        </Button>
                                        {booking.status === 'Confirmed' && (
                                            <Button className="w-full" onClick={() => openCompletionModal(booking)}>
                                                Complete Job
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground">You have no bookings yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        
        {/* Completion Code Modal */}
        <AlertDialog open={isCompletionModalOpen} onOpenChange={setIsCompletionModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Complete Booking & Request Payout</AlertDialogTitle>
                    <AlertDialogDescription>
                       To confirm that the service has been successfully delivered, please ask the customer for their unique 6-digit completion code and enter it below.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="completion-code">Customer's Completion Code</Label>
                    <Input 
                        id="completion-code" 
                        value={completionCode}
                        onChange={(e) => setCompletionCode(e.target.value)}
                        placeholder="e.g., 123456"
                        maxLength={6}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCompletionCode('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStatusUpdate}>Submit &amp; Mark as Completed</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Details Modal */}
        <BookingDetailsModal
            booking={selectedBooking}
            isOpen={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
            platformFeePercentage={platformFee}
        />

        </>
    );
}
