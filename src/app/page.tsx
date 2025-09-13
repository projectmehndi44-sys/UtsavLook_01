import HeroSection from '@/components/hero-section';
import OurWorksCarousel from '@/components/our-works-carousel';
import ServiceTabs from '@/components/service-tabs';
import { placeholderImages } from '@/lib/placeholder-images.json';
import { masterServicePackages } from '@/lib/data';

export default function Home() {
  // Simulating the output of the AI selection tool.
  // In a real app, this might come from a server component fetching the AI flow's result.
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
           <ServiceTabs services={masterServicePackages} />
        </div>
      </section>
    </div>
  );
}
