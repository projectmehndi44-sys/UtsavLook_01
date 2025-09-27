
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { BookingForm, bookingFormSchema, BookingFormValues } from "@/components/cart/booking-form";
import { CartItemsList } from "@/components/cart/cart-items-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CartItem, Customer, Artist } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCustomer, createBooking, getAvailableLocations, listenToCollection } from '@/lib/services';
import { Timestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IndianRupee, ShieldCheck } from 'lucide-react';

const OrderSummary = ({ items, form, onConfirm }: { items: CartItem[], form: any, onConfirm: (paymentMethod: 'online' | 'offline') => void }) => {
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
    const taxableAmount = totalAmount / 1.18;
    const gstAmount = totalAmount - taxableAmount;
    const advanceAmount = totalAmount * 0.6;


    return (
        <Card className="shadow-lg rounded-lg sticky top-24">
            <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                    <span>Taxable Amount (pre-GST)</span>
                    <span>₹{taxableAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                 <div className="flex justify-between text-muted-foreground">
                    <span>GST (18% included)</span>
                    <span>₹{gstAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                    Note: A travel charge may be applicable and is payable directly to the artist at the venue. This will be communicated by the artist after booking.
                </div>
                 <Separator />
                <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Total Amount</span>
                    <span>₹{totalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                <Separator/>
                <div className="space-y-4">
                    <Card className="bg-primary/5 p-4">
                        <h4 className="font-semibold text-primary flex items-center gap-2"><ShieldCheck/> Policies</h4>
                        <p className="text-xs text-muted-foreground mt-2"><b>Confirmation:</b> Bookings are accepted on a first-come, first-served basis. Pay an advance to confirm your slot instantly. Unpaid bookings will be confirmed only after a phone consultation.</p>
                        <p className="text-xs text-muted-foreground mt-1"><b>Refund:</b> Advance payment is only refunded if cancelled 72 hours before the event (cancellation charges apply). This is because dates will be exclusively reserved for you.</p>
                    </Card>

                    <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => onConfirm('online')}>
                       Pay 60% Advance & Confirm (₹{advanceAmount.toLocaleString(undefined, {maximumFractionDigits: 0})})
                    </Button>
                    <Button size="lg" variant="outline" className="w-full" onClick={() => onConfirm('offline')}>
                       Pay at Venue (Requires Phone Confirmation)
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


export default function CartPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [availableLocations, setAvailableLocations] = React.useState<Record<string, string[]>>({});
    const [artists, setArtists] = React.useState<Artist[]>([]);


    const form = useForm<BookingFormValues>({
        resolver: zodResolver(bookingFormSchema),
        defaultValues: {
            name: '',
            contact: '',
            eventType: '',
            serviceDates: [],
            state: '',
            district: '',
            locality: '',
            address: '',
            mapLink: '',
            alternateContact: '',
            travelCharges: 0,
            notes: '',
        }
    });

    React.useEffect(() => {
        const customerId = localStorage.getItem('currentCustomerId');
        if (customerId) {
            getCustomer(customerId).then(customerData => {
                if (customerData) {
                    setCustomer(customerData);
                    const storedCart = localStorage.getItem(`cart_${customerId}`);
                    setCartItems(storedCart ? JSON.parse(storedCart) : []);
                    // Pre-fill form with customer data
                    form.reset({
                        ...form.getValues(),
                        name: customerData.name,
                        contact: customerData.phone,
                    });
                }
            });
        } else {
            // If user is not logged in but has a temporary item, redirect to login
            if (localStorage.getItem('tempCartItem')) {
                router.push('/login');
            }
        }
        
        getAvailableLocations().then(setAvailableLocations);

        const unsubscribeArtists = listenToCollection<Artist>('artists', setArtists);
        return () => unsubscribeArtists();

    }, [router, form]);

    const handleRemoveItem = (itemId: string) => {
        const newCart = cartItems.filter(item => item.id !== itemId);
        setCartItems(newCart);
        if (customer) {
            localStorage.setItem(`cart_${customer.id}`, JSON.stringify(newCart));
        }
        toast({
            title: "Item removed",
            description: "The service has been removed from your cart.",
            variant: "destructive"
        });
    };

    const handleConfirmAndBook = async (paymentMethod: 'online' | 'offline') => {
        const bookingDetails = form.getValues();
        const isValid = await form.trigger();

        if (!isValid) {
            toast({
                title: "Incomplete Details",
                description: "Please fill out all the required booking details before proceeding.",
                variant: "destructive"
            });
            return;
        }

        if (cartItems.length === 0 || !customer) {
            toast({
                title: "Your cart is empty!",
                description: "Please add services to your cart before booking.",
                variant: "destructive"
            });
            return;
        }

        const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
        const bookingStatus = paymentMethod === 'online' ? 'Pending Approval' : 'Pending Confirmation';

        try {
            await createBooking({
                customerId: customer.id,
                customerName: bookingDetails.name,
                customerContact: bookingDetails.contact,
                alternateContact: bookingDetails.alternateContact,
                artistIds: Array.from(new Set(cartItems.map(item => item.artist?.id).filter(Boolean))),
                items: cartItems,
                amount: totalAmount,
                status: bookingStatus,
                eventType: bookingDetails.eventType,
                eventDate: Timestamp.fromDate(bookingDetails.eventDate),
                serviceDates: bookingDetails.serviceDates.map(d => Timestamp.fromDate(d)),
                serviceAddress: bookingDetails.address,
                state: bookingDetails.state,
                district: bookingDetails.district,
                locality: bookingDetails.locality,
                mapLink: bookingDetails.mapLink,
                guestMehndi: bookingDetails.guestMehndi,
                guestMakeup: bookingDetails.guestMakeup,
                note: bookingDetails.notes,
                paymentMethod: paymentMethod,
                paidOut: false,
                travelCharges: bookingDetails.travelCharges,
            });

            toast({
                title: "Booking Request Sent!",
                description: "Your booking is being processed. You can view its status in your dashboard.",
            });
            
            // Clear cart and redirect
            localStorage.removeItem(`cart_${customer.id}`);
            router.push('/account');

        } catch (error) {
            console.error("Booking creation failed: ", error);
            toast({
                title: "Booking Failed",
                description: "There was an error placing your booking. Please try again.",
                variant: "destructive"
            });
        }
    };
    
    const showGuestFields = {
        mehndi: cartItems.some(item => item.servicePackage.service === 'mehndi'),
        makeup: cartItems.some(item => item.servicePackage.service === 'makeup'),
    }

    return (
        <div className="bg-background">
            <div className="container mx-auto px-4 py-12">
                <h1 className="font-headline text-6xl md:text-8xl text-primary mb-4 text-center">
                    My Cart
                </h1>
                <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                    Finalize your service selections and provide booking details to confirm your appointments.
                </p>

                {cartItems.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <CartItemsList items={cartItems} onRemoveItem={handleRemoveItem} />
                            <BookingForm form={form} availableLocations={availableLocations} showGuestFields={showGuestFields} artists={artists} />
                        </div>
                        <div className="lg:col-span-1">
                           <OrderSummary items={cartItems} form={form} onConfirm={handleConfirmAndBook} />
                        </div>
                    </div>
                ) : (
                    <Card className="text-center py-20">
                        <CardContent>
                            <h2 className="text-2xl font-semibold mb-2">Your Cart is Empty</h2>
                            <p className="text-muted-foreground mb-6">Looks like you haven't added any services yet.</p>
                            <Button asChild>
                                <a href="/#services">Browse Services</a>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
