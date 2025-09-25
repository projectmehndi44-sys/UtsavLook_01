
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
import { Facebook, Instagram, Send } from 'lucide-react'; 

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>WhatsApp</title>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52s-.67-.816-.926-1.123c-.256-.306-.523-.266-.725-.271-.197-.006-1.012-.01-1.548.471-.536.482-.879 1.135-.879 2.06 0 .925.898 2.39 1.023 2.565.125.174 1.758 2.836 4.252 3.75.586.22 1.054.354 1.414.448.552.144 1.054.128 1.446.076.438-.052 1.348-.55 1.547-1.074.2-.524.2-1.023.15-1.123s-.198-.15-.497-.297zM12.052 2c-5.452 0-9.877 4.425-9.877 9.877 0 1.733.456 3.363 1.258 4.795L2 22l5.35-1.393a9.83 9.83 0 0 0 4.702 1.258c5.452 0 9.877-4.425 9.877-9.877S17.503 2 12.052 2z"/>
    </svg>
);

const benefitIcons: Record<string, string> = {
    "Set Your Own Price": `<path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18" /> <path stroke-linecap="round" stroke-linejoin="round" d="M18.7 8a2.4 2.4 0 0 0-4.1-1.3" /> <path stroke-linecap="round" stroke-linejoin="round" d="M12.2 12.8a2.4 2.4 0 0 0-4.1-1.3" /> <path stroke-linecap="round" stroke-linejoin="round" d="M5.7 17.5a2.4 2.4 0 0 0-4.1-1.3" />`,
    "'UtsavLook Verified' Badge": `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" />`,
    "Intelligent Scheduling": `<rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="m9 16 2 2 4-4" />`,
    "Your Own Referral Code": `<path d="M9.5 7.5L4 2" /><path d="m14 6-1-1" /><path d="M18 10-1-1" /><path d="m21 13-1-1" /><path d="m17 2-4 4" /><path d="M10 12c-5.523 0-10 4.477-10 10" /><path d="M22 12c-5.523 0-10 4.477-10 10" />`,
    "Transparent Payouts": `<path d="M2 12c0-4.4 1.8-8.4 4.7-11.3" /><path d="M11.3 21.3c-3-2.9-4.7-6.9-4.7-11.3" /><path d="M12 2a10 10 0 0 0-9.8 11.3" /><path d="M21.8 10.2c-.2-4.9-3.4-8.8-7.8-10" /><circle cx="12" cy="12" r="2" /><path d="M12 14v8" /><path d="m15 15-3 3-3-3" />`,
    "0% Commission Welcome": `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8h4" /><path d="M21 6v4" />`,
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
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                                                {React.createElement('g', { dangerouslySetInnerHTML: { __html: benefitIcons[benefit.id] || '' } })}
                                            </svg>
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
