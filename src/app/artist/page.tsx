
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { Award, BarChart, CalendarCheck, IndianRupee, Sparkles, UserPlus, Share2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

const benefits = [
    {
        icon: <BarChart className="w-8 h-8 text-primary" />,
        title: "Set Your Own Price",
        description: "You know the value of your art. On UtsavLook, you're in control. Set your own prices for each service tier, no unfair fixed rates. Your talent, your price.",
        image: "https://storage.googleapis.com/studiogood/b0163777-62a2-4a0b-9dfd-b8d9c614c274.jpeg",
        imageHint: "artist pricing packages"
    },
    {
        icon: <Award className="w-8 h-8 text-primary" />,
        title: "'UtsavLook Verified' Badge",
        description: "Don't get lost in the crowd. Our 'UtsavLook Verified' badge shows customers you're a trusted professional, leading to more high-quality bookings and better clients.",
        image: "https://picsum.photos/seed/artist-verified/800/600",
        imageHint": "client artist handshake"
    },
    {
        icon: <CalendarCheck className="w-8 h-8 text-primary" />,
        title: "Intelligent Scheduling",
        description: "Stop the back-and-forth phone calls. Our smart calendar lets you mark unavailable dates, so you only get booking requests for when you're actually free.",
        image: "https://picsum.photos/seed/artist-schedule/800/600",
        imageHint: "artist tablet schedule"
    },
    {
        icon: <Sparkles className="w-8 h-8 text-primary" />,
        title: "Your Own Referral Code",
        description: "Turn your happy clients into your sales team. We provide a unique referral code. When a new customer uses it, they get a discount, and you get another confirmed booking.",
        image: "https://picsum.photos/seed/artist-referral/800/600",
        imageHint: "friends sharing phone"
    },
    {
        icon: <IndianRupee className="w-8 h-8 text-primary" />,
        title: "Transparent Payouts",
        description: "Get a professional dashboard to track all your bookings, earnings, and reviews in one place. With our clear and timely payouts, the accounting is always clean and simple.",
        image: "https://picsum.photos/seed/artist-payout/800/600",
        imageHint: "person laptop finances"
    },
    {
        icon: <UserPlus className="w-8 h-8 text-primary" />,
        title: "0% Commission Welcome",
        description: "We're invested in your success from day one. To welcome you, we take zero commission on your first 5 bookings through the platform. It's all yours.",
        image: "https://picsum.photos/seed/artist-welcome/800/600",
        imageHint: "artist starting work"
    }
];

export default function ArtistHomePage() {
    const router = useRouter();
    const { toast } = useToast();
    const benefitsRef = React.useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = React.useState(false);

    // These states are added for header compatibility, but the main logic is for non-logged-in artists.
    const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
    const [customer, setCustomer] = React.useState(null);
    const [cartCount, setCartCount] = React.useState(0);

    const handleShare = React.useCallback(() => {
        if (!benefitsRef.current) return;
        setIsSharing(true);
        html2canvas(benefitsRef.current, { useCORS: true, scale: 1.5 })
            .then((canvas) => {
                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'utsavlook-artist-benefits.png';
                link.href = dataUrl;
                link.click();
                 toast({
                    title: 'Image downloaded!',
                    description: 'Your shareable benefits image is ready.',
                });
            })
            .catch((err) => {
                console.error(err);
                toast({
                    title: 'Oops!',
                    description: 'Could not create shareable image. Please try again.',
                    variant: 'destructive',
                });
            })
            .finally(() => setIsSharing(false));
    }, [toast]);


    return (
        <div className="flex min-h-screen w-full flex-col bg-secondary">
             <Header
                isCustomerLoggedIn={isCustomerLoggedIn}
                onCustomerLogout={() => {}}
                customer={customer}
                cartCount={cartCount}
            />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10 text-center">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-6 lg:grid-cols-1 items-center">
                            <div className="flex flex-col justify-center space-y-4">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-primary">
                                    Join UtsavLook & Grow Your Artistry Business
                                </h1>
                                <p className="max-w-[600px] text-foreground/80 md:text-xl mx-auto">
                                    We provide the tools, you provide the talent. Get discovered by more customers, manage your business professionally, and increase your earnings.
                                </p>
                                <div className="w-full max-w-sm mx-auto space-x-4">
                                     <Link href="/artist/register">
                                        <Button size="lg" className="bg-accent hover:bg-accent/90">
                                            Register Now
                                        </Button>
                                    </Link>
                                    <Link href="/artist/login">
                                        <Button size="lg" variant="outline">
                                            Artist Login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
                    <div ref={benefitsRef} className="container px-4 md:px-6 bg-background">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary font-headline mb-4">
                                Why Artists Love UtsavLook
                            </h2>
                             <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                                A platform designed for your growth, giving you the tools to succeed and the freedom to create.
                            </p>
                        </div>
                        <div className="grid gap-16">
                            {benefits.map((benefit, index) => (
                                <div key={index} className={`grid gap-8 md:gap-12 items-center md:grid-cols-2`}>
                                    <div className={`flex flex-col justify-center space-y-4 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                                        <div className="inline-block bg-primary/10 p-4 rounded-full w-fit mb-4">
                                            {benefit.icon}
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-primary">{benefit.title}</h3>
                                        <p className="text-muted-foreground text-lg">
                                            {benefit.description}
                                        </p>
                                    </div>
                                    <Image
                                        src={benefit.image}
                                        alt={benefit.title}
                                        width={800}
                                        height={600}
                                        className={`mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full ${index % 2 === 1 ? 'md:order-1' : ''}`}
                                        data-ai-hint={benefit.imageHint}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="container px-4 md:px-6 mt-12 text-center">
                        <Button size="lg" onClick={handleShare} disabled={isSharing}>
                            {isSharing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Share2 className="mr-2 h-5 w-5" />}
                            {isSharing ? 'Generating Image...' : 'Share The Benefits'}
                        </Button>
                    </div>
                </section>

                 {/* Call to Action Section */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10">
                    <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                        <div className="space-y-3">
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary font-headline">
                            Ready to Elevate Your Career?
                        </h2>
                        <p className="mx-auto max-w-[600px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Stop waiting for clients to find you. Join a platform that actively works to grow your business.
                        </p>
                        </div>
                        <div className="mx-auto w-full max-w-sm space-y-2">
                            <Link href="/artist/register">
                                <Button size="lg" className="w-full bg-accent hover:bg-accent/90">
                                    Become a UtsavLook Artist Today
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
