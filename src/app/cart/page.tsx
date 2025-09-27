
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
import type { CartItem, Customer, Artist, Promotion } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCustomer, createBooking, getAvailableLocations, listenToCollection, getPromotions } from '@/lib/services';
import { Timestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IndianRupee, ShieldCheck, Info, AlertCircle, CheckCircle, X, Tag, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const OrderSummary = ({
  items,
  form,
  onConfirm,
  artists
}: {
  items: CartItem[],
  form: any,
  onConfirm: (paymentMethod: 'online' | 'offline', finalAmount: number, appliedCode?: string) => void,
  artists: Artist[]
}) => {
    const [promoCode, setPromoCode] = React.useState('');
    const [appliedDiscount, setAppliedDiscount] = React.useState<{ type: 'artist' | 'admin', discount: number, code: string, artist?: Artist } | null>(null);
    const [promoError, setPromoError] = React.useState('');
    const [adminPromos, setAdminPromos] = React.useState<Promotion[]>([]);

    React.useEffect(() => {
        getPromotions().then(setAdminPromos);
    }, []);

    const baseTotalAmount = items.reduce((sum, item) => sum + item.price, 0);

    const handleApplyCode = () => {
        setPromoError('');
        if (!promoCode) return;

        const code = promoCode.toUpperCase();
        
        // 1. Check for artist referral code
        const matchedArtist = artists.find(a => a.referralCode?.toUpperCase() === code);
        if (matchedArtist) {
            setAppliedDiscount({
                type: 'artist',
                discount: matchedArtist.referralDiscount || 10,
                code: matchedArtist.referralCode!,
                artist: matchedArtist,
            });
            // If an artist is chosen via referral, it overrides any previously selected artist.
            // This is a business logic decision.
             if(items[0] && items[0].artist?.id !== matchedArtist.id) {
                items[0].artist = matchedArtist;
             }
            return;
        }

        // 2. Check for admin promotion code
        const matchedAdminPromo = adminPromos.find(p => p.code.toUpperCase() === code);
        if (matchedAdminPromo && matchedAdminPromo.isActive) {
             if (matchedAdminPromo.expiryDate && new Date(matchedAdminPromo.expiryDate) < new Date()) {
                setPromoError("This promotion has expired.");
                return;
            }
            setAppliedDiscount({
                type: 'admin',
                discount: matchedAdminPromo.discount,
                code: matchedAdminPromo.code
            });
            return;
        }

        setPromoError("Invalid or expired code.");
    };
    
    const handleRemoveCode = () => {
        setAppliedDiscount(null);
        setPromoCode('');
        setPromoError('');
    }

    const discountedTotal = appliedDiscount 
        ? baseTotalAmount * (1 - (appliedDiscount.discount / 100))
        : baseTotalAmount;
        
    const taxableAmount = discountedTotal / 1.18;
    const gstAmount = discountedTotal - taxableAmount;
    const advanceAmount = discountedTotal * 0.6;


    return (
        <Card className="shadow-lg rounded-lg sticky top-24">
            <CardHeader>
                <CardTitle className="text-2xl">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="promo-code">Referral / Discount Code</Label>
                    <div className="flex gap-2">
                        <Input
                            id="promo-code"
                            placeholder="Enter Code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            disabled={!!appliedDiscount}
                        />
                         {appliedDiscount ? (
                            <Button variant="ghost" size="icon" onClick={handleRemoveCode}>
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        ) : (
                            <Button onClick={handleApplyCode} variant="secondary">Apply</Button>
                        )}
                    </div>
                     {promoError && <p className="text-sm text-destructive">{promoError}</p>}
                     {appliedDiscount && (
                        <Alert variant="default" className="bg-green-100 border-green-300 text-green-800 [&>svg]:text-green-800">
                             <Tag className="h-4 w-4" />
                            <AlertTitle className="font-semibold">Code Applied!</AlertTitle>
                            <AlertDescription>
                                You've saved {appliedDiscount.discount}% with code {appliedDiscount.code}.
                                {appliedDiscount.type === 'artist' && ` You'll be booked with ${appliedDiscount.artist?.name}.`}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                 <Separator />
                <div className="flex justify-between text-muted-foreground">
                    <span>Base Total</span>
                    <span>₹{baseTotalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                 {appliedDiscount && (
                    <div className="flex justify-between text-green-600 font-medium">
                        <span>Discount ({appliedDiscount.discount}%)</span>
                        <span>- ₹{(baseTotalAmount - discountedTotal).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                 )}
                 <Separator />
                <div className="flex justify-between font-bold text-xl text-primary">
                    <span>Final Amount</span>
                    <span>₹{discountedTotal.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                        <span>Taxable Amount (pre-GST)</span>
                        <span>₹{taxableAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>GST (18% included)</span>
                        <span>₹{gstAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                </div>
                 <Alert className="bg-blue-100 border-blue-300 text-blue-800 [&>svg]:text-blue-800">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Travel Charges</AlertTitle>
                    <AlertDescription>
                        A travel charge may be applicable and is payable directly to the artist at the venue. This will be communicated by the artist after booking.
                    </AlertDescription>
                </Alert>
                <Separator/>
                <div className="space-y-4">
                     <Alert className="bg-green-100 border-green-300 text-green-800 [&>svg]:text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Confirmation Policy</AlertTitle>
                        <AlertDescription>
                           Bookings are accepted on a first-come, first-served basis. Pay an advance to confirm your slot instantly. Unpaid bookings will be confirmed only after a phone consultation.
                        </AlertDescription>
                    </Alert>
                     <Alert variant="destructive" className="bg-red-100 border-red-300 text-red-800 [&>svg]:text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Refund Policy</AlertTitle>
                        <AlertDescription>
                           Advance payment is only refunded if cancelled 72 hours before the event (cancellation charges apply). This is because dates will be exclusively reserved for you.
                        </AlertDescription>
                    </Alert>

                    <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => onConfirm('online', discountedTotal, appliedDiscount?.code)}>
                       Pay 60% Advance & Confirm (₹{advanceAmount.toLocaleString(undefined, {maximumFractionDigits: 0})})
                    </Button>
                    <Button size="lg" variant="outline" className="w-full" onClick={() => onConfirm('offline', discountedTotal, appliedDiscount?.code)}>
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
            eventDate: new Date(),
            serviceDates: [],
            state: '',
            district: '',
            locality: '',
            address: '',
            mapLink: '',
            alternateContact: '',
            travelCharges: 0,
            notes: '',
            guestMehndi: { included: false, expectedCount: 0},
            guestMakeup: { included: false, expectedCount: 0},
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

    const handleConfirmAndBook = async (paymentMethod: 'online' | 'offline', finalAmount: number, appliedCode?: string) => {
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

        let finalArtistIds: string[] = [];
        let bookingStatus: Booking['status'] = 'Needs Assignment';

        if (paymentMethod === 'offline') {
            bookingStatus = 'Pending Confirmation';
        }

        if (appliedCode) {
            const matchedArtist = artists.find(a => a.referralCode?.toUpperCase() === appliedCode.toUpperCase());
            if (matchedArtist) {
                finalArtistIds = [matchedArtist.id];
                bookingStatus = 'Pending Approval';
            }
        } else {
            const preSelectedArtistIds = Array.from(new Set(cartItems.map(item => item.artist?.id).filter(Boolean)));
            if (preSelectedArtistIds.length > 0) {
                finalArtistIds = preSelectedArtistIds;
                bookingStatus = 'Pending Approval';
            }
        }

        const bookingData: Partial<Booking> = {
            customerId: customer.id,
            customerName: bookingDetails.name,
            customerContact: bookingDetails.contact,
            alternateContact: bookingDetails.alternateContact,
            artistIds: finalArtistIds,
            items: cartItems,
            amount: finalAmount,
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
        };

        if (appliedCode) {
            bookingData.appliedReferralCode = appliedCode;
        }

        try {
            await createBooking(bookingData as Omit<Booking, 'id'>);

            toast({
                title: "Booking Request Sent!",
                description: "Your booking is being processed. You can view its status in your dashboard.",
            });
            
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
                 <div className="relative mb-4 text-center">
                    <h1 className="font-headline text-6xl md:text-8xl text-primary">
                        My Cart
                    </h1>
                     <div className="absolute top-0 right-0">
                        <Button asChild variant="outline">
                            <Link href="/"><Home className="mr-2 h-4 w-4"/> Back to Home</Link>
                        </Button>
                    </div>
                </div>
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
                           <OrderSummary items={cartItems} form={form} onConfirm={handleConfirmAndBook} artists={artists} />
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
