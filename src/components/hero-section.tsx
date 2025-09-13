import Image from 'next/image';
import { Button } from './ui/button';
import { placeholderImages } from '@/lib/placeholder-images.json';
import Link from 'next/link';

const HeroSection = () => {
    const heroImage = placeholderImages.find(p => p.id === 'hero-background');

    return (
        <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center text-white overflow-hidden">
            {heroImage && (
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint={heroImage.imageHint}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
            <div className="relative z-10 text-center p-4">
                <h1 className="font-headline text-7xl md:text-9xl lg:text-[10rem] drop-shadow-2xl text-white">
                    UtsavLook
                </h1>
                <p className="mt-2 md:mt-4 text-lg md:text-2xl font-light max-w-2xl mx-auto drop-shadow-lg">
                    Celebrate your beauty. Discover & book talented mehndi and makeup artists for your special day.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 py-6 text-lg">
                        <Link href="/#services">Explore Services</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;
