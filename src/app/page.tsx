
'use client';

import * as React from 'react';
import type { Artist, Customer, CartItem, MasterServicePackage, ImagePlaceholder } from '@/lib/types';
import { getCustomer, getPlaceholderImages, listenToCollection } from '@/lib/services';
import { setupRecaptcha } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  LogIn,
  UserPlus,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/utsavlook/Header';
import { CustomerLoginModal } from '@/components/utsavlook/CustomerLoginModal';
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

export default function Home() {
  const router = useRouter();
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
  
  const [isCustomerLoginModalOpen, setIsCustomerLoginModalOpen] = React.useState(false);
  
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [cart, setCart] = React.useState<CartItem[]>([]);

  // State for the service selection modal
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<MasterServicePackage | null>(null);

  const [isArtistModalOpen, setIsArtistModalOpen] = React.useState(false);
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);
  
  const [galleryImages, setGalleryImages] = React.useState<ImagePlaceholder[]>([]);
  const [backgroundImages, setBackgroundImages] = React.useState<ImagePlaceholder[]>([]);


  const { toast } = useToast();

  const [currentBgIndex, setCurrentBgIndex] = React.useState(0);
  
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
             // Clean up if customer ID is invalid
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
        // Replace placeholder images with actual images from data
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
        setBackgroundImages(images.filter(img => img.id.startsWith('hero-background')));
    });


    const intervalId = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % (backgroundImages.length || 1));
    }, 5000); 


    return () => {
        clearInterval(intervalId);
        unsubscribeArtists();
        unsubscribePackages();
    };
  }, [checkLoggedInCustomer, backgroundImages.length]);
  
  const handleAddToCart = (item: Omit<CartItem, 'id'>) => {
    if (!isCustomerLoggedIn || !customer) {
        setIsCustomerLoginModalOpen(true);
        toast({ title: 'Please Login', description: 'You need to be logged in to add services to your booking.' });
        return;
    }
    const newCartItem: CartItem = { ...item, id: `${item.servicePackage.id}-${Date.now()}` };
    const newCart = [...cart, newCartItem];
    setCart(newCart);
    localStorage.setItem(`cart_${customer.id}`, JSON.stringify(newCart));
    toast({ title: 'Added to cart!', description: `${item.servicePackage.name} (${item.selectedTier.name}) has been added.`});
  };
  
  const onSuccessfulLogin = (loggedInCustomer: Customer) => {
    setIsCustomerLoggedIn(true);
    setCustomer(loggedInCustomer);
    setIsCustomerLoginModalOpen(false);
    const storedCart = localStorage.getItem(`cart_${loggedInCustomer.id}`);
    setCart(storedCart ? JSON.parse(storedCart) : []);
    setTimeout(() => {
        toast({
            title: 'Login Successful',
            description: `Welcome back, ${loggedInCustomer.name}!`,
        });
    }, 0);
  }

  const CategoryTabContent = ({ serviceType }: { serviceType: "mehndi" | "makeup" | "photography" }) => {
    const relevantPackages = masterServices.filter(p => p.service === serviceType);
    
    return (
      <div className="space-y-8 mt-8">
        <Packages packages={relevantPackages} onServiceSelect={(service) => { setSelectedService(service); setIsServiceModalOpen(true); }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col relative bg-background">
      <div className="fixed inset-0 -z-10 h-full w-full">
          {backgroundImages.map((image, index) => (
              <Image
                  key={image.id}
                  src={image.imageUrl}
                  alt={image.description}
                  fill
                  className={cn(
                      'object-cover transition-opacity duration-1000 ease-in-out',
                      index === currentBgIndex ? 'opacity-20' : 'opacity-0'
                  )}
                  priority={index === 0}
                  data-ai-hint={image.imageHint}
              />
          ))}
      </div>
      <Header 
        isCustomerLoggedIn={isCustomerLoggedIn}
        onCustomerLogout={handleCustomerLogout}
        customer={customer}
        cartCount={cart.length}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="text-center py-8">
            <h1 className="font-headline text-5xl font-bold text-accent md:text-7xl">
                Utsav<span className="text-primary">Look</span>
            </h1>
            <p className="mt-2 font-dancing-script text-2xl text-foreground/90">Your Perfect Look for Every Utsav.</p>
            <div className="mt-4 font-body text-lg text-foreground/80 max-w-3xl mx-auto">
              <p>Get your perfect UtsavLook by booking top-rated Mehendi, Makeup, and Photography artists,</p>
              <p>all verified professionals dedicated to making your special day unforgettable.</p>
            </div>
        </div>

        {isCustomerLoggedIn && (
            <div id="style-match" className="py-8">
                <StyleMatch />
            </div>
        )}

        <div className="mt-8">
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
                className="w-full max-w-6xl mx-auto"
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

        <CustomerLoginModal
            isOpen={isCustomerLoginModalOpen}
            onOpenChange={setIsCustomerLoginModalOpen}
            onSuccessfulLogin={onSuccessfulLogin}
        />
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
