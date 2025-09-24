

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Custom component for social share icons to keep JSX clean
const SocialIcons = {
    WhatsApp: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.75,7.82c-1.39-1.39-3.26-2.18-5.25-2.18c-4.13,0-7.5,3.37-7.5,7.5c0,1.36,0.36,2.64,1.03,3.75L4,20l3.03-1.01c1.08,0.6,2.3,0.93,3.59,0.93h0.01c4.13,0,7.5-3.37,7.5-7.5C18.93,11.08,18.14,9.21,16.75,7.82z M11.5,19.3c-1.12,0-2.2-0.31-3.12-0.87l-0.22-0.13l-2.33,0.77l0.79-2.27l-0.14-0.23c-0.61-1-0.98-2.17-0.98-3.43c0-3.31,2.69-6,6-6c1.61,0,3.09,0.63,4.2,1.76c1.12,1.12,1.76,2.59,1.76,4.2C17.5,16.61,14.81,19.3,11.5,19.3z M15.34,13.25c-0.23-0.12-1.35-0.66-1.56-0.74c-0.21-0.08-0.36-0.12-0.51,0.12c-0.15,0.23-0.59,0.74-0.72,0.88c-0.13,0.15-0.27,0.16-0.5,0.04c-0.23-0.12-0.96-0.35-1.83-1.12c-0.68-0.59-1.14-1.33-1.27-1.56c-0.13-0.23-0.01-0.36,0.1-0.48c0.1-0.11,0.23-0.28,0.34-0.42c0.12-0.15,0.15-0.25,0.23-0.42c0.08-0.17,0.04-0.31-0.02-0.43c-0.06-0.12-0.51-1.22-0.7-1.67c-0.18-0.44-0.37-0.38-0.51-0.39c-0.13-0.01-0.28-0.01-0.43-0.01c-0.15,0-0.39,0.06-0.6,0.3c-0.2,0.25-0.78,0.76-0.78,1.85c0,1.09,0.8,2.14,0.91,2.3c0.12,0.15,1.57,2.4,3.79,3.35c0.53,0.23,0.94,0.36,1.27,0.46c0.55,0.17,1.05,0.14,1.44,0.09c0.44-0.06,1.35-0.55,1.54-1.07c0.19-0.52,0.19-0.97,0.13-1.07C15.7,13.4,15.57,13.37,15.34,13.25z"/></svg>,
    Twitter: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
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
    const shareableRef = React.useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = React.useState(false);
    const [benefits, setBenefits] = React.useState<BenefitImage[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [generatedImage, setGeneratedImage] = React.useState<string | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

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
    const shareUrl = "https://utsavlook.com/artist";

    const handleShare = async () => {
        if (!shareableRef.current) return;
        setIsSharing(true);
        setIsShareModalOpen(true);
        setGeneratedImage(null);

        try {
            const dataUrl = await toPng(shareableRef.current, { 
                quality: 0.95,
                pixelRatio: 2,
            });
            setGeneratedImage(dataUrl);
        } catch (err) {
            console.error(err);
            toast({
                title: 'Oops!',
                description: 'Could not create shareable image. Please try again.',
                variant: 'destructive',
            });
            setIsShareModalOpen(false);
        } finally {
            setIsSharing(false);
        }
    };
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.download = `utsavlook-artist-benefits.png`;
        link.href = generatedImage;
        link.click();
    };

    const handleSocialShare = (platform: 'whatsapp' | 'twitter' | 'facebook') => {
        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(shareUrl);
        let url = '';

        switch(platform) {
            case 'whatsapp':
                url = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
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
            
            {/* Hidden div for html-to-image */}
            <div className="absolute -left-[9999px] top-0">
                 <div ref={shareableRef} style={{ width: 1200, height: 630, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(to bottom right, #fff8f0, #f8f0e8)', fontFamily: 'Roboto, sans-serif' }}>
                    <div style={{ textAlign: 'center', marginBottom: 30 }}>
                        <h2 style={{ fontSize: '56px', fontWeight: 'bold', color: '#8B4513', fontFamily: 'Playfair Display, serif', margin: 0 }}>
                            Why Artists Love UtsavLook
                        </h2>
                         <p style={{ fontSize: '22px', color: '#5D4037', maxWidth: 800, margin: '10px auto 0' }}>
                            A platform designed for your growth, giving you the tools to succeed and the freedom to create.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', perspective: '1000px' }}>
                        {benefits.map((benefit, index) => {
                             const rotationY = (index % 3 - 1) * -10; // -10, 0, 10
                             const rotationX = index < 3 ? 5 : -5;
                            return (
                            <div key={benefit.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #eee', transform: `rotateY(${rotationY}deg) rotateX(${rotationX}deg)`}}>
                                <div style={{ background: 'rgba(139, 69, 19, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '16px', display: 'inline-flex' }}>
                                    {React.cloneElement(benefitIcons[benefit.id as keyof typeof benefitIcons], {style: {width: 32, height: 32, color: '#8B4513'}})}
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#8B4513', marginBottom: '8px', fontFamily: 'Playfair Display, serif' }}>{benefit.title}</h3>
                                <p style={{ fontSize: '14px', color: '#5D4037', lineHeight: 1.5, margin: 0 }}>
                                    {benefit.description}
                                </p>
                            </div>
                        )})}
                    </div>
                </div>
            </div>

            <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Share the UtsavLook Benefits</DialogTitle>
                        <DialogDescription>
                            Your professional shareable image is ready. Download it or share it directly to your favorite platforms.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-center p-4">
                        {generatedImage ? (
                            <Image src={generatedImage} alt="Shareable benefits of UtsavLook" width={600} height={315} className="rounded-lg border"/>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-4 py-8">
                                <Loader2 className="w-10 h-10 text-primary animate-spin"/>
                                <p className="text-muted-foreground">Generating your professional image...</p>
                            </div>
                        )}
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleDownload} disabled={!generatedImage}><Download className="mr-2"/> Download</Button>
                        <Button onClick={copyShareText} variant="outline"><Copy className="mr-2"/> Copy Text</Button>
                    </div>
                    <div className="flex justify-around items-center pt-2">
                         <Button variant="ghost" size="icon" onClick={() => handleSocialShare('whatsapp')} className="text-green-500 hover:bg-green-50 hover:text-green-600"><SocialIcons.WhatsApp/></Button>
                         <Button variant="ghost" size="icon" onClick={() => handleSocialShare('twitter')} className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"><SocialIcons.Twitter/></Button>
                         <Button variant="ghost" size="icon" onClick={() => handleSocialShare('facebook')} className="text-blue-800 hover:bg-blue-50 hover:text-blue-900"><SocialIcons.Facebook/></Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}

