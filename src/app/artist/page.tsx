
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { Award, BarChart, CalendarCheck, IndianRupee, Sparkles, UserPlus, Share2, Loader2, Palette, Copy, Download, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getBenefitImages, getPromotionalImage } from '@/lib/services';
import type { BenefitImage, Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const benefitIcons: { [key: string]: React.ReactNode } = {
    "Set Your Own Price": <IndianRupee className="w-8 h-8 text-primary" />,
    "'UtsavLook Verified' Badge": <Award className="w-8 h-8 text-primary" />,
    "Intelligent Scheduling": <CalendarCheck className="w-8 h-8 text-primary" />,
    "Your Own Referral Code": <UserPlus className="w-8 h-8 text-primary" />,
    "Transparent Payouts": <BarChart className="w-8 h-8 text-primary" />,
    "0% Commission Welcome": <Sparkles className="w-8 h-8 text-primary" />,
};


export default function ArtistHomePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [benefits, setBenefits] = React.useState<BenefitImage[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const [isSharing, setIsSharing] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [shareableImage, setShareableImage] = React.useState<string | null>(null);
    

    // These states are added for header compatibility, but the main logic is for non-logged-in artists.
    const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [cartCount, setCartCount] = React.useState(0);
    
    React.useEffect(() => {
        setIsLoading(true);
        getBenefitImages().then(data => {
            setBenefits(data);
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            setIsLoading(false);
        });
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
            // Fetch the image as a blob
            const response = await fetch(shareableImage);
            const blob = await response.blob();
            const file = new File([blob], 'utsavlook-promo.png', { type: blob.type });

            // Use the Web Share API
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Join UtsavLook for Artists!',
                    text: shareText,
                });
            } else {
                // Fallback for desktop or unsupported browsers
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
                     <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary font-headline mb-4">
                                Why Artists Love UtsavLook
                            </h2>
                             <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                                A platform designed for your growth, giving you the tools to succeed and the freedom to create.
                            </p>
                        </div>
                        <div className="grid gap-16">
                            {isLoading ? (
                                Array.from({length: 6}).map((_, index) => (
                                    <div key={index} className="grid gap-8 md:gap-12 items-center md:grid-cols-2">
                                        <div className={`flex flex-col justify-center space-y-4 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                                            <Skeleton className="h-16 w-16 rounded-full" />
                                            <Skeleton className="h-8 w-3/4" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-5/6" />
                                        </div>
                                        <Skeleton className={`mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full ${index % 2 === 1 ? 'md:order-1' : ''}`} />
                                    </div>
                                ))
                            ) : benefits.map((benefit, index) => (
                                <div key={index} className={`grid gap-8 md:gap-12 items-center md:grid-cols-2`}>
                                    <div className={`flex flex-col justify-center space-y-4 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                                        <div className="inline-block bg-primary/10 p-4 rounded-full w-fit mb-4">
                                           {benefitIcons[benefit.id] || <Sparkles className="w-8 h-8 text-primary" />}
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-primary">{benefit.title}</h3>
                                        <p className="text-muted-foreground text-lg">
                                            {benefit.description}
                                        </p>
                                    </div>
                                    <Image
                                        src={benefit.imageUrl}
                                        alt={benefit.title}
                                        width={800}
                                        height={600}
                                        className={`mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full ${index % 2 === 1 ? 'md:order-1' : ''}`}
                                        crossOrigin="anonymous"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="container px-4 md:px-6 mt-12 text-center">
                        <Button size="lg" onClick={handleShareClick} disabled={isLoading}>
                             <Share2 className="mr-2 h-5 w-5" /> Share The Benefits
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
            
            {/* Share Dialog */}
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
                               <Textarea value={shareText} readOnly className="pr-10 h-24"/>
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
    );
}
