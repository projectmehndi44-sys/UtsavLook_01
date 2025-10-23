'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Artist, MasterServicePackage } from '@/lib/types';
import { getArtist, getMasterServices } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { IndianRupee, MapPin, Star, CheckCircle, Sparkles, Mail, Phone } from 'lucide-react';
import { Header } from '@/components/utsavlook/Header';
import { Footer } from '@/components/utsavlook/Footer';
import { ServiceSelectionModal } from '@/components/utsavlook/ServiceSelectionModal';

export default function ArtistPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const artistId = params.id as string;

  const [artist, setArtist] = React.useState<Artist | null>(null);
  const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<MasterServicePackage | null>(null);

  React.useEffect(() => {
    if (artistId) {
      Promise.all([getArtist(artistId), getMasterServices()])
        .then(([artistData, servicesData]) => {
          if (artistData) {
            setArtist(artistData);
            // Filter services to only those the artist offers
            const artistOfferedServices = servicesData.filter(service => artistData.services.includes(service.service));
            setMasterServices(artistOfferedServices);
          } else {
            router.push('/'); // Redirect if artist not found
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          router.push('/');
        });
    }
  }, [artistId, router]);

  const handleAddToCart = (item: any) => {
    // This is a placeholder. In a real app, you would have cart context here.
    console.log('Add to cart:', item);
    setIsServiceModalOpen(false);
  };
  
  const handleServiceSelect = (service: MasterServicePackage) => {
      setSelectedService(service);
      setIsServiceModalOpen(true);
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading artist profile...</div>;
  }

  if (!artist) {
    return <div className="flex justify-center items-center h-screen">Artist not found.</div>;
  }
  
  const primaryService = artist.services?.[0];
  const baseCharge = (primaryService && artist.charges?.[primaryService]) || artist.charge || 0;


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header isCustomerLoggedIn={false} onCustomerLogout={() => {}} customer={null} cartCount={0} />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/10">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 md:grid-cols-2 items-center">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                 <Avatar className="w-32 h-32 mb-4 border-4 border-white shadow-lg">
                    <AvatarImage src={artist.profilePicture} alt={artist.name} />
                    <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline text-primary">
                  {artist.name}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center text-amber-500">
                        <Star className="w-5 h-5 mr-1 fill-current" />
                        <span className="font-bold text-lg">{artist.rating}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-5 h-5 mr-1" />
                        <span>{artist.location}</span>
                    </div>
                </div>
                 <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    {artist.verified && <Badge className="bg-green-600 text-white"><CheckCircle className="w-4 h-4 mr-1"/>Verified</Badge>}
                    {artist.isFoundersClubMember && <Badge className="bg-amber-500 text-white"><Sparkles className="w-4 h-4 mr-1"/>Founder's Club</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  {(artist.workImages || []).slice(0, 4).map((src, index) => (
                      <div key={index} className="relative aspect-square">
                          <Image src={src} alt={`${artist.name}'s work ${index + 1}`} fill className="rounded-lg object-cover shadow-md" />
                      </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                {masterServices.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Services Offered</CardTitle>
                            <CardDescription>Select a service to view packages and book.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            {masterServices.map(service => {
                                const lowestPrice = Math.min(...service.categories.map(c => c.basePrice));
                                return (
                                <Card key={service.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleServiceSelect(service)}>
                                    <div className="p-4">
                                        <CardTitle className="text-lg text-primary">{service.name}</CardTitle>
                                        <CardDescription className="text-sm mt-1">{service.description}</CardDescription>
                                    </div>
                                    <div className="p-4 bg-muted/50 mt-auto flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">From ₹{lowestPrice.toLocaleString()}</span>
                                        <Button size="sm" variant="outline">Book Now</Button>
                                    </div>
                                </Card>
                            )})}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader><CardTitle>Work Gallery</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(artist.workImages || []).map((src, index) => (
                             <div key={index} className="relative aspect-square">
                                <Image src={src} alt={`${artist.name}'s work ${index + 1}`} fill className="rounded-lg object-cover" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card>
                     <CardHeader><CardTitle>Artist Details</CardTitle></CardHeader>
                     <CardContent className="space-y-3 text-sm">
                         <div className="flex items-center gap-3">
                             <Phone className="w-4 h-4 text-muted-foreground" />
                             <span>{artist.phone}</span>
                         </div>
                          <div className="flex items-center gap-3">
                             <Mail className="w-4 h-4 text-muted-foreground" />
                             <span>{artist.email}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <IndianRupee className="w-4 h-4 text-muted-foreground"/>
                            <span>Base charge from ₹{baseCharge.toLocaleString()}</span>
                         </div>
                     </CardContent>
                </Card>
                {artist.reviews && artist.reviews.length > 0 && (
                     <Card>
                        <CardHeader><CardTitle>Customer Reviews</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {artist.reviews.slice(0,3).map((review, index) => (
                                <div key={index} className="border-l-2 border-accent pl-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{review.customerName}</p>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <span className="font-bold text-sm">{review.rating}</span>
                                            <Star className="w-4 h-4 fill-current"/>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
       {selectedService && (
            <ServiceSelectionModal
                isOpen={isServiceModalOpen}
                onOpenChange={setIsServiceModalOpen}
                service={selectedService}
                artists={[artist]} // Pass only the current artist
                onAddToCart={handleAddToCart}
            />
        )}
    </div>
  );
}
