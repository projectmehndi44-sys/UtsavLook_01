
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { Award, BarChart, CalendarCheck, IndianRupee, Sparkles, UserPlus, Share2, Loader2, Palette, Copy, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';
import { getBenefitImages } from '@/lib/services';
import type { BenefitImage, Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';

// Custom component for social share icons to keep JSX clean
const SocialIcons = {
    WhatsApp: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.75,7.82c-1.39-1.39-3.26-2.18-5.25-2.18c-4.13,0-7.5,3.37-7.5,7.5c0,1.36,0.36,2.64,1.03,3.75L4,20l3.03-1.01c1.08,0.6,2.3,0.93,3.59,0.93h0.01c4.13,0,7.5-3.37,7.5-7.5C18.93,11.08,18.14,9.21,16.75,7.82z M11.5,19.3c-1.12,0-2.2-0.31-3.12-0.87l-0.22-0.13l-2.33,0.77l0.79-2.27l-0.14-0.23c-0.61-1-0.98-2.17-0.98-3.43c0-3.31,2.69-6,6-6c1.61,0,3.09,0.63,4.2,1.76c1.12,1.12,1.76,2.59,1.76,4.2C17.5,16.61,14.81,19.3,11.5,19.3z M15.34,13.25c-0.23-0.12-1.35-0.66-1.56-0.74c-0.21-0.08-0.36-0.12-0.51,0.12c-0.15,0.23-0.59,0.74-0.72,0.88c-0.13,0.15-0.27,0.16-0.5,0.04c-0.23-0.12-0.96-0.35-1.83-1.12c-0.68-0.59-1.14-1.33-1.27-1.56c-0.13-0.23-0.01-0.36,0.1-0.48c0.1-0.11,0.23-0.28,0.34-0.42c0.12-0.15,0.15-0.25,0.23-0.42c0.08-0.17,0.04-0.31-0.02-0.43c-0.06-0.12-0.51-1.22-0.7-1.67c-0.18-0.44-0.37-0.38-0.51-0.39c-0.13-0.01-0.28-0.01-0.43-0.01c-0.15,0-0.39,0.06-0.6,0.3c-0.2,0.25-0.78,0.76-0.78,1.85c0,1.09,0.8,2.14,0.91,2.3c0.12,0.15,1.57,2.4,3.79,3.35c0.53,0.23,0.94,0.36,1.27,0.46c0.55,0.17,1.05,0.14,1.44,0.09c0.44-0.06,1.35-0.55,1.54-1.07c0.19-0.52,0.19-0.97,0.13-1.07C15.7,13.4,15.57,13.37,15.34,13.25z"/></svg>,
    Instagram: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.148-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z"/></svg>,
    Facebook: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"/></svg>,
};


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
    const shareableCardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const [isSharing, setIsSharing] = React.useState(false);
    const [benefits, setBenefits] = React.useState<BenefitImage[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [generatedImages, setGeneratedImages] = React.useState<string[]>([]);
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
    const [carouselApi, setCarouselApi] = React.useState<CarouselApi>()
    const [currentSlide, setCurrentSlide] = React.useState(0);


    // These states are added for header compatibility, but the main logic is for non-logged-in artists.
    const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [cartCount, setCartCount] = React.useState(0);
    
    React.useEffect(() => {
        setIsLoading(true);
        getBenefitImages().then(data => {
            setBenefits(data);
            shareableCardRefs.current = shareableCardRefs.current.slice(0, data.length);
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            setIsLoading(false);
        });
    }, []);

    const shareText = "Join UtsavLook and grow your artistry business! We give you the tools to succeed. #UtsavLookArtist #MehndiArtist #MakeupArtist #ArtistPlatform";
    const shareUrl = "https://utsavlook.com/artist";

    const handleShare = async () => {
        if (shareableCardRefs.current.length === 0) return;
        setIsSharing(true);
        setIsShareModalOpen(true);
        setGeneratedImages([]);

        try {
             const imagePromises = shareableCardRefs.current.map(ref => {
                if (!ref) return Promise.resolve(null);
                return toPng(ref, { 
                    quality: 0.95,
                    pixelRatio: 2,
                    style: {
                       fontFamily: "'Roboto', sans-serif" 
                    }
                });
            });

            const dataUrls = await Promise.all(imagePromises);
            setGeneratedImages(dataUrls.filter((url): url is string => url !== null));
        } catch (err) {
            console.error(err);
            toast({
                title: 'Oops!',
                description: 'Could not create shareable images. Please try again.',
                variant: 'destructive',
            });
            setIsShareModalOpen(false);
        } finally {
            setIsSharing(false);
        }
    };
    
    const handleDownload = () => {
        if (generatedImages.length === 0) return;
        const link = document.createElement('a');
        link.download = `utsavlook-benefit-${currentSlide}.png`;
        link.href = generatedImages[currentSlide];
        link.click();
    };

    const handleSocialShare = (platform: 'whatsapp' | 'instagram' | 'facebook') => {
        if (platform === 'instagram') {
            copyShareText();
            toast({
                title: 'Text Copied!',
                description: 'Download the image and paste the text in your Instagram post.',
            });
            return;
        }

        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(shareUrl);
        let url = '';

        switch(platform) {
            case 'whatsapp':
                url = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
                break;
        }
        window.open(url, '_blank');
    };

    const copyShareText = () => {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({ title: 'Copied to clipboard!' });
    };
    
      React.useEffect(() => {
        if (!carouselApi) return;
        
        const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
        carouselApi.on("select", onSelect);
        
        return () => { carouselApi.off("select", onSelect) };
      }, [carouselApi]);


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
                        <Button size="lg" onClick={handleShare} disabled={isSharing || isLoading}>
                            {isSharing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Share2 className="mr-2 h-5 w-5" />}
                            {isSharing ? 'Generating Images...' : 'Share The Benefits'}
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
            
            {/* Hidden div for html-to-image */}
             <div className="absolute -left-[9999px] top-0">
                {benefits.map((benefit, index) => (
                    <div
                        key={benefit.id}
                        ref={el => shareableCardRefs.current[index] = el}
                        style={{
                            width: 600,
                            height: 600,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '30px',
                            backgroundImage: `url(${benefit.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            fontFamily: "'Roboto', sans-serif",
                            color: 'white',
                            position: 'relative'
                        }}
                    >
                         <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)' }} />
                         
                         <div style={{ zIndex: 1, fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: 'bold' }}>
                            <span style={{ color: 'hsl(var(--accent))' }}>Utsav</span><span style={{ color: 'hsl(var(--primary))' }}>Look</span>
                         </div>

                         <div style={{ zIndex: 1 }}>
                            <p style={{ fontSize: '36px', fontWeight: 'bold', lineHeight: 1.2, textShadow: '2px 2px 6px rgba(0,0,0,0.8)', margin: '8px 0 0 0' }}>{benefit.title}</p>
                         </div>
                    </div>
                ))}
            </div>


            <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Share the UtsavLook Benefits</DialogTitle>
                        <DialogDescription>
                            Your professional shareable cards are ready. Choose one to download or share directly to your favorite platforms.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-center py-4">
                        {(isSharing || generatedImages.length === 0) ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-8">
                                <Loader2 className="w-10 h-10 text-primary animate-spin"/>
                                <p className="text-muted-foreground">Generating your professional images...</p>
                            </div>
                        ) : (
                             <Carousel setApi={setCarouselApi} className="w-full max-w-sm mx-auto">
                                <CarouselContent>
                                    {generatedImages.map((imgSrc, index) => (
                                    <CarouselItem key={index}>
                                        <Image src={imgSrc} alt={`Shareable benefit ${index + 1}`} width={400} height={400} className="rounded-lg border shadow-lg mx-auto"/>
                                    </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                            </Carousel>
                        )}
                    </div>
                    <DialogFooter className="sm:flex-col sm:gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={handleDownload} disabled={isSharing || generatedImages.length === 0}><Download className="mr-2"/> Download</Button>
                            <Button onClick={copyShareText} variant="outline"><Copy className="mr-2"/> Copy Text</Button>
                        </div>
                        <div className="flex justify-around items-center pt-2">
                            <Button variant="ghost" size="icon" onClick={() => handleSocialShare('whatsapp')} className="text-green-500 hover:bg-green-50 hover:text-green-600"><SocialIcons.WhatsApp/></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleSocialShare('instagram')} className="text-pink-500 hover:bg-pink-50 hover:text-pink-600"><SocialIcons.Instagram/></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleSocialShare('facebook')} className="text-blue-800 hover:bg-blue-50 hover:text-blue-900"><SocialIcons.Facebook/></Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

    