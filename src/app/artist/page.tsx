
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { Award, BarChart, CalendarCheck, IndianRupee, Sparkles, UserPlus, Share2, Loader2, Copy, Download, X, Quote } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getPromotionalImage, getBenefitImages, getArtists } from '@/lib/services';
import type { BenefitImage, Customer, Artist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ClientOnly } from '@/components/ClientOnly';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';
import { Parallax } from 'react-scroll-parallax';
import { ParallaxProvider } from 'react-scroll-parallax';
import { occasionImages } from '@/lib/occasion-images';

const benefitIcons: { [key: string]: React.ReactNode } = {
    "set-your-own-price": <IndianRupee className="w-8 h-8 text-accent" />,
    "verified-badge": <Award className="w-8 h-8 text-accent" />,
    "intelligent-scheduling": <CalendarCheck className="w-8 h-8 text-accent" />,
    "referral-code": <UserPlus className="w-8 h-8 text-accent" />,
    "transparent-payouts": <BarChart className="w-8 h-8 text-accent" />,
    "zero-commission-welcome": <Sparkles className="w-8 h-8 text-accent" />,
};

export default function ArtistHomePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [benefits, setBenefits] = React.useState<BenefitImage[]>([]);
    const [artists, setArtists] = React.useState<Artist[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

    const [isSharing, setIsSharing] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [shareableImage, setShareableImage] = React.useState<string | null>(null);
    
    // Header compatibility states
    const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [cartCount, setCartCount] = React.useState(0);
    
    React.useEffect(() => {
        setIsLoading(true);
        Promise.all([
            getBenefitImages(),
            getArtists()
        ]).then(([benefitData, artistData]) => {
            setBenefits(benefitData);
            setArtists(artistData.filter(a => a.rating > 4.5).slice(0, 3)); // Get top 3 artists
            setIsLoading(false);
        }).catch(() => {
            setIsLoading(false);
        });
    }, []);

    // Simplified Hero Slideshow Effect
    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prevIndex => (prevIndex + 1) % occasionImages.length);
        }, 4000); // Change image every 4 seconds

        return () => clearInterval(interval);
    }, []);


    const shareText = "Join UtsavLook and grow your artistry business! We give you the tools to succeed. #UtsavLookArtist #MehndiArtist #MakeupArtist #ArtistPlatform";

    const handleShareClick = async () => {
        setIsSharing(true);
        setIsGenerating(true);
        try {
            const promoImage = await getPromotionalImage();
            if (promoImage?.imageUrl) {
                setShareableImage(promoImage.imageUrl);
            } else {
                throw new Error("Promotional image not found.");
            }
        } catch (error) {
            console.error("Error fetching promo image:", error);
            toast({ title: 'Error', description: 'Could not load promotional image. Please upload one in the admin panel.', variant: 'destructive' });
            setIsSharing(false);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleCloseDialog = () => {
        setIsSharing(false);
        setShareableImage(null);
    };

    const handleDownload = () => {
        if (!shareableImage) return;
        const link = document.createElement('a');
        link.download = `utsavlook-benefits-promo.png`;
        link.href = shareableImage;
        link.click();
    };

    const handleNativeShare = async () => {
        if (!shareableImage) return;
        
        try {
            const response = await fetch(shareableImage);
            const blob = await response.blob();
            const file = new File([blob], 'utsavlook-promo.png', { type: blob.type });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Join UtsavLook for Artists!',
                    text: shareText,
                });
            } else {
                navigator.clipboard.writeText(shareText);
                handleDownload();
                toast({
                    title: "Ready to Share!",
                    description: "Image downloaded & promotional text copied to your clipboard.",
                });
            }
        } catch (error) {
            console.error('Sharing failed:', error);
            toast({
                title: 'Sharing Failed',
                description: 'Could not open share dialog. Image has been downloaded and text copied to clipboard as a fallback.',
                variant: 'destructive',
            });
            navigator.clipboard.writeText(shareText);
            handleDownload();
        }
    };

    return (
        <ParallaxProvider>
        <div className="flex min-h-screen w-full flex-col bg-background">
             <ClientOnly>
                <Header
                    isCustomerLoggedIn={isCustomerLoggedIn}
                    onCustomerLogout={() => {}}
                    customer={customer}
                    cartCount={cartCount}
                />
             </ClientOnly>
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative w-full h-[70vh] md:h-screen text-white overflow-hidden">
                    {/* Background Slideshow */}
                    <div className="absolute inset-0 w-full h-full z-0">
                        {occasionImages.map((item, index) => (
                            <Image
                                key={item.imageUrl}
                                src={item.imageUrl}
                                alt={item.occasion}
                                layout="fill"
                                objectFit="cover"
                                className={cn(
                                    "transition-opacity duration-1000 ease-in-out",
                                    currentImageIndex === index ? "opacity-100" : "opacity-0"
                                )}
                                priority={index === 0}
                            />
                        ))}
                         <div className="absolute inset-0 bg-black/40" />
                    </div>

                    {/* Text Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4">
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight font-headline animate-slide-down opacity-0 [animation-fill-mode:forwards]">
                            Your Art. Your Business.
                        </h1>
                        <p className="max-w-2xl mt-4 text-lg md:text-xl text-white/80 animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:2s]">
                           Join a community that celebrates your talent. We give you the tools to get discovered, manage bookings, and grow your brand—all in one place.
                        </p>
                        <div className="mt-8 flex gap-4 animate-fade-in opacity-0 [animation-fill-mode:forwards] [animation-delay:4s]">
                             <Link href="/artist/register">
                                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full text-lg px-8 py-6">
                                    Register Now
                                </Button>
                            </Link>
                            <Link href="/artist/login">
                                <Button size="lg" variant="outline" className="bg-transparent hover:bg-white/10 text-white border-white rounded-full text-lg px-8 py-6">
                                    Artist Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary">
                     <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary font-headline mb-4">
                                A Platform Built for You
                            </h2>
                             <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                                We handle the business, so you can focus on your art. Discover the UtsavLook difference.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {isLoading ? (
                                Array.from({length: 6}).map((_, index) => (
                                    <div key={index} className="space-y-4">
                                        <Skeleton className="h-16 w-16 rounded-full" />
                                        <Skeleton className="h-8 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </div>
                                ))
                            ) : benefits.map((benefit, index) => (
                                <div key={benefit.id} className="bg-background p-6 rounded-lg shadow-brand hover:shadow-brand-lg transition-all duration-300 hover:-translate-y-2">
                                     <div className="inline-block bg-primary/10 p-4 rounded-full w-fit mb-4">
                                        {benefitIcons[benefit.id] || <Sparkles className="w-8 h-8 text-primary" />}
                                     </div>
                                     <h3 className="text-xl font-bold text-primary mb-2">{benefit.title}</h3>
                                     <p className="text-muted-foreground">
                                         {benefit.description}
                                     </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* Artist Spotlight */}
                {artists.length > 0 && (
                <section className="py-16 md:py-24 lg:py-32 bg-background">
                    <div className="container px-4 md:px-6">
                        <h2 className="text-3xl font-bold tracking-tighter text-center sm:text-5xl text-primary font-headline mb-12">
                            Success Stories
                        </h2>
                        <Carousel
                            opts={{ align: "start" }}
                            className="w-full"
                            plugins={[Autoplay({ delay: 6000 })]}
                        >
                            <CarouselContent>
                                {artists.map((artist, index) => (
                                    <CarouselItem key={artist.id} className="md:basis-1/2 lg:basis-1/3">
                                        <div className="p-4">
                                            <div className="bg-secondary p-8 rounded-lg text-center h-full flex flex-col items-center">
                                                <Image src={artist.profilePicture} alt={artist.name} width={120} height={120} className="rounded-full border-4 border-white shadow-lg -mt-20 mb-4" />
                                                <h3 className="text-xl font-bold text-primary">{artist.name}</h3>
                                                <p className="text-sm text-muted-foreground">{artist.services.join(', ')} Artist</p>
                                                <Quote className="w-10 h-10 text-accent my-4" />
                                                <p className="text-muted-foreground italic flex-grow">"Joining UtsavLook was a game-changer for my business. I'm getting more bookings than ever and can finally focus on what I love."</p>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </div>
                </section>
                )}


                 {/* Call to Action Section */}
                <section className="w-full py-16 md:py-24 lg:py-32 bg-primary/10">
                    <Parallax speed={-10}>
                    <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                        <div className="space-y-3">
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary font-headline">
                            Ready to Elevate Your Career?
                        </h2>
                        <p className="mx-auto max-w-[600px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Stop waiting for clients to find you. Join a platform that actively works to grow your business.
                        </p>
                        </div>
                        <div className="mx-auto w-full max-w-sm space-y-2 mt-4">
                            <Link href="/artist/register">
                                <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-lg py-6 rounded-full">
                                    Become a UtsavLook Artist Today
                                </Button>
                            </Link>
                        </div>
                    </div>
                    </Parallax>
                </section>
            </main>
            
            <Dialog open={isSharing} onOpenChange={handleCloseDialog}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Share UtsavLook Benefits</DialogTitle>
                        <DialogDescription>Your promotional image is ready. Share it to attract more clients!</DialogDescription>
                    </DialogHeader>
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="mt-4 text-muted-foreground">Preparing your image...</p>
                        </div>
                    ) : shareableImage ? (
                        <div className="space-y-4">
                             <Image src={shareableImage} alt="UtsavLook Artist Benefits" width={1080} height={1080} className="rounded-lg border w-full"/>
                            <div className="relative">
                               <Textarea value={shareText} readOnly className="h-24"/>
                               <Button size="icon" variant="ghost" className="absolute right-2 top-2 h-8 w-8" onClick={() => { navigator.clipboard.writeText(shareText); toast({ title: 'Copied!' }); }}><Copy className="h-4 w-4"/></Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={handleNativeShare} className="w-full">
                                    <Share2 className="mr-2"/> Share
                                </Button>
                                <Button onClick={handleDownload} variant="secondary" className="w-full">
                                    <Download className="mr-2"/> Download
                                </Button>
                            </div>
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-64 text-center">
                            <p className="text-destructive">Could not load promotional image.</p>
                            <p className="text-muted-foreground text-sm">Please ensure one is uploaded in the admin panel.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
        </ParallaxProvider>
    );
}
