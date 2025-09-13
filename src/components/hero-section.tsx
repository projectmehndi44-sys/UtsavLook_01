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
                    className="object-cover opacity-20"
                    priority
                    data-ai-hint={heroImage.imageHint}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
            <div className="relative z-10 text-center p-4">
                 <h1 className="font-headline text-5xl font-bold text-accent md:text-7xl">
                    Utsav<span className="text-primary">Look</span>
                </h1>
                <p className="mt-2 font-dancing-script text-2xl text-foreground/90">Your Perfect Look for Every Utsav.</p>
                <div className="mt-4 font-body text-lg text-foreground/80 max-w-3xl mx-auto">
                    <p>Get your perfect UtsavLook by booking top-rated Mehendi, Makeup, and Photography artists,</p>
                    <p>all verified professionals dedicated to making your special day unforgettable.</p>
                </div>

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
