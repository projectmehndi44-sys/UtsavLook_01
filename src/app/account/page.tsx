import { BookingHistory } from "@/components/account/booking-history";
import { ProfileDetails } from "@/components/account/profile-details";
import { mockBookings, mockCustomer } from "@/lib/data";

export default function AccountPage() {
    return (
        <div className="bg-background min-h-screen">
            <div className="container mx-auto px-4 py-12">
                <h1 className="font-headline text-6xl md:text-8xl text-primary mb-4 text-center">
                    My Account
                </h1>
                <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                    Manage your profile, view your booking history, and keep track of your upcoming appointments.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                         <ProfileDetails customer={mockCustomer} />
                    </div>
                    <div className="lg:col-span-2">
                        <BookingHistory bookings={mockBookings} />
                    </div>
                </div>
            </div>
        </div>
    );
}
