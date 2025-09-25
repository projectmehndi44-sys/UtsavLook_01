

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { Award, BarChart, CalendarCheck, IndianRupee, Sparkles, UserPlus, Share2, Loader2, Palette, Copy, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getBenefitImages } from '@/lib/services';
import type { BenefitImage, Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { fetchPromoImage } from '@/app/actions';


const benefitIcons: Record<string, JSX.Element> = {
    "Set Your Own Price": <BarChart className="w-8 h-8 text-primary" />,
    "'UtsavLook Verified' Badge": <Award className="w-8 h-8 text-primary" />,
    "Intelligent Scheduling": <CalendarCheck className="w-8 h-8 text-primary" />,
    "Your Own Referral Code": <Sparkles className="w-8 h-8 text-primary" />,
    "Transparent Payouts": <IndianRupee className="w-8 h-8 text-primary" />,
    "0% Commission Welcome": <UserPlus className="w-8 h-8 text-primary" />,
};


export default function ArtistHomePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSharing, setIsSharing] = React.useState(false);
    const [shareableCompositeImage, setShareableCompositeImage] = React.useState<string | null>(null);
    const [benefits, setBenefits] = React.useState<BenefitImage[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

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

    const generateAndShare = async () => {
        setIsSharing(true);
        setShareableCompositeImage(null);

        const benefitImageInputs = benefits.map(b => ({
            url: b.imageUrl,
            contentType: 'image/jpeg', // Assuming jpeg for picsum
        }));

        try {
            const result = await fetchPromoImage({
                artistName: 'New Artists', // Generic for this page
                artistServices: ['Mehndi', 'Makeup', 'Photography'],
                artistRating: 5.0,
                baseCharge: 0,
                workImages: benefitImageInputs,
            });

            if (result?.imageUrl) {
                setShareableCompositeImage(result.imageUrl);
            } else {
                throw new Error('Image generation failed to return a URL.');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: 'An error occurred',
                description: 'Could not generate the promotional image. Please try again.',
                variant: 'destructive',
            });
            setIsSharing(false);
        }
    };
    
    const handleDownload = () => {
        if (!shareableCompositeImage) return;
        const link = document.createElement('a');
        link.download = `utsavlook-benefits.png`;
        link.href = shareableCompositeImage;
        link.click();
    };

    const handleActualShare = async () => {
        if (!shareableCompositeImage) return;

        try {
            const response = await fetch(shareableCompositeImage);
            const blob = await response.blob();
            const file = new File([blob], 'utsavlook-benefits.png', { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
                 await navigator.share({
                    files: [file],
                    title: 'UtsavLook Artist Benefits',
                    text: shareText,
                });
            } else {
                 handleDownload();
                 navigator.clipboard.writeText(shareText);
                 toast({
                    title: 'Ready to Share!',
                    description: 'Image downloaded and text copied. You can now post it to your favorite social media platform.',
                    duration: 5000,
                 });
            }
        } catch (error) {
            console.info('Web Share API action cancelled or failed:', error);
            // Fallback for when share fails for other reasons
            handleDownload();
            navigator.clipboard.writeText(shareText);
            toast({
                title: 'Sharing Failed, Assets Ready!',
                description: 'Could not open share dialog. Image downloaded and text copied instead.',
            });
        }
    };
    
    const handleCloseDialog = () => {
        setIsSharing(false);
        setShareableCompositeImage(null);
    }

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
                                            {benefitIcons[benefit.id as keyof typeof benefitIcons]}
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
                        <Button size="lg" onClick={generateAndShare} disabled={isSharing || isLoading}>
                            {isSharing && !shareableCompositeImage ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Share2 className="mr-2 h-5 w-5" />}
                            {isSharing && !shareableCompositeImage ? 'Generating...' : 'Share The Benefits'}
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
            <Dialog open={!!shareableCompositeImage} onOpenChange={handleCloseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Share Your UtsavLook Benefits</DialogTitle>
                        <DialogDescription>Your all-in-one graphic is ready. Share it to your favorite platforms or download it.</DialogDescription>
                    </DialogHeader>
                    {shareableCompositeImage && (
                        <Image src={shareableCompositeImage} alt="UtsavLook Artist Benefits" width={1080} height={1080} className="rounded-lg border w-full"/>
                    )}
                    <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                         <Button onClick={handleActualShare} className="w-full">
                            <Share2 className="mr-2 h-4 w-4" /> Share Now
                         </Button>
                         <div className="flex items-center gap-2">
                            <Button onClick={handleDownload} variant="outline" size="icon" aria-label="Download Image"><Download/></Button>
                            <div className="relative flex-grow">
                               <Input value={shareText} readOnly className="pr-10"/>
                               <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => { navigator.clipboard.writeText(shareText); toast({ title: 'Copied!' }); }}><Copy className="h-4 w-4"/></Button>
                            </div>
                         </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
