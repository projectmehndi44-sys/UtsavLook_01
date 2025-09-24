

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { Award, BarChart, CalendarCheck, IndianRupee, Sparkles, UserPlus, Share2, Loader2, Palette, Copy, Download, FolderDown, Instagram, Facebook } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';
import { getBenefitImages } from '@/lib/services';
import type { BenefitImage, Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';


const benefitIcons: Record<string, JSX.Element> = {
    "Set Your Own Price": <BarChart className="w-8 h-8 text-primary" />,
    "'UtsavLook Verified' Badge": <Award className="w-8 h-8 text-primary" />,
    "Intelligent Scheduling": <CalendarCheck className="w-8 h-8 text-primary" />,
    "Your Own Referral Code": <Sparkles className="w-8 h-8 text-primary" />,
    "Transparent Payouts": <IndianRupee className="w-8 h-8 text-primary" />,
    "0% Commission Welcome": <UserPlus className="w-8 h-8 text-primary" />,
};

const SocialIcons = {
    whatsapp: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.457l-6.354 1.654zm6.838-2.698l.396.235c1.478.882 3.16.136 4.893.136 5.47 0 9.9-4.43 9.9-9.9 0-5.469-4.43-9.9-9.9-9.9s-9.9 4.431-9.9 9.9c0 2.004.604 3.903 1.688 5.586l.235.396-1.07 3.894 3.996-1.044zM12.28 8.92c-.135-.27-.27-.27-.395-.27h-.24c-.12 0-.27.045-.42.225-.15.18-.57.54-.57 1.32 0 .78.585 1.545.66 1.665.075.12.945 1.515 2.31 2.04.315.12.585.195.78.255.3.09.57.075.78-.045.225-.12.945-1.155 1.065-1.395.12-.24.075-.39-.045-.51-.12-.12-.27-.195-.39-.225s-.24-.045-.36 0c-.12.045-.27.135-.39.27-.12.12-.21.225-.3.27s-.165.09-.285 0c-.12-.09-.51-.18-.975-.57-.555-.465-.915-1.035-.96-1.155z"/>
        </svg>
    ),
    facebook: <Facebook/>,
    instagram: <Instagram/>,
};


export default function ArtistHomePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSharing, setIsSharing] = React.useState(false);
    const [shareableCompositeImage, setShareableCompositeImage] = React.useState<string | null>(null);
    const [benefits, setBenefits] = React.useState<BenefitImage[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const compositeCardRef = React.useRef<HTMLDivElement>(null);

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

    const generateCompositeImage = async () => {
      if (!compositeCardRef.current) {
        toast({ title: 'Error generating image', variant: 'destructive' });
        return null;
      }
      try {
        const dataUrl = await toPng(compositeCardRef.current, { quality: 0.95, pixelRatio: 2 });
        return dataUrl;
      } catch (err) {
        console.error("Image generation failed:", err);
        toast({ title: 'Image generation failed', variant: 'destructive' });
        return null;
      }
    };
    
    const handleShareClick = async () => {
        setIsSharing(true);
        const imageUrl = await generateCompositeImage();
        if (imageUrl) {
            setShareableCompositeImage(imageUrl);
        } else {
            setIsSharing(false);
        }
    };

    const handleSocialShare = async (platform: 'whatsapp' | 'facebook' | 'instagram') => {
        if (!shareableCompositeImage) return;

        const blob = await (await fetch(shareableCompositeImage)).blob();
        const file = new File([blob], 'utsavlook-benefits.png', { type: 'image/png' });

        if (platform === 'instagram') {
             navigator.clipboard.writeText(shareText);
             toast({
                title: 'Text Copied & Ready for Instagram!',
                description: 'Download the image, then open Instagram to create your post.',
                duration: 5000,
             });
             return;
        }

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
             try {
                await navigator.share({
                    files: [file],
                    title: 'UtsavLook Artist Benefits',
                    text: shareText,
                });
            } catch (error) {
                console.error('Web Share API error:', error);
                toast({ title: 'Could not share', description: 'Your browser prevented the share dialog from opening.', variant: 'destructive' });
            }
        } else {
             const encodedText = encodeURIComponent(shareText);
             let url = '';
             if (platform === 'whatsapp') {
                 url = `https://api.whatsapp.com/send?text=${encodedText}`;
             } else if (platform === 'facebook') {
                 url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`;
             }
             window.open(url, '_blank');
        }
    };
    
    const handleDownload = () => {
        if (!shareableCompositeImage) return;
        const link = document.createElement('a');
        link.download = `utsavlook-benefits.png`;
        link.href = shareableCompositeImage;
        link.click();
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
                        <Button size="lg" onClick={handleShareClick} disabled={isSharing || isLoading}>
                            {isSharing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Share2 className="mr-2 h-5 w-5" />}
                            {isSharing ? 'Generating...' : 'Share The Benefits'}
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
            
            {/* Hidden div for html-to-image to generate the composite image */}
             <div className="absolute -left-[9999px] top-0">
                <div ref={compositeCardRef} style={{ width: 1200, height: 1200, padding: 40, display: 'flex', flexDirection: 'column', background: 'linear-gradient(to bottom right, hsl(39, 10%, 98%), hsl(39, 10%, 95%))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                       <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '48px' }}>
                           <span style={{ color: 'hsl(var(--accent))' }}>Utsav</span><span style={{ color: 'hsl(var(--primary))' }}>Look</span>
                       </h1>
                        <h2 style={{ fontFamily: 'var(--font-roboto)', fontSize: '32px', color: 'hsl(var(--primary))', fontWeight: 500 }}>Why Artists Love Us</h2>
                    </div>
                     <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '20px' }}>
                        {benefits.map((benefit, index) => (
                             <div key={benefit.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                                <img src={benefit.imageUrl} alt={benefit.title} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)' }}/>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px' }}>
                                    <p style={{ color: 'white', fontFamily: 'var(--font-roboto)', fontSize: '22px', fontWeight: 'bold', lineHeight: 1.2, textShadow: '1px 1px 4px rgba(0,0,0,0.8)', margin: 0 }}>
                                        {benefit.title}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
             {/* Share Dialog */}
            <Dialog open={!!shareableCompositeImage} onOpenChange={handleCloseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Share Your UtsavLook Benefits</DialogTitle>
                        <DialogDescription>Your all-in-one graphic is ready. Share it to your favorite platforms or download it.</DialogDescription>
                    </DialogHeader>
                    {shareableCompositeImage && (
                        <Image src={shareableCompositeImage} alt="UtsavLook Artist Benefits" width={1200} height={1200} className="rounded-lg border"/>
                    )}
                    <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                         <div className="flex-grow grid grid-cols-3 gap-2">
                             <Button onClick={() => handleSocialShare('whatsapp')} variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                                {SocialIcons.whatsapp} <span className="ml-2">WhatsApp</span>
                             </Button>
                             <Button onClick={() => handleSocialShare('facebook')} variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                                {SocialIcons.facebook} <span className="ml-2">Facebook</span>
                             </Button>
                             <Button onClick={() => handleSocialShare('instagram')} variant="outline" size="sm" className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200">
                                {SocialIcons.instagram} <span className="ml-2">Instagram</span>
                             </Button>
                         </div>
                         <div className="flex items-center gap-2">
                             <Button onClick={handleDownload} variant="outline" size="icon" aria-label="Download Image"><Download/></Button>
                             <div className="relative flex-grow">
                                <Input value={shareText} readOnly className="pr-10 h-10"/>
                                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => { navigator.clipboard.writeText(shareText); toast({ title: 'Copied!' }); }}><Copy className="h-4 w-4"/></Button>
                             </div>
                         </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
