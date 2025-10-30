
'use client';

import * as React from 'react';
import type { Artist, Customer, CartItem, MasterServicePackage } from '@/lib/types';
import { getCustomer, listenToCollection, getMasterServices } from '@/lib/services';
import { Header } from '@/components/utsavlook/Header';
import { Footer } from '@/components/utsavlook/Footer';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { Packages } from '@/components/utsavlook/Packages';
import { useRouter } from 'next/navigation';
import { ServiceSelectionModal } from '@/components/utsavlook/ServiceSelectionModal';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";


export default function ServicesPage() {
  const router = useRouter();
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
  
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [cart, setCart] = React.useState<CartItem[]>([]);

  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<MasterServicePackage | null>(null);

  const { toast } = useToast();

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
            setIsCustomerLoggedIn(false);
            setCustomer(null);
            setCart([]);
            localStorage.removeItem('currentCustomerId');
        }
      } else {
        setIsCustomerLoggedIn(false);
        setCustomer(null);
        setCart([]);
        localStorage.removeItem('currentCustomerId');
      }
    });
    
    const unsubscribeArtists = listenToCollection<Artist>('artists', (fetchedArtists) => {
        setArtists(fetchedArtists);
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

    return () => {
        unsubscribeArtists();
        unsubscribeAuth();
    };
  }, []);

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

  return (
    <div className="flex min-h-screen w-full flex-col relative why-choose-us-bg">
      <Header 
        isCustomerLoggedIn={isCustomerLoggedIn}
        onCustomerLogout={handleCustomerLogout}
        customer={customer}
        cartCount={cart.length}
      />
      <main className="flex flex-1 flex-col">
        <section id="services" className="w-full">
          <div className="container mx-auto px-4 md:px-6 py-12">
            <h1 className="text-center font-headline text-4xl sm:text-5xl text-primary title-3d-effect mb-12">Our Services</h1>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <Packages packages={masterServices} onServiceSelect={(service) => { setSelectedService(service); setIsServiceModalOpen(true); }} />
            </div>
          </div>
        </section>

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

