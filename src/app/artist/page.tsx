
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { Award, BarChart, CalendarCheck, IndianRupee, Sparkles, UserPlus, Share2, Loader2, Palette, Copy, Download, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getBenefitImages } from '@/lib/services';
import type { BenefitImage, Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Facebook, Instagram, Send, Bot } from 'lucide-react'; 
import { fetchArtistBenefitsPromoImage } from '../actions';

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

const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
    }
});


export default function ArtistHomePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSharing, setIsSharing] = React.useState(false);
    const [shareableCompositeImage, setShareableCompositeImage] = React.useState<string | null>(null);
    const [benefits, setBenefits] = React.useState<BenefitImage[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isGenerating, setIsGenerating] = React.useState(false);
    

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

    const generateCompositeImage = async (): Promise<string | null> => {
       const benefitsHtml = benefits.map((benefit, index) => `
            <div style="display: flex; align-items: flex-start; gap: 1rem; opacity: 0; animation: fadeIn 0.5s ease forwards; animation-delay: ${0.2 + index * 0.1}s;">
                <div style="flex-shrink: 0; padding: 0.75rem; background-color: rgba(139, 69, 19, 0.1); border-radius: 9999px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B4513" stroke-width="1.5">
                       ${benefitIcons[benefit.id] || ''}
                    </svg>
                </div>
                <div>
                    <h3 style="font-size: 1.125rem; font-weight: 600; color: #8B4513; margin: 0 0 0.25rem;">${escapeXml(benefit.title)}</h3>
                    <p style="font-size: 0.875rem; color: #57534e; margin: 0;">${escapeXml(benefit.description)}</p>
                </div>
            </div>
        `).join('');

        const svg = `
            <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&amp;family=Roboto:wght@400;600&amp;display=swap');
                    .container { font-family: 'Roboto', sans-serif; background-color: #F5F5DC; }
                    .headline { font-family: 'Playfair Display', serif; font-size: 80px; color: #8B4513; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                </style>
                <foreignObject width="1080" height="1080">
                    <div xmlns="http://www.w3.org/1999/xhtml" class="container" style="width: 1080px; height: 1080px; padding: 60px; display: flex; flex-direction: column; justify-content: center; gap: 2rem;">
                        <div style="text-align: center; opacity: 0; animation: fadeIn 0.5s ease forwards;">
                            <h1 class="headline">Why Artists Love UtsavLook</h1>
                            <p style="font-family: 'Dancing Script', cursive; font-size: 32px; color: #CD7F32; margin-top: -10px;">Your Partner in Growth</p>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-top: 2rem;">
                           ${benefitsHtml}
                        </div>
                    </div>
                </foreignObject>
            </svg>
        `;

        return new Promise((resolve) => {
            const img = new window.Image();
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            
            img.onerror = () => resolve(null);

            img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
        });
    };


    const handleShareClick = async () => {
        setIsSharing(true);
        setIsGenerating(true);
        const imageUrl = await generateCompositeImage();
        setIsGenerating(false);
        if (imageUrl) {
            setShareableCompositeImage(imageUrl);
        } else {
            toast({ title: 'Image generation failed', variant: 'destructive' });
            setIsSharing(false); // Close dialog if image generation fails
        }
    };
    
    const handleCloseDialog = () => {
        setIsSharing(false);
        setShareableCompositeImage(null);
    };

    const handleDownload = () => {
        if (!shareableCompositeImage) return;
        const link = document.createElement('a');
        link.download = `utsavlook-benefits.png`;
        link.href = shareableCompositeImage;
        link.click();
    };

    const shareToSocial = (platform: 'facebook' | 'whatsapp') => {
        const encodedText = encodeURIComponent(shareText);
        let url = '';
        if (platform === 'facebook') {
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`;
        } else if (platform === 'whatsapp') {
            url = `https://api.whatsapp.com/send?text=${encodedText}`;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };
    
     const shareToInstagram = () => {
        navigator.clipboard.writeText(shareText);
        toast({
            title: 'Text Copied!',
            description: 'Download the image, then paste the copied text into your Instagram post.',
            duration: 8000
        });
        handleDownload();
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
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Share Your UtsavLook Benefits</DialogTitle>
                        <DialogDescription>Your dynamically generated graphic is ready. Share it to your favorite platforms or download it.</DialogDescription>
                    </DialogHeader>
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-96">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="mt-4 text-muted-foreground">Generating your shareable image...</p>
                        </div>
                    ) : shareableCompositeImage && (
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <Image src={shareableCompositeImage} alt="UtsavLook Artist Benefits" width={1080} height={1080} className="rounded-lg border w-full"/>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Share to:</h3>
                                    <div className="flex gap-2">
                                        <Button onClick={() => shareToSocial('whatsapp')} variant="outline" className="flex-1 gap-2"><WhatsAppIcon className="w-5 h-5 fill-green-600"/> WhatsApp</Button>
                                        <Button onClick={() => shareToSocial('facebook')} variant="outline" className="flex-1 gap-2"><Facebook className="w-5 h-5 fill-blue-600"/> Facebook</Button>
                                        <Button onClick={shareToInstagram} variant="outline" className="flex-1 gap-2"><Instagram className="w-5 h-5 text-rose-600"/> Instagram</Button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Promotional Text:</h3>
                                    <div className="relative">
                                       <Textarea value={shareText} readOnly className="pr-10 h-32"/>
                                       <Button size="icon" variant="ghost" className="absolute right-2 top-2 h-8 w-8" onClick={() => { navigator.clipboard.writeText(shareText); toast({ title: 'Copied!' }); }}><Copy className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                <Button onClick={handleDownload} variant="secondary" className="w-full"><Download className="mr-2"/> Download Image</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
