
'use client';

import * as React from 'react';
import type { Artist, Customer } from '@/lib/types';
import { getCustomer, listenToCollection } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/utsavlook/Header';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArtistProfileModal } from '@/components/utsavlook/ArtistProfileModal';
import { Footer } from '@/components/utsavlook/Footer';
import { ArtistCard } from '@/components/utsavlook/ArtistCard';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirebaseApp } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { MehndiIcon, MakeupIcon, PhotographyIcon } from '@/components/icons';


export default function ArtistsPage() {
  const router = useRouter();
  const [allArtists, setAllArtists] = React.useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = React.useState<Artist[]>([]);
  
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [cartCount, setCartCount] = React.useState(0);
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);
  const [isArtistModalOpen, setIsArtistModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');


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
            setCartCount(storedCart ? JSON.parse(storedCart).length : 0);
        } else {
            setIsCustomerLoggedIn(false);
            setCustomer(null);
            setCartCount(0);
        }
      } else {
        setIsCustomerLoggedIn(false);
        setCustomer(null);
        setCartCount(0);
      }
    });
    
    const unsubscribeArtists = listenToCollection<Artist>('artists', (fetchedArtists) => {
        setAllArtists(fetchedArtists);
        setFilteredArtists(fetchedArtists);
    });

    return () => {
        unsubscribeArtists();
        unsubscribeAuth();
    };
  }, []);

  React.useEffect(() => {
    let artistsToFilter = allArtists;

    if (activeTab !== 'all') {
      artistsToFilter = artistsToFilter.filter(artist => artist.services.includes(activeTab as any));
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      artistsToFilter = artistsToFilter.filter(artist =>
        artist.name.toLowerCase().includes(lowercasedTerm) ||
        artist.location.toLowerCase().includes(lowercasedTerm) ||
        artist.styleTags?.some(tag => tag.toLowerCase().includes(lowercasedTerm))
      );
    }
    
    setFilteredArtists(artistsToFilter);

  }, [searchTerm, activeTab, allArtists]);


  return (
    <div className="flex min-h-screen w-full flex-col relative why-choose-us-bg">
      <Header 
        isCustomerLoggedIn={isCustomerLoggedIn}
        onCustomerLogout={handleCustomerLogout}
        customer={customer}
        cartCount={cartCount}
      />
      <main className="flex-1">
        <section id="artists-directory" className="w-full">
          <div className="container mx-auto px-4 md:px-6 py-12">
            <h1 className="text-center font-headline text-4xl sm:text-5xl text-primary title-3d-effect mb-4">Our Talented Artists</h1>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover verified and top-rated professionals for your special day. Search by name or location, or filter by service to find your perfect match.
            </p>
            
            <div className="sticky top-20 bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-md z-30 mb-8 max-w-4xl mx-auto">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search artists by name, location, or style..."
                        className="pl-10 h-12 text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="mehndi"><MehndiIcon className="w-4 h-4 mr-2"/>Mehndi</TabsTrigger>
                        <TabsTrigger value="makeup"><MakeupIcon className="w-4 h-4 mr-2"/>Makeup</TabsTrigger>
                        <TabsTrigger value="photography"><PhotographyIcon className="w-4 h-4 mr-2"/>Photography</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredArtists.length > 0 ? (
                  filteredArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} onViewProfile={() => {setSelectedArtist(artist); setIsArtistModalOpen(true);}} />
                  ))
              ) : (
                <div className="col-span-full text-center py-16">
                    <h3 className="text-2xl font-semibold">No Artists Found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your search or filter.</p>
                </div>
              )}
            </div>
          </div>
        </section>

         {selectedArtist && (
          <ArtistProfileModal 
            isOpen={isArtistModalOpen}
            onOpenChange={setIsArtistModalOpen}
            artist={selectedArtist}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
