'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CartItem } from "@/lib/types";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";

interface CartItemsListProps {
    items: (Omit<CartItem, 'servicePackage'> & { servicePackage: { name: string, image?: string, id: string } })[];
}

export const CartItemsList = ({ items }: CartItemsListProps) => {

    const getServiceImage = (serviceId: string) => {
        // A bit of a hack to map cart item IDs to service image IDs
        const imageId = `service-${serviceId.replace(/-/g, '-')}`;
        return placeholderImages.find(p => p.id === imageId)?.imageUrl || 'https://picsum.photos/seed/cartitem/100/100';
    }

    return (
        <Card className="shadow-lg rounded-lg">
            <CardHeader>
                <CardTitle>Selected Services</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex gap-4 items-center p-2 rounded-md hover:bg-primary/5">
                            <Image 
                                src={getServiceImage(item.servicePackage.id)}
                                alt={item.servicePackage.name}
                                width={80}
                                height={80}
                                className="rounded-md object-cover"
                            />
                            <div className="flex-grow">
                                <h3 className="font-semibold text-primary">{item.servicePackage.name}</h3>
                                <p className="text-sm text-muted-foreground">{item.artist ? `Artist: ${item.artist.name}` : 'Express Booking'}</p>
                                <Badge variant="outline" className="mt-1">{item.selectedTier.name}</Badge>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-primary">₹{item.price.toLocaleString()}</p>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
