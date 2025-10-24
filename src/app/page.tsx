
'use client';

import * as React from 'react';
import type { Artist, Customer, CartItem, MasterServicePackage, ImagePlaceholder } from '@/lib/types';
import { getCustomer, getPlaceholderImages, listenToCollection, getMasterServices } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Palette,
  Sparkles,
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
import { ServiceSelectionModal } from '@/components/utsavlook/ServiceSelectionModal';
import { MehndiIcon, MakeupIcon, PhotographyIcon } from '@/components/icons';
import { PwaInstallBanner } from '@/components/utsavlook/PwaInstallBanner';
import { StyleMatch } from '@/components/utsavlook/StyleMatch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Footer } from '@/components/utsavlook/Footer';
import { ArtistCard } from '@/components/utsavlook/ArtistCard';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';
import { ClientOnly } from '@/components/ClientOnly';

export default function Home() {
  const router = useRouter();
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
  
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [cart, setCart] = React.useState<CartItem[]>([]);

  // State for the service selection modal
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<MasterServicePackage | null>(null);
  
  const [galleryImages, setGalleryImages] = React.useState<ImagePlaceholder[]>([]);
  const [backgroundImages, setBackgroundImages] = React.useState<ImagePlaceholder[]>([]);
  const [topArtists, setTopArtists] = React.useState<Artist[]>([]);


  const { toast } = useToast();

  const [currentBgIndex, setCurrentBgIndex] = React.useState(0);
  
  const handleCustomerLogout = () => {
    signOut(getAuth(getFirebaseApp()));
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  React.useEffect(() => {
    const auth = getAuth(getFirebaseApp());
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const currentCustomer = await getCustomer(user.uid);
        if (currentCustomer) {
            setIsCustomerLoggedIn(true);
            setCustomer(currentCustomer);
            const storedCart = localStorage.getItem(`cart_${user.uid}`);
            setCart(storedCart ? JSON.parse(storedCart) : []);
            localStorage.setItem('currentCustomerId', user.uid);
        } else {
            // This case might happen if user is authenticated but not in our 'customers' collection
            setIsCustomerLoggedIn(false);
            setCustomer(null);
            setCart([]);
            localStorage.removeItem('currentCustomerId');
        }
      } else {
        // User is signed out
        setIsCustomerLoggedIn(false);
        setCustomer(null);
        setCart([]);
        localStorage.removeItem('currentCustomerId');
      }
    });
    
    const unsubscribeArtists = listenToCollection<Artist>('artists', (fetchedArtists) => {
        setArtists(fetchedArtists);
        // Set initial sorted artists, then shuffle on client
        setTopArtists([...fetchedArtists].sort((a, b) => b.rating - a.rating).slice(0, 5));
    });
    
    getMasterServices().then((services) => {
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
        unsubscribeAuth();
    };
  }, [backgroundImages.length]);
  
   // This effect runs only on the client after mount to prevent hydration errors.
  React.useEffect(() => {
      if (artists.length > 0) {
          setTopArtists(prevArtists => [...prevArtists].sort(() => 0.5 - Math.random()));
      }
  }, [artists]);


  const handleAddToCart = (item: Omit<CartItem, 'id'>) => {
    if (!isCustomerLoggedIn || !customer) {
        // If user is not logged in, save the item to local storage and redirect
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
      <div className="space-y-8 mt-4 md:mt-8">
        <Carousel
            opts={{
                align: "start",
            }}
            className="w-full"
        >
            <CarouselContent>
                <Packages packages={relevantPackages} onServiceSelect={(service) => { setSelectedService(service); setIsServiceModalOpen(true); }} />
            </CarouselContent>
        </Carousel>
      </div>
    );
  }
  

  return (
    <div className="flex min-h-screen w-full flex-col relative bg-background">
      <div id="recaptcha-container" style={{ position: 'absolute', bottom: 0, right: 0, zIndex: -1 }}></div>
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
        <div className="text-center py-4 md:py-8">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-accent md:text-7xl">
                Utsav<span className="text-primary">Look</span>
            </h1>
            <p className="mt-2 font-dancing-script text-xl sm:text-2xl text-foreground/90 md:text-3xl">Your Perfect Look for Every Utsav.</p>
            <div className="mt-4 font-body text-sm text-foreground/80 max-w-3xl mx-auto md:text-lg">
              <p>Get your perfect UtsavLook by booking top-rated Mehendi, Makeup, and Photography artists,</p>
              <p>all verified professionals dedicated to making your special day unforgettable.</p>
            </div>
        </div>
        <ClientOnly>
        {isCustomerLoggedIn && (
            <div id="style-match" className="py-8 max-w-4xl mx-auto w-full">
               <Accordion type="single" collapsible className="w-full bg-card rounded-lg shadow-lg border-accent/20">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="p-4 md:p-6 text-left">
                    <div className="flex items-center gap-4">
                        <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-accent flex-shrink-0" />
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold font-headline text-primary">AI Style Match</h3>
                            <p className="text-sm text-muted-foreground mt-1">Get personalized recommendations by uploading a photo of your outfit.</p>
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <StyleMatch />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
        )}
        </ClientOnly>

        <div className="mt-4 md:mt-8">
            <h2 className="text-center font-headline text-4xl sm:text-5xl text-primary mb-4 md:mb-8">Our Services</h2>
             <ClientOnly>
                <Tabs defaultValue="mehndi" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-xl mx-auto h-auto text-sm sm:text-lg py-2 md:py-3">
                        <TabsTrigger value="mehndi" className="py-2 flex items-center gap-1 sm:gap-2"><MehndiIcon className="h-5 w-5"/>Mehndi</TabsTrigger>
                        <TabsTrigger value="makeup" className="py-2 flex items-center gap-1 sm:gap-2"><MakeupIcon className="h-5 w-5"/>Makeup</TabsTrigger>
                        <TabsTrigger value="photography" className="py-2 flex items-center gap-1 sm:gap-2"><PhotographyIcon className="h-5 w-5" />Photography</TabsTrigger>
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
             </ClientOnly>
        </div>
        
        <Separator className="my-8"/>

         {topArtists.length > 0 && (
          <div className="py-8 md:py-12">
            <h2 className="text-center font-headline text-4xl sm:text-5xl text-primary mb-8">Meet Our Top Artists</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
              {topArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          </div>
        )}


        <Separator className="my-8"/>

        <div className="py-8 md:py-12">
            <h2 className="text-center font-headline text-4xl sm:text-5xl text-primary">Our Works</h2>
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
                className="w-full max-w-6xl mx-auto mt-4 md:mt-8"
            >
                <CarouselContent>
                    {galleryImages.map((image, index) => (
                        <CarouselItem key={index} className="sm:basis-1/2 lg:basis-1/3">
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
      </main>
      <Footer />
    </div>
  );
}
