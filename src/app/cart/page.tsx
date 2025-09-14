'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { BookingForm } from "@/components/cart/booking-form";
import { CartItemsList } from "@/components/cart/cart-items-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CartItem, Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCustomer, createBooking } from '@/lib/services';
import { Timestamp } from 'firebase/firestore';


const bookingFormSchema = z.object({
    eventType: z.string().min(2, { message: "Event type is required." }),
    eventDate: z.date({ required_error: "Event date is required." }),
    serviceDates: z.array(z.date()).min(1, { message: "At least one service date is required." }),
    address: z.string().min(10, { message: "Please enter a valid address." }),
    notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;


const OrderSummary = ({ items, onConfirm }: { items: CartItem[], onConfirm: () => void }) => {
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const taxes = subtotal * 0.18;
    const total = subtotal + taxes;

    return (
        <Card className="shadow-lg rounded-lg sticky top-24">
            <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your order before proceeding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Taxes & Fees</span>
                    <span>₹{taxes.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={onConfirm}>Confirm & Proceed</Button>
            </CardFooter>
        </Card>
    );
};


export default function CartPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
    const [customer, setCustomer] = React.useState<Customer | null>(null);

    const form = useForm<BookingFormValues>({
        resolver: zodResolver(bookingFormSchema),
        defaultValues: {
            eventType: "",
            serviceDates: [],
            address: "",
            notes: "",
        }
    });

    React.useEffect(() => {
        const customerId = localStorage.getItem('currentCustomerId');
        if (customerId) {
            getCustomer(customerId).then(setCustomer);
            const storedCart = localStorage.getItem(`cart_${customerId}`);
            setCartItems(storedCart ? JSON.parse(storedCart) : []);
        } else {
            // Redirect to login if not logged in
            router.push('/');
        }
    }, [router]);

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

    const handleConfirmAndBook = async () => {
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

        try {
            await createBooking({
                customerId: customer.id,
                customerName: customer.name,
                customerContact: customer.phone,
                artistIds: Array.from(new Set(cartItems.map(item => item.artist?.id).filter(Boolean))),
                items: cartItems,
                amount: totalAmount,
                status: 'Pending Approval',
                eventType: bookingDetails.eventType,
                eventDate: Timestamp.fromDate(bookingDetails.eventDate),
                serviceDates: bookingDetails.serviceDates.map(d => Timestamp.fromDate(d)),
                serviceAddress: bookingDetails.address,
                location: '', // Extract from address if possible
                district: '', // Extract from address if possible
                state: '', // Extract from address if possible
                note: bookingDetails.notes,
                paymentMethod: 'online', // Or determined by UI
                paidOut: false,
            });

            toast({
                title: "Booking Successful!",
                description: "Your booking has been placed and is pending approval. You can view it in your dashboard.",
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
                            <BookingForm form={form} />
                        </div>
                        <div className="lg:col-span-1">
                           <OrderSummary items={cartItems} onConfirm={handleConfirmAndBook} />
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
