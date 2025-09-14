
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Upload, Trash2, Save, PlusCircle } from 'lucide-react';
import NextImage from 'next/image';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { getPlaceholderImages, savePlaceholderImages } from '@/lib/services';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const imageSchema = z.object({
    id: z.string(),
    description: z.string().min(1, 'Description is required'),
    imageUrl: z.string().url('Must be a valid URL'),
    imageHint: z.string().min(1, 'AI Hint is required'),
});

const formSchema = z.object({
    images: z.array(imageSchema),
});

export default function ImageManagementPage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [isLoading, setIsLoading] = React.useState(true);
    const [imageToDelete, setImageToDelete] = React.useState<number | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            images: [],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "images"
    });

    React.useEffect(() => {
        setIsLoading(true);
        getPlaceholderImages().then(data => {
            form.reset({ images: data });
            setIsLoading(false);
        });
    }, [form]);

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            await savePlaceholderImages(data.images);
            toast({
                title: 'Images Saved',
                description: 'Your image library has been updated successfully.',
            });
        } catch (error) {
            console.error("Failed to save images:", error);
            toast({
                title: 'Error Saving Images',
                description: 'Could not update the image library.',
                variant: 'destructive',
            });
        }
    };
    
    const confirmDelete = () => {
        if (imageToDelete !== null) {
            remove(imageToDelete);
            setImageToDelete(null);
            toast({ title: "Image Removed", description: "Click 'Save Changes' to finalize the deletion." });
        }
    };

    if (isLoading) {
        return <p>Loading images...</p>;
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Site Image Management</h1>
            </div>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="w-6 h-6 text-primary"/> Image Library
                            </CardTitle>
                            <CardDescription>
                                Add, edit, or remove the placeholder and marketing images used throughout the site.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <div className="md:col-span-1">
                                        <NextImage src={form.watch(`images.${index}.imageUrl`)} alt={field.id} width={200} height={150} className="rounded-md object-cover w-full aspect-[4/3]"/>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name={`images.${index}.id`} render={({ field }) => (
                                                <FormItem><FormLabel>Image ID</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`images.${index}.imageHint`} render={({ field }) => (
                                                <FormItem><FormLabel>AI Hint</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )} />
                                        </div>
                                         <FormField control={form.control} name={`images.${index}.imageUrl`} render={({ field }) => (
                                            <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`images.${index}.description`} render={({ field }) => (
                                            <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                                        )} />
                                         <Button type="button" variant="destructive" size="sm" onClick={() => setImageToDelete(index)} disabled={!hasPermission('settings', 'edit')}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                             <Button type="button" variant="outline" onClick={() => append({ id: `new-image-${Date.now()}`, description: '', imageUrl: 'https://picsum.photos/800/600', imageHint: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Image
                            </Button>
                        </CardContent>
                    </Card>
                    <div className="mt-6">
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !hasPermission('settings', 'edit')}>
                            <Save className="mr-2 h-4 w-4" /> Save All Changes
                        </Button>
                    </div>
                </form>
            </Form>
            <AlertDialog open={imageToDelete !== null} onOpenChange={() => setImageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the image entry from the form. You must click "Save Changes" to make it permanent.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Yes, Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
