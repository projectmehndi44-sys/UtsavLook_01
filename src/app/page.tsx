
'use client';
import * as React from 'react';
import HeroSection from '@/components/hero-section';
import OurWorksCarousel from '@/components/our-works-carousel';
import { placeholderImages } from '@/lib/placeholder-images.json';
import { masterServicePackages } from '@/lib/data';
import { ServiceSelectionModal } from '@/components/utsavlook/ServiceSelectionModal';
import { StyleMatch } from '@/components/utsavlook/StyleMatch';
import type { Artist, CartItem, MasterServicePackage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Star } from 'lucide-react';
import { ArtistCard } from '@/components/utsavlook/ArtistCard';
import { ArtistProfileModal } from '@/components/utsavlook/ArtistProfileModal';

// Mock data, in a real app this would be fetched
const mockArtists: Artist[] = [
    {
      id: 'artist-01',
      name: 'Riya Sharma',
      email: 'riya.s@example.com',
      phone: '9876543210',
      profilePicture: 'https://picsum.photos/seed/artist1/100/100',
      workImages: [
        'https://picsum.photos/seed/work1a/600/400',
        'https://picsum.photos/seed/work1b/600/400',
      ],
      services: ['mehndi', 'makeup'],
      location: 'Mumbai, Maharashtra',
      rating: 4.9,
      styleTags: ['Bridal', 'Intricate', 'Modern'],
      verified: true,
      isFoundersClubMember: true,
      charge: 5000,
      charges: {
        'mehndi': 5000,
        'makeup': 8000
      }
    },
    {
      id: 'artist-02',
      name: 'Aditya Verma',
      email: 'aditya.v@example.com',
      phone: '9876543211',
      profilePicture: 'https://picsum.photos/seed/artist2/100/100',
      workImages: [
        'https://picsum.photos/seed/work2a/600/400',
        'https://picsum.photos/seed/work2b/600/400',
      ],
      services: ['photography'],
      location: 'Pune, Maharashtra',
      rating: 4.8,
      styleTags: ['Candid', 'Cinematic', 'Pre-Wedding'],
      verified: true,
      charge: 25000,
      charges: {
        'photography': 25000
      }
    },
     {
      id: 'artist-03',
      name: 'Sunita Patil',
      email: 'sunita.p@example.com',
      phone: '9876543212',
      profilePicture: 'https://picsum.photos/seed/artist3/100/100',
      workImages: [
        'https://picsum.photos/seed/work3a/600/400',
        'https://picsum.photos/seed/work3b/600/400',
      ],
      services: ['mehndi'],
      location: 'Mumbai, Maharashtra',
      rating: 4.7,
      styleTags: ['Traditional', 'Arabic', 'Guest'],
      isFoundersClubMember: true,
      charge: 3000,
      charges: {
        'mehndi': 3000
      }
    },
];

const ServiceCard = ({ service, onSelect }: { service: MasterServicePackage, onSelect: (service: MasterServicePackage) => void }) => {
    return (
        <Card className="flex flex-col h-full overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 rounded-lg transform hover:-translate-y-1">
            <CardHeader className="p-0">
                <div className="aspect-[4/3] relative">
                    <Image src={service.image} alt={service.name} fill className="object-cover" />
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="text-xl mb-2 text-primary">{service.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mb-3">{service.description}</CardDescription>
                <div className="flex flex-wrap gap-2">
                    {service.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-accent/20 text-accent-foreground/80">{tag}</Badge>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <p className="text-lg font-bold text-primary">
                    <span className="text-sm font-normal text-muted-foreground">From </span>
                    ₹{service.categories[0].basePrice.toLocaleString()}
                </p>
                <Button onClick={() => onSelect(service)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Select
                </Button>
            </CardFooter>
        </Card>
    )
}

const ServiceTabs = ({ services, onSelectService }: { services: MasterServicePackage[], onSelectService: (service: MasterServicePackage) => void }) => {
  const serviceTypes = ['Mehndi', 'Makeup', 'Photography'];
  return (
    <React.Fragment>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
                <ServiceCard key={service.id} service={service} onSelect={onSelectService} />
            ))}
        </div>
    </React.Fragment>
  );
};


export default function Home() {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const { toast } = useToast();
  
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<MasterServicePackage | null>(null);

  const [isArtistModalOpen, setIsArtistModalOpen] = React.useState(false);
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);

  const handleSelectService = (service: MasterServicePackage) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };
  
  const handleArtistBookingRequest = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsArtistModalOpen(true);
  };

  const handleAddToCart = (item: Omit<CartItem, 'id' | 'price'> & { price?: number }) => {
    const newItem: CartItem = {
      ...item,
      id: `${item.servicePackage.id}-${Date.now()}`,
      price: item.price || item.selectedTier.basePrice,
    };
    
    setCart(prevCart => [...prevCart, newItem]);
    
    toast({
      title: "Added to Cart!",
      description: `${item.servicePackage.name} (${item.selectedTier.name}) has been added.`,
    });
  };

  const ourWorksImages = placeholderImages.filter(img => img.id.startsWith('our-work'));

  return (
    <div className="flex flex-col">
      <HeroSection />

      <section id="our-works" className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-5xl md:text-7xl text-primary text-center mb-8">Our Works</h2>
          <p className="text-center max-w-2xl mx-auto mb-12 text-muted-foreground">
            A curated collection of our finest work, showcasing the artistry and passion we bring to every event.
          </p>
          <OurWorksCarousel images={ourWorksImages} />
        </div>
      </section>

      <section id="services" className="py-12 md:py-20">
        <div className="container mx-auto px-4">
           <h2 className="font-headline text-5xl md:text-7xl text-primary text-center mb-12">Our Services</h2>
           <ServiceTabs services={masterServicePackages} onSelectService={handleSelectService} />
        </div>
      </section>
      
      <section id="ai-style-match" className="py-12 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <StyleMatch />
        </div>
      </section>

      <section id="featured-artists" className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-5xl md:text-7xl text-primary text-center mb-8">Featured Artists</h2>
          <p className="text-center max-w-2xl mx-auto mb-12 text-muted-foreground">
            Meet some of our top-rated and most-loved professional artists.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockArtists.map(artist => (
                <ArtistCard key={artist.id} artist={artist} onBookingRequest={handleArtistBookingRequest} />
            ))}
          </div>
        </div>
      </section>

      {selectedService && (
        <ServiceSelectionModal
          service={selectedService}
          artists={mockArtists} // Pass relevant artists
          isOpen={isServiceModalOpen}
          onOpenChange={setIsServiceModalOpen}
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
    </div>
  );
}
