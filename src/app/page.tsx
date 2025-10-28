
'use client';

import * as React from 'react';
import type { Artist, Customer, CartItem, MasterServicePackage, ImagePlaceholder, HeroSettings } from '@/lib/types';
import { getCustomer, getPlaceholderImages, getHeroSettings, listenToCollection } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/utsavlook/Header';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import Link from 'next/link';
import { Packages } from '@/components/utsavlook/Packages';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout';
import { ServiceSelectionModal } from '@/components/utsavlook/ServiceSelectionModal';
import { MehndiIcon, MakeupIcon, PhotographyIcon } from '@/components/icons';
import { PwaInstallBanner } from '@/components/utsavlook/PwaInstallBanner';
import { StyleMatch } from '@/components/utsavlook/StyleMatch';
import { ArtistProfileModal } from '@/components/utsavlook/ArtistProfileModal';
import { occasionImages, type OccasionImage } from '@/lib/occasion-images';
import { ArtistCard } from '@/components/utsavlook/ArtistCard';
import Autoplay from "embla-carousel-autoplay";

const occasionWords = occasionImages.map(img => img.occasion);

export default function Home() {
  const router = useRouter();
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
  
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [cart, setCart] = React.useState<CartItem[]>([]);

  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<MasterServicePackage | null>(null);

  const [isArtistModalOpen, setIsArtistModalOpen] = React.useState(false);
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);
  
  const [galleryImages, setGalleryImages] = React.useState<ImagePlaceholder[]>([]);
  const [heroSettings, setHeroSettings] = React.useState<HeroSettings>({ slideshowText: ''});
  
  const [currentOccasionIndex, setCurrentOccasionIndex] = React.useState(0);
  const [animationKey, setAnimationKey] = React.useState(0);

  const { toast } = useToast();
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOccasionIndex(prev => (prev + 1) % occasionWords.length);
      setAnimationKey(prev => prev + 1); // Reset animation
    }, 5000); // Change word every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleCustomerLogout = React.useCallback(() => {
    setIsCustomerLoggedIn(false);
    setCustomer(null);
    setCart([]);
    localStorage.removeItem('currentCustomerId');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  }, [toast]);
  
  useInactivityTimeout(isCustomerLoggedIn ? handleCustomerLogout : () => {});

  const checkLoggedInCustomer = React.useCallback(async () => {
    const customerId = localStorage.getItem('currentCustomerId');
    if (customerId) {
        const currentCustomer = await getCustomer(customerId);
        if (currentCustomer) {
            setIsCustomerLoggedIn(true);
            setCustomer(currentCustomer);
            const storedCart = localStorage.getItem(`cart_${customerId}`);
            setCart(storedCart ? JSON.parse(storedCart) : []);
        } else {
             handleCustomerLogout();
        }
    } else {
        setIsCustomerLoggedIn(false);
        setCustomer(null);
        setCart([]);
    }
  }, [handleCustomerLogout]);

  React.useEffect(() => {
    checkLoggedInCustomer();

    const unsubscribeArtists = listenToCollection<Artist>('artists', setArtists);
    const unsubscribePackages = listenToCollection<MasterServicePackage>('masterServices', (services) => {
        const updatedServices = services.map(service => ({
            ...service,
            image: service.image || `https://picsum.photos/seed/${service.id}/400/300`,
            categories: service.categories.map(cat => ({
                ...cat,
                image: cat.image || `https://picsum.photos/seed/${service.id}-${cat.name}/200/200`
            }))
        }));
        setMasterServices(updatedServices);
    });

    getPlaceholderImages().then(images => {
        setGalleryImages(images.filter(img => img.id.startsWith('our-work')));
    });

    getHeroSettings().then(setHeroSettings);

    return () => {
        unsubscribeArtists();
        unsubscribePackages();
    };
  }, [checkLoggedInCustomer]);
  
  const handleAddToCart = (item: Omit<CartItem, 'id'>) => {
    if (!isCustomerLoggedIn || !customer) {
        localStorage.setItem('tempCartItem', JSON.stringify(item));
        router.push('/login');
        toast({ 
            title: 'Please Login to Continue', 
            description: 'Your selection will be waiting for you after you log in.' 
        });
        return;
    }
    const newCartItem: CartItem = { ...item, id: `${item.servicePackage.id}-${Date.now()}` };
    const newCart = [...cart, newCartItem];
    setCart(newCart);
    localStorage.setItem(`cart_${customer.id}`, JSON.stringify(newCart));
    toast({ title: 'Added to cart!', description: `${item.servicePackage.name} (${item.selectedTier.name}) has been added.`});
  };
  
  const CategoryTabContent = ({ serviceType }: { serviceType: "mehndi" | "makeup" | "photography" }) => {
    const relevantPackages = masterServices.filter(p => p.service === serviceType);
    
    return (
      <div className="space-y-8 mt-8 px-4 md:px-8">
        <Packages packages={relevantPackages} onServiceSelect={(service) => { setSelectedService(service); setIsServiceModalOpen(true); }} />
      </div>
    );
  }

  const handleScrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen w-full flex-col relative bg-background">
      <div id="recaptcha-container" style={{ position: 'absolute', bottom: 0, right: 0, zIndex: -1 }}></div>
      
      <Header 
        isCustomerLoggedIn={isCustomerLoggedIn}
        onCustomerLogout={handleCustomerLogout}
        customer={customer}
        cartCount={cart.length}
      />
      <main className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="w-full">
            <div className="group relative rounded-b-2xl overflow-hidden">
                <div className="absolute inset-0 w-full h-full">
                    {occasionImages.map((item, index) => (
                        <Image 
                            key={item.imageUrl}
                            src={item.imageUrl} 
                            alt={item.occasion} 
                            fill 
                            className={cn(
                                "object-cover transition-opacity duration-1000 group-hover:scale-105 transform-gpu duration-500",
                                index === currentOccasionIndex ? "opacity-100" : "opacity-0"
                            )}
                            priority={index === 0}
                        />
                    ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>

                 <div className="relative flex flex-col justify-center p-6 md:p-10 text-center md:text-left min-h-[500px] md:min-h-[600px] md:w-3/5 lg:w-1/2">
                    <div className="space-y-2">
                    <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-bold text-accent">
                        Utsav<span className="text-primary">Look</span>
                    </h1>
                    <p className="font-dancing-script text-2xl md:text-3xl">Your Perfect Look for Every Utsav.</p>
                    </div>
                    
                    <div className="mt-4">
                        <div className="whitespace-nowrap text-2xl font-bold md:text-3xl">Crafting Memories for Your</div>
                        <div key={animationKey} className="animated-gradient-text fade-in-out text-5xl font-bold md:text-6xl">
                            {occasionWords[currentOccasionIndex]}
                        </div>
                    </div>
                    
                    <div className="mt-4 max-w-xl font-body text-base">
                       <p>Book top-rated, verified artists for your special day.</p>
                    </div>

                     <div className="mt-6 flex flex-row gap-4 justify-center md:justify-start">
                        <Button size="lg" className="btn-gradient rounded-full" onClick={() => handleScrollTo('services')}>
                            Book a Service
                        </Button>
                         <Button size="lg" className="btn-gradient rounded-full" onClick={() => handleScrollTo('artists')}>
                            View Artists
                        </Button>
                    </div>
                    <div className="mt-8 text-center md:text-left">
                        <Link href="/artist" className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary-foreground backdrop-blur-sm hover:bg-primary/20 transition-colors">
                            <span className="text-sm text-primary font-semibold">Are you an artist? <span className="font-bold underline">Join Us!</span></span>
                        </Link>
                    </div>
                </div>
            </div>
         </div>


        {isCustomerLoggedIn && (
            <div id="style-match" className="py-8 px-4 md:px-8">
                <StyleMatch />
            </div>
        )}

        <div id="services" className="mt-8 w-full">
            <h2 className="text-center font-headline text-5xl text-primary mb-8">Our Services</h2>
            <Tabs defaultValue="mehndi" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-xl mx-auto h-auto text-base sm:text-lg py-3">
                    <TabsTrigger value="mehndi" className="py-2.5 flex items-center gap-2"><MehndiIcon className="h-5 w-5"/>Mehndi</TabsTrigger>
                    <TabsTrigger value="makeup" className="py-2.5 flex items-center gap-2"><MakeupIcon className="h-5 w-5"/>Makeup</TabsTrigger>
                    <TabsTrigger value="photography" className="py-2.5 flex items-center gap-2"><PhotographyIcon className="h-5 w-5" />Photography</TabsTrigger>
                </TabsList>
                <TabsContent value="mehndi">
                    <CategoryTabContent serviceType="mehndi" />
                </TabsContent>
                <TabsContent value="makeup">
                    <CategoryTabContent serviceType="makeup" />
                </TabsContent>
                <TabsContent value="photography">
                    <CategoryTabContent serviceType="photography" />
                </TabsContent>
            </Tabs>
        </div>
        
        <Separator className="my-8"/>
        
        <div id="artists" className="py-12 px-4 md:px-8">
            <h2 className="text-center font-headline text-5xl text-primary mb-8">Meet Our Artists</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {artists.map(artist => (
                    <ArtistCard key={artist.id} artist={artist} onViewProfile={(artist) => { setSelectedArtist(artist); setIsArtistModalOpen(true); }} />
                ))}
            </div>
        </div>

        <Separator className="my-8"/>

        <div className="py-12">
            <h2 className="text-center font-headline text-5xl text-primary">Our Works</h2>
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 5000,
                    })
                ]}
                className="w-full"
            >
                <CarouselContent>
                    {galleryImages.map((image, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                                <Card className="overflow-hidden">
                                    <CardContent className="flex aspect-video items-center justify-center p-0">
                                        <Image 
                                            src={image.imageUrl} 
                                            alt={image.description}
                                            width={600}
                                            height={400}
                                            className="w-full h-full object-cover"
                                            data-ai-hint={image.imageHint}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>

        <PwaInstallBanner />

        {selectedService && (
            <ServiceSelectionModal
                isOpen={isServiceModalOpen}
                onOpenChange={setIsServiceModalOpen}
                service={selectedService}
                artists={artists}
                onAddToCart={handleAddToCart}
            />
        )}
        {selectedArtist && (
            <ArtistProfileModal 
                artist={selectedArtist}
                isOpen={isArtistModalOpen}
                onOpenChange={setIsArtistModalOpen}
            />
        )}
      </main>
    </div>
  );
}
