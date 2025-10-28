import type { Artist } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { IndianRupee, MapPin, Star, CheckCircle } from 'lucide-react';
import { MakeupIcon, MehndiIcon, PhotographyIcon } from '@/components/icons';

interface ArtistCardProps {
  artist: Artist;
  onViewProfile: (artist: Artist) => void;
}

const getServiceIcon = (service: Artist['services'][number]) => {
    switch (service) {
        case 'mehndi':
            return <MehndiIcon className="w-3.5 h-3.5" />;
        case 'makeup':
            return <MakeupIcon className="w-3.5 h-3.5" />;
        case 'photography':
            return <PhotographyIcon className="w-3.5 h-3.5" />;
        default:
            return null;
    }
}

export function ArtistCard({ artist, onViewProfile }: ArtistCardProps) {
  const primaryService = artist.services?.[0];
  const baseCharge = (primaryService && artist.charges?.[primaryService]) || artist.charge || 0;


  return (
    <Card className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-accent">
      <CardHeader className="p-0 relative">
        <div className="aspect-[2/3] w-full relative">
            <Image
                src={artist.profilePicture}
                alt={artist.name}
                fill
                className="object-cover"
                data-ai-hint="artist portrait"
            />
        </div>
         <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {artist.verified && (
                <Badge className="bg-green-600 text-white pl-2">
                    <CheckCircle className="w-3.5 h-3.5 mr-1"/>
                    Verified
                </Badge>
            )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-bold text-primary mb-2">{artist.name}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 mr-1.5 text-accent" />
          <span>{artist.location}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {(artist.services || []).map((service) => (
            <Badge key={service} variant="secondary" className="gap-1.5 pl-2">
              {getServiceIcon(service)}
              <span className="capitalize">{service}</span>
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-background/50 flex justify-between items-center">
        <div className="flex flex-col">
            <div className="flex items-center text-lg font-bold text-primary">
                <IndianRupee className="w-4 h-4 mr-1" />
                <span>{baseCharge.toLocaleString()}</span>
            </div>
            <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 mr-1 fill-current" />
                <span className="font-bold text-sm">{artist.rating}</span>
            </div>
        </div>
        <Button onClick={() => onViewProfile(artist)} className="bg-accent hover:bg-accent/90">View Profile</Button>
      </CardFooter>
    </Card>
  );
}
