
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
                    <CarouselItem key={service.id} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                        <div className="p-1 h-full">
                            <Card className="overflow-hidden flex flex-col group h-full">
                                <CardContent className="p-0 relative">
                                    <div className="aspect-[4/3] relative">
                                    <Image
                                        src={service.image}
                                        alt={service.name}
                                        fill
                                        className="object-cover"
                                        data-ai-hint="mehndi makeup"
                                    />
                                     <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-[-50%] z-20">
                                        <div className="w-16 h-16 bg-background rounded-full border-4 border-white object-cover shadow-lg aspect-square flex items-center justify-center">
                                             {getServiceIcon(service.service)}
                                        </div>
                                    </div>
                                    </div>
                                </CardContent>

                                <div className="pt-10 p-4 flex flex-col flex-grow text-center">
                                    <h3 className="text-xl font-headline text-primary font-bold">{service.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 flex-grow">
                                    {service.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1 justify-center my-3">
                                        {service.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="gap-1.5 pl-2">
                                                <span className="capitalize">{tag}</span>
                                            </Badge>
                                        ))}
                                    </div>
                                    
                                </div>
                                <CardFooter className="p-2 bg-background/50 border-t mt-auto">
                                   <div className="flex justify-between items-center w-full">
                                        <div className="text-lg font-bold text-primary flex flex-col items-start">
                                            <span className="text-xs font-normal text-muted-foreground">From</span>
                                            <div className="flex items-center">
                                                <IndianRupee className="w-4 h-4 mr-0.5"/>
                                                {lowestPrice.toLocaleString()}
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => onServiceSelect(service)} 
                                            className="bg-accent hover:bg-accent/90"
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
