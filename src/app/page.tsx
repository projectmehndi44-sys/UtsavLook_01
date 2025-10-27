

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
import Autoplay from "embla-carousel-autoplay"
import Image from 'next/image';
import { Packages } from '@/components/utsavlook/Packages';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout';
import { ServiceSelectionModal } from '@/components/utsavlook/ServiceSelectionModal';
import { MehndiIcon, MakeupIcon, PhotographyIcon } from '@/components/icons';
import { PwaInstallBanner } from '@/components/utsavlook/PwaInstallBanner';
import { StyleMatch } from '@/components/utsavlook/StyleMatch';
import { ArtistProfileModal } from '@/components/utsavlook/ArtistProfileModal';

const occasionWords = [
  "Wedding", 
  "Birthday", 
  "Puja", 
  "Sangeet", 
  "Festival", 
  "Reception", 
  "Party",
  "Engagement",
  "Anniversary",
  "Baby Shower",
  "Haldi",
  "Mehendi"
];

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
  const [heroSlideshowImages, setHeroSlideshowImages] = React.useState<ImagePlaceholder[]>([]);
  const [heroSettings, setHeroSettings] = React.useState<HeroSettings>({ slideshowText: ''});
  
  const [currentOccasion, setCurrentOccasion] = React.useState(occasionWords[0]);
  const [animationKey, setAnimationKey] = React.useState(0);


  const { toast } = useToast();
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOccasion(prev => {
        const currentIndex = occasionWords.indexOf(prev);
        const nextIndex = (currentIndex + 1) % occasionWords.length;
        return occasionWords[nextIndex];
      });
      setAnimationKey(prev => prev + 1); // Reset animation
    }, 3000); // Change word every 3 seconds

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
        setHeroSlideshowImages(images.filter(img => img.id.startsWith('hero-slideshow')));
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
         <div className="w-full pt-8 md:pt-12">
            <div className="group relative bg-card shadow-lg transition-shadow hover:shadow-2xl mx-4 md:mx-8 rounded-xl">
                <div className="grid md:grid-cols-10 gap-4">
                    {/* Left Box: Text */}
                    <div className="flex flex-col justify-center p-6 text-center md:text-left md:col-span-4">
                         <div className="mb-4">
                            <h1 className="font-headline text-5xl font-bold text-accent md:text-7xl">
                                Utsav<span className="text-primary">Look</span>
                            </h1>
                            <p className="mt-2 font-dancing-script text-2xl text-foreground/90 md:text-3xl">Your Perfect Look for Every Utsav.</p>
                        </div>
                        
                        <div className="mt-6 text-2xl md:text-3xl font-bold text-foreground/80">
                            Crafting Memories for Your
                            <div key={animationKey} className="animated-gradient-text fade-in-out text-5xl md:text-6xl">
                                {currentOccasion}
                            </div>
                            <p className="text-lg font-light text-muted-foreground mt-1">with UtsavLook</p>
                        </div>
                        
                        <div className="mt-6 font-body text-base text-foreground/80 max-w-xl mx-auto md:mx-0">
                          <p>Get your perfect UtsavLook by booking top-rated Mehendi, Makeup, and Photography artists, all verified professionals dedicated to making your special day unforgettable.</p>
                        </div>
                    </div>
                    {/* Right Box: Slideshow */}
                    <div className="relative aspect-square md:aspect-auto rounded-lg overflow-hidden md:col-span-6">
                        <Carousel
                            opts={{ align: "start", loop: true }}
                            plugins={[ Autoplay({ delay: 4000 }) ]}
                            className="w-full h-full"
                        >
                            <CarouselContent>
                                {heroSlideshowImages.length > 0 ? heroSlideshowImages.map((image, index) => (
                                    <CarouselItem key={index}>
                                        <Image src={image.imageUrl} alt={image.description} fill className="object-cover" data-ai-hint={image.imageHint} />
                                    </CarouselItem>
                                )) : (
                                    <CarouselItem>
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <p>Images coming soon</p>
                                        </div>
                                    </CarouselItem>
                                )}
                            </CarouselContent>
                        </Carousel>
                        {heroSettings.slideshowText && (
                            <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-3 rounded-lg text-center backdrop-blur-sm">
                                <p className="font-semibold text-lg">{heroSettings.slideshowText}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
         </div>


        {isCustomerLoggedIn && (
            <div id="style-match" className="py-8 px-4 md:px-8">
                <StyleMatch />
            </div>
        )}

        <div className="mt-8 w-full">
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

        <div className="py-12">
            <h2 className="text-center font-headline text-5xl text-primary">Our Works</h2>
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 3000,
                    }),
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
