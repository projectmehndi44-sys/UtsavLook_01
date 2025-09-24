
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { Award, BarChart, CalendarCheck, IndianRupee, Sparkles, UserPlus, Share2, Loader2, Palette, Copy, Download, FolderDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';
import { getBenefitImages } from '@/lib/services';
import type { BenefitImage, Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import JSZip from 'jszip';


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

    const copyShareText = () => {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({ title: 'Promotional text copied to clipboard!' });
    };

    const handleShare = async () => {
        if (shareableCardRefs.current.length === 0) return;
        setIsSharing(true);
        copyShareText();
        
        try {
             const imagePromises = shareableCardRefs.current.map((ref, index) => {
                if (!ref) return Promise.resolve(null);
                return toPng(ref, { 
                    quality: 0.95,
                    pixelRatio: 2,
                }).then(dataUrl => ({ dataUrl, name: `utsavlook-benefit-${benefits[index].id.replace(/\s+/g, '-')}.png` }));
            });

            const imageData = await Promise.all(imagePromises);
            
            const zip = new JSZip();
            imageData.forEach(img => {
                if (img) {
                    // Remove the data URI prefix before adding to zip
                    zip.file(img.name, img.dataUrl.split(',')[1], { base64: true });
                }
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            // Create a link and trigger download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'UtsavLook_Benefits.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
                title: 'Download Started!',
                description: 'A .zip file with all benefit images is being downloaded. The promotional text has been copied to your clipboard.',
                duration: 9000,
            });


        } catch (err) {
            console.error(err);
            toast({
                title: 'Oops!',
                description: 'Could not create shareable images. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSharing(false);
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
                            {isSharing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FolderDown className="mr-2 h-5 w-5" />}
                            {isSharing ? 'Generating Assets...' : 'Download Shareable Assets'}
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
                            width: 1080,
                            height: 1080,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '40px',
                            fontFamily: 'Roboto, sans-serif',
                            color: 'white',
                            position: 'relative'
                        }}
                    >
                         <img src={benefit.imageUrl} alt={benefit.title} crossOrigin='anonymous' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
                         <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)', zIndex: 1 }} />
                         
                         <div style={{ zIndex: 2, fontFamily: "'Playfair Display', serif", fontSize: '48px', fontWeight: 'bold' }}>
                            <span style={{ color: 'hsl(35 80% 55%)' }}>Utsav</span><span style={{ color: 'hsl(25 80% 40%)' }}>Look</span>
                         </div>

                         <div style={{ zIndex: 2 }}>
                            <p style={{ fontSize: '64px', fontWeight: 'bold', lineHeight: 1.2, textShadow: '2px 2px 8px rgba(0,0,0,0.9)', margin: 0 }}>{benefit.title}</p>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
