
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MakeupIcon, MehndiIcon, PhotographyIcon } from '@/components/icons';
import type { MasterServicePackage } from '@/lib/types';
import { PackageSearch, IndianRupee } from 'lucide-react';
import { CarouselItem } from '@/components/ui/carousel';

interface PackagesProps {
    packages: MasterServicePackage[];
    onServiceSelect: (service: MasterServicePackage) => void;
}

const getServiceIcon = (service: MasterServicePackage['service']) => {
    switch(service) {
        case 'mehndi': return <MehndiIcon className="w-8 h-8 text-primary"/>;
        case 'makeup': return <MakeupIcon className="w-8 h-8 text-primary"/>;
        case 'photography': return <PhotographyIcon className="w-8 h-8 text-primary"/>;
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
                    <CarouselItem key={service.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                        <div className="p-2 h-full">
                            <Card 
                                className="bg-background rounded-2xl shadow-brand hover:shadow-brand-lg transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col cursor-pointer group"
                                onClick={() => onServiceSelect(service)}
                            >
                                <CardContent className="p-0 flex flex-col items-center flex-grow">
                                    <div className="relative w-full mb-4 rounded-t-2xl overflow-hidden">
                                        <div className="relative aspect-[4/3] w-full">
                                            <Image
                                                src={service.image}
                                                alt={service.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="absolute top-2 right-2 flex flex-wrap gap-1 z-10">
                                            {service.tags.slice(0, 2).map(tag => (
                                                <Badge key={tag} variant="secondary" className="capitalize backdrop-blur-sm bg-black/20 text-white border-white/30">{tag}</Badge>
                                            ))}
                                        </div>
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
                                            <div className="w-16 h-16 bg-background rounded-full border-4 border-white object-cover shadow-lg aspect-square flex items-center justify-center">
                                                {getServiceIcon(service.service)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 pt-10 text-center flex-grow flex flex-col">
                                        <h3 className="text-xl font-headline text-primary font-bold">{service.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 flex-grow">
                                            {service.description}
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 bg-muted/50 border-t mt-auto">
                                   <div className="flex justify-between items-center w-full">
                                        <div className="text-lg font-bold text-primary flex flex-col items-start">
                                            <span className="text-xs font-normal text-muted-foreground">Starts From</span>
                                            <div className="flex items-center">
                                                <IndianRupee className="w-4 h-4 mr-0.5"/>
                                                {lowestPrice.toLocaleString()}
                                            </div>
                                        </div>
                                        <Button 
                                            className="bg-accent hover:bg-accent/90 rounded-full"
                                        >
                                            <PackageSearch className="mr-2 h-4 w-4"/>
                                            View Options
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    </CarouselItem>
                )
            })}
        </>
    );
}
