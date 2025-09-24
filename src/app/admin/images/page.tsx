
'use client';

import * as React from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Image as ImageIcon, Upload, Trash2, Save, PlusCircle, Gift } from 'lucide-react';
import NextImage from 'next/image';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { ImagePlaceholder, BenefitImage } from '@/lib/types';
import { getPlaceholderImages, savePlaceholderImages, getBenefitImages, saveBenefitImages } from '@/lib/services';
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


const benefitImageSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string().url('Must be a valid URL'),
  description: z.string(), // Added description
});

const benefitFormSchema = z.object({
    benefitImages: z.array(benefitImageSchema)
});


export default function ImageManagementPage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [isLoading, setIsLoading] = React.useState(true);
    const [imageToDelete, setImageToDelete] = React.useState<number | null>(null);

    const placeholderForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { images: [] }
    });
    
    const benefitsForm = useForm<z.infer<typeof benefitFormSchema>>({
        resolver: zodResolver(benefitFormSchema),
        defaultValues: { benefitImages: [] }
    });

    const { fields: placeholderFields, append, remove } = useFieldArray({
        control: placeholderForm.control,
        name: "images"
    });
    
    const { fields: benefitFields } = useFieldArray({
        control: benefitsForm.control,
        name: "benefitImages"
    });


    React.useEffect(() => {
        setIsLoading(true);
        Promise.all([
            getPlaceholderImages(),
            getBenefitImages()
        ]).then(([placeholderData, benefitData]) => {
            placeholderForm.reset({ images: placeholderData });
            benefitsForm.reset({ benefitImages: benefitData });
            setIsLoading(false);
        });
    }, [placeholderForm, benefitsForm]);

    const onPlaceholderSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            await savePlaceholderImages(data.images);
            toast({ title: 'Placeholder Images Saved', description: 'Your image library has been updated.' });
        } catch (error) {
            console.error("Failed to save images:", error);
            toast({ title: 'Error Saving Images', description: 'Could not update the image library.', variant: 'destructive' });
        }
    };
    
    const onBenefitSubmit: SubmitHandler<z.infer<typeof benefitFormSchema>> = async (data) => {
        try {
            await saveBenefitImages(data.benefitImages);
            toast({ title: 'Benefit Images Saved', description: 'The artist benefits images have been updated successfully.' });
        } catch (error) {
            console.error("Failed to save images:", error);
            toast({ title: 'Error Saving Images', description: 'Could not update the benefit images.', variant: 'destructive' });
        }
    };
    
    const handleBenefitImageUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = event.target.files?.[0];
        if (file) {
            const newUrl = URL.createObjectURL(file);
            benefitsForm.setValue(`benefitImages.${index}.imageUrl`, newUrl, { shouldDirty: true });
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Site Image Management</h1>
            </div>
            
            {/* New Artist Benefits Image Management */}
             <Form {...benefitsForm}>
                <form onSubmit={benefitsForm.handleSubmit(onBenefitSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gift className="w-6 h-6 text-primary"/> Artist Benefits Images
                            </CardTitle>
                            <CardDescription>
                                Update the images shown on the "For Artists" page for each benefit category.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {benefitFields.map((field, index) => (
                                <Card key={field.id} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <div className="md:col-span-1 space-y-2">
                                        <NextImage src={benefitsForm.watch(`benefitImages.${index}.imageUrl`)} alt={field.id} width={300} height={225} className="rounded-md object-cover w-full aspect-[4/3]"/>
                                        <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-accent">
                                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                            <p className="mt-2 text-xs text-muted-foreground">Click to upload new image</p>
                                            <Input 
                                                id={`image-upload-${index}`} 
                                                type="file" 
                                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" 
                                                accept="image/*" 
                                                onChange={(e) => handleBenefitImageUpload(e, index)} 
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                         <FormField control={benefitsForm.control} name={`benefitImages.${index}.title`} render={({ field }) => (
                                            <FormItem><FormLabel>Benefit Title</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>
                                        )} />
                                        <FormField control={benefitsForm.control} name={`benefitImages.${index}.description`} render={({ field }) => (
                                            <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                                        )} />
                                    </div>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                     <div className="mt-6">
                        <Button type="submit" className="w-full" disabled={benefitsForm.formState.isSubmitting || !hasPermission('settings', 'edit')}>
                            <Save className="mr-2 h-4 w-4" /> Save Benefit Images
                        </Button>
                    </div>
                </form>
            </Form>
            
            
             <Form {...placeholderForm}>
                <form onSubmit={placeholderForm.handleSubmit(onPlaceholderSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="w-6 h-6 text-primary"/> Placeholder Image Library
                            </CardTitle>
                            <CardDescription>
                                Add, edit, or remove the general placeholder and marketing images used throughout the site.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {placeholderFields.map((field, index) => (
                                <Card key={field.id} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <div className="md:col-span-1">
                                        <NextImage src={placeholderForm.watch(`images.${index}.imageUrl`)} alt={field.id} width={200} height={150} className="rounded-md object-cover w-full aspect-[4/3]"/>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={placeholderForm.control} name={`images.${index}.id`} render={({ field }) => (
                                                <FormItem><FormLabel>Image ID</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>
                                            )} />
                                            <FormField control={placeholderForm.control} name={`images.${index}.imageHint`} render={({ field }) => (
                                                <FormItem><FormLabel>AI Hint</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )} />
                                        </div>
                                         <FormField control={placeholderForm.control} name={`images.${index}.imageUrl`} render={({ field }) => (
                                            <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                                        )} />
                                        <FormField control={placeholderForm.control} name={`images.${index}.description`} render={({ field }) => (
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
                                Add New Placeholder Image
                            </Button>
                        </CardContent>
                    </Card>
                    <div className="mt-6">
                        <Button type="submit" className="w-full" disabled={placeholderForm.formState.isSubmitting || !hasPermission('settings', 'edit')}>
                            <Save className="mr-2 h-4 w-4" /> Save All Placeholder Changes
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
        </div>
    );
}

    

    