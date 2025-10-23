
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MakeupIcon, MehndiIcon, PhotographyIcon } from '@/components/icons';
import type { MasterServicePackage } from '@/lib/types';
import { PackageSearch } from 'lucide-react';
import { CarouselItem } from '@/components/ui/carousel';

interface PackagesProps {
    packages: MasterServicePackage[];
    onServiceSelect: (service: MasterServicePackage) => void;
}

const getServiceIcon = (service: MasterServicePackage['service']) => {
    switch(service) {
        case 'mehndi': return <MehndiIcon className="w-3.5 h-3.5"/>;
        case 'makeup': return <MakeupIcon className="w-3.5 h-3.5"/>;
        case 'photography': return <PhotographyIcon className="w-3.5 h-3.5"/>;
        default: return null;
    }
}


export function Packages({ packages, onServiceSelect }: PackagesProps) {

    if (packages.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">No services have been configured for this category yet.</p>
            </div>
        );
    }

    return (
        <>
            {packages.map((service) => {
                const lowestPrice = Math.min(...service.categories.map(c => c.basePrice));
                return (
                    <CarouselItem key={service.id} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                            <Card className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:border-accent h-full">
                                <CardContent className="p-0 relative">
                                    <div className="aspect-[4/3] relative">
                                    <Image
                                        src={service.image}
                                        alt={service.name}
                                        fill
                                        className="object-cover"
                                        data-ai-hint="mehndi makeup"
                                    />
                                    </div>
                                </CardContent>

                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="text-xl font-headline text-primary font-bold">{service.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 flex-grow">
                                    {service.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1 my-4">
                                        {service.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="gap-1.5 pl-2">
                                                {getServiceIcon(service.service)}
                                                <span className="capitalize">{tag}</span>
                                            </Badge>
                                        ))}
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-auto pt-4 border-t">
                                        <div className="text-lg font-bold text-primary">
                                            <span className="text-xs font-normal text-muted-foreground">From</span><br/>
                                            ₹{lowestPrice.toLocaleString()}
                                        </div>
                                        <Button 
                                            onClick={() => onServiceSelect(service)} 
                                            className="bg-accent hover:bg-accent/90"
                                        >
                                            <PackageSearch className="mr-2 h-4 w-4"/>
                                            View Options
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </CarouselItem>
                )
            })}
        </>
    );
}
