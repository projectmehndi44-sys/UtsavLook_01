
'use client';

import * as React from 'react';
<<<<<<< HEAD
import type { Artist, Customer, CartItem, MasterServicePackage, ImagePlaceholder, HeroSettings } from '@/lib/types';
import { getCustomer, getPlaceholderImages, getHeroSettings, listenToCollection } from '@/lib/services';
=======
import type { Artist, Customer, CartItem, MasterServicePackage, ImagePlaceholder } from '@/lib/types';
import { getCustomer, getPlaceholderImages, listenToCollection, getMasterServices } from '@/lib/services';
>>>>>>> eac5ee80131f4a21df1449fd33b40862fc57bb83
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
import Image from 'next/image';
import Link from 'next/link';
import { Packages } from '@/components/utsavlook/Packages';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceSelectionModal } from '@/components/utsavlook/ServiceSelectionModal';
import { MehndiIcon, MakeupIcon, PhotographyIcon } from '@/components/icons';
import { PwaInstallBanner } from '@/components/utsavlook/PwaInstallBanner';
import { StyleMatch } from '@/components/utsavlook/StyleMatch';
<<<<<<< HEAD
import { ArtistProfileModal } from '@/components/utsavlook/ArtistProfileModal';
import { occasionImages, type OccasionImage } from '@/lib/occasion-images';
import { ArtistCard } from '@/components/utsavlook/ArtistCard';
import Autoplay from "embla-carousel-autoplay";

const occasionWords = occasionImages.map(img => img.occasion);
=======
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Footer } from '@/components/utsavlook/Footer';
import { ArtistCard } from '@/components/utsavlook/ArtistCard';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';
import { ClientOnly } from '@/components/ClientOnly';
>>>>>>> eac5ee80131f4a21df1449fd33b40862fc57bb83

export default function Home() {
  const router = useRouter();
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
  
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [cart, setCart] = React.useState<CartItem[]>([]);

  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<MasterServicePackage | null>(null);
  
  const [galleryImages, setGalleryImages] = React.useState<ImagePlaceholder[]>([]);
<<<<<<< HEAD
  const [heroSettings, setHeroSettings] = React.useState<HeroSettings>({ slideshowText: ''});
  
  const [currentOccasionIndex, setCurrentOccasionIndex] = React.useState(0);
  
  const { toast } = useToast();
  
  React.useEffect(() => {
    const interval = setInterval(() => {
        setCurrentOccasionIndex(prev => (prev + 1) % occasionWords.length);
    }, 5000); // Change word every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleCustomerLogout = React.useCallback(() => {
    setIsCustomerLoggedIn(false);
    setCustomer(null);
    setCart([]);
    localStorage.removeItem('currentCustomerId');
=======
  const [backgroundImages, setBackgroundImages] = React.useState<ImagePlaceholder[]>([]);
  const [topArtists, setTopArtists] = React.useState<Artist[]>([]);


  const { toast } = useToast();

  const [currentBgIndex, setCurrentBgIndex] = React.useState(0);
  
  const handleCustomerLogout = () => {
    signOut(getAuth(getFirebaseApp()));
>>>>>>> eac5ee80131f4a21df1449fd33b40862fc57bb83
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
<<<<<<< HEAD
             handleCustomerLogout();
=======
            // This case might happen if user is authenticated but not in our 'customers' collection
            setIsCustomerLoggedIn(false);
            setCustomer(null);
            setCart([]);
            localStorage.removeItem('currentCustomerId');
>>>>>>> eac5ee80131f4a21df1449fd33b40862fc57bb83
        }
      } else {
        // User is signed out
        setIsCustomerLoggedIn(false);
        setCustomer(null);
        setCart([]);
<<<<<<< HEAD
    }
  }, [handleCustomerLogout]);

  React.useEffect(() => {
    checkLoggedInCustomer();

    const unsubscribeArtists = listenToCollection<Artist>('artists', setArtists);
    const unsubscribePackages = listenToCollection<MasterServicePackage>('masterServices', (services) => {
=======
        localStorage.removeItem('currentCustomerId');
      }
    });
    
    const unsubscribeArtists = listenToCollection<Artist>('artists', (fetchedArtists) => {
        setArtists(fetchedArtists);
        // Set initial sorted artists, then shuffle on client
        setTopArtists([...fetchedArtists].sort((a, b) => b.rating - a.rating).slice(0, 5));
    });
    
    getMasterServices().then((services) => {
>>>>>>> eac5ee80131f4a21df1449fd33b40862fc57bb83
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

<<<<<<< HEAD
    getHeroSettings().then(setHeroSettings);
=======
    const intervalId = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % (backgroundImages.length || 1));
    }, 5000); 
>>>>>>> eac5ee80131f4a21df1449fd33b40862fc57bb83

    return () => {
        unsubscribeArtists();
        unsubscribeAuth();
    };
<<<<<<< HEAD
  }, [checkLoggedInCustomer]);
=======
  }, [backgroundImages.length]);
>>>>>>> eac5ee80131f4a21df1449fd33b40862fc57bb83
  
   // This effect runs only on the client after mount to prevent hydration errors.
  React.useEffect(() => {
      if (artists.length > 0) {
          setTopArtists(prevArtists => [...prevArtists].sort(() => 0.5 - Math.random()));
      }
  }, [artists]);


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
<<<<<<< HEAD
      <div className="space-y-8 mt-8 px-4 md:px-8">
        <Packages packages={relevantPackages} onServiceSelect={(service) => { setSelectedService(service); setIsServiceModalOpen(true); }} />
=======
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
>>>>>>> eac5ee80131f4a21df1449fd33b40862fc57bb83
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
<<<<<<< HEAD
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
                    <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-bold text-accent animate-slide-down opacity-0 [animation-fill-mode:forwards] [animation-delay:0s]">
                        Utsav<span className="text-primary">Look</span>
                    </h1>
                    <p className="font-dancing-script text-2xl md:text-3xl animate-slide-in-left opacity-0 [animation-fill-mode:forwards] [animation-delay:1.5s]">Your Perfect Look for Every Utsav.</p>
                    </div>
                    
                    <div className="mt-4">
                        <div className="whitespace-nowrap text-2xl font-bold md:text-3xl animate-slide-in-left opacity-0 [animation-fill-mode:forwards] [animation-delay:3s]">Crafting Memories for Your</div>
                         <div key={currentOccasionIndex} className="animated-gradient-text fade-and-slide-in text-5xl font-bold md:text-6xl">
                            {occasionWords[currentOccasionIndex]}
                        </div>
                    </div>
                    
                    <div className="mt-4 max-w-xl font-body text-base animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:4.5s]">
                       <p>Book top-rated, verified artists for your special day.</p>
                    </div>

                     <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center md:justify-start opacity-0 animate-fade-in [animation-fill-mode:forwards] [animation-delay:6s]">
                        <Button size="lg" className="btn-gradient rounded-full" onClick={() => handleScrollTo('services')}>
                            Book a Service
                        </Button>
                         <Button size="lg" className="btn-gradient rounded-full" onClick={() => handleScrollTo('artists')}>
                            View Artists
                        </Button>
                    </div>
                    <div className="mt-8 text-center md:text-left animate-slide-up opacity-0 [animation-fill-mode:forwards] [animation-delay:7.5s]">
                       <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary-foreground backdrop-blur-sm hover:bg-primary/20 transition-colors">
                           <Link href="/artist" className="text-sm text-primary font-semibold">Are you an artist? <span className="font-bold underline">Join Us!</span></Link>
                        </div>
                    </div>
                </div>
            </div>
         </div>

        <div className="py-8 bg-gradient-to-b from-brand-soft-sand/80 to-background">
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
=======
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
>>>>>>> eac5ee80131f4a21df1449fd33b40862fc57bb83
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
                        delay: 5000,
                    })
                ]}
<<<<<<< HEAD
                className="w-full"
=======
                className="w-full max-w-6xl mx-auto mt-4 md:mt-8"
>>>>>>> eac5ee80131f4a21df1449fd33b40862fc57bb83
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
