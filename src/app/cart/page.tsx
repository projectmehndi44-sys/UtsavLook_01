import { BookingForm } from "@/components/cart/booking-form";
import { CartItemsList } from "@/components/cart/cart-items-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Mock data for cart items. In a real app, this would come from a state management solution.
const mockCartItems = [
    {
        id: "cart-item-1",
        servicePackage: { id: "makeup-bridal", name: "Bridal Makeup", service: "Makeup", description: "...", image: "...", tags: [], categories: [] },
        selectedTier: { name: "Premium", description: "...", basePrice: 12000, image: "..." },
        price: 12000,
    },
    {
        id: "cart-item-2",
        servicePackage: { id: "mehndi-guest", name: "Guest Mehndi (x10)", service: "Mehndi", description: "...", image: "...", tags: [], categories: [] },
        selectedTier: { name: "Normal", description: "...", basePrice: 500, image: "..." },
        price: 5000,
    },
];

const OrderSummary = () => {
    const subtotal = mockCartItems.reduce((sum, item) => sum + item.price, 0);
    const taxes = subtotal * 0.18; // 18% tax
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
                <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Confirm & Proceed</Button>
            </CardFooter>
        </Card>
    );
};


export default function CartPage() {
    return (
        <div className="bg-background">
            <div className="container mx-auto px-4 py-12">
                <h1 className="font-headline text-6xl md:text-8xl text-primary mb-4 text-center">
                    My Cart
                </h1>
                <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                    Finalize your service selections and provide booking details to confirm your appointments.
                </p>

                {mockCartItems.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <CartItemsList items={mockCartItems} />
                            <BookingForm />
                        </div>
                        <div className="lg:col-span-1">
                           <OrderSummary />
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
