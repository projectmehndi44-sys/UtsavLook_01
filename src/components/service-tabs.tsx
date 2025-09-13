'use client';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { MasterServicePackage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';

interface ServiceTabsProps {
  services: MasterServicePackage[];
}

const ServiceCard = ({ service }: { service: MasterServicePackage }) => {
    const { toast } = useToast();

    const handleAddToCart = () => {
        // In a real app, this would add to a cart state (local or server)
        toast({
            title: "Added to Cart",
            description: `${service.name} has been added to your cart.`,
        });
    }

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
                <Button onClick={handleAddToCart} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                </Button>
            </CardFooter>
        </Card>
    )
}

const ServiceTabs = ({ services }: ServiceTabsProps) => {
  const serviceTypes = ['Mehndi', 'Makeup', 'Photography'];
  return (
    <Tabs defaultValue="Mehndi" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-primary/10 rounded-lg p-1 h-auto">
        {serviceTypes.map(type => (
             <TabsTrigger key={type} value={type} className="text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-md">
                {type}
            </TabsTrigger>
        ))}
      </TabsList>
      {serviceTypes.map(type => (
        <TabsContent key={type} value={type} className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.filter(s => s.service === type).map(service => (
                    <ServiceCard key={service.id} service={service} />
                ))}
            </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ServiceTabs;
