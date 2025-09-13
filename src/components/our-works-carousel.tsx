'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

interface OurWorksCarouselProps {
    images: ImagePlaceholder[];
}

const OurWorksCarousel = ({ images }: OurWorksCarouselProps) => {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-lg">
                <CardContent className="flex aspect-[4/3] items-center justify-center p-0 relative">
                  <Image
                    src={image.imageUrl}
                    alt={image.description}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    data-ai-hint={image.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  <p className="absolute bottom-4 left-4 text-white text-sm font-medium p-2 rounded-md bg-black/30 backdrop-blur-sm">
                    {image.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
};

export default OurWorksCarousel;
