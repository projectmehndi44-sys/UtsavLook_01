
'use client';

import * as React from 'react';
import { useArtistPortal } from '../layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Download, Copy, Share2, Palette, Star, IndianRupee, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image';
import { fetchPromoImage } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function PromotePage() {
  const { artist } = useArtistPortal();
  const { toast } = useToast();

  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleImageSelection = (imageUrl: string) => {
    setSelectedImages((prev) => {
      if (prev.includes(imageUrl)) {
        return prev.filter((url) => url !== imageUrl);
      }
      if (prev.length >= 4) {
        toast({
          title: 'Maximum 4 images allowed',
          description: 'Please unselect an image to choose a new one.',
          variant: 'destructive',
        });
        return prev;
      }
      return [...prev, imageUrl];
    });
  };

  const generatePromo = async () => {
    if (!artist || selectedImages.length === 0) {
      toast({
        title: 'Please select 1 to 4 images',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    const primaryService = artist.services[0];
    const baseCharge = artist.charges?.[primaryService] || artist.charge || 0;

    try {
      // Map URLs to the object structure required by the AI flow
      const imageInputs = selectedImages.map(url => ({
        url,
        contentType: 'image/jpeg', // Assuming picsum.photos URLs are JPEGs
      }));

      const result = await fetchPromoImage({
        artistName: artist.name,
        artistServices: artist.services,
        artistRating: artist.rating,
        baseCharge: baseCharge,
        workImages: imageInputs,
      });

      if (result?.imageUrl) {
        setGeneratedImage(result.imageUrl);
        toast({
          title: 'Your promo image is ready!',
          description: 'You can now download or share it.',
        });
      } else {
        throw new Error('Image generation failed to return a URL.');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'An error occurred',
        description: 'Could not generate the promotional image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shareText = React.useMemo(() => {
    if (!artist) return '';
    return `Book my ${artist.services.join(' & ')} services on UtsavLook! Use my referral code ${artist.referralCode} for a ${artist.referralDiscount}% discount. Visit my profile: ${window.location.origin}/artist/${artist.id}`;
  }, [artist]);

  
  const handleDownload = () => {
      if (!generatedImage) return;
      const link = document.createElement('a');
      link.download = `utsavlook-promo-${artist?.name.replace(/\s+/g, '-')}.png`;
      link.href = generatedImage;
      link.click();
  }

  const handleShare = async () => {
     if (!generatedImage) return;
    
     try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], `utsavlook-promo.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({
                files: [file],
                title: 'UtsavLook Artist Promotion',
                text: shareText,
            });
        } else {
            // Fallback for browsers that don't support sharing files (e.g., desktop)
            handleDownload();
            navigator.clipboard.writeText(shareText);
            toast({
                title: 'Ready to Share!',
                description: 'Image downloaded and text copied to clipboard.',
                duration: 5000,
            });
        }

     } catch (error) {
         console.error('Share failed:', error);
         toast({
            title: 'Share Failed',
            description: 'Could not open share dialog. Downloading image and copying text instead.',
            variant: 'destructive',
         });
         handleDownload();
         navigator.clipboard.writeText(shareText);
     }
  }

  if (!artist) {
    return <p>Loading...</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon /> Select Your Best Work</CardTitle>
            <CardDescription>Choose 1 to 4 images from your gallery to feature in your promotional graphic.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {(artist.workImages || []).map((src, index) => (
                <div key={index} className="relative cursor-pointer group" onClick={() => handleImageSelection(src)}>
                  <NextImage
                    src={src}
                    alt={`Work ${index + 1}`}
                    width={200}
                    height={150}
                    className="rounded-md object-cover w-full aspect-[4/3]"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Checkbox
                      checked={selectedImages.includes(src)}
                      className="h-6 w-6 border-white bg-white/20 data-[state=checked]:bg-primary"
                    />
                  </div>
                  {selectedImages.includes(src) && (
                     <div className="absolute inset-0 border-4 border-primary rounded-md pointer-events-none"/>
                  )}
                </div>
              ))}
            </div>
            <Button onClick={generatePromo} disabled={isLoading || selectedImages.length === 0} className="w-full mt-4">
              {isLoading ? <><Loader2 className="mr-2 animate-spin" /> Generating...</> : <><Sparkles className="mr-2" /> Generate My Promo</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette/> AI Generated Promotion</CardTitle>
                <CardDescription>Here is your personalized, AI-enhanced promotional image. Download it or share it directly to social media.</CardDescription>
            </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="aspect-square w-full flex flex-col items-center justify-center bg-muted rounded-lg">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="mt-4 text-muted-foreground">Our AI is designing your graphic...</p>
              </div>
            ) : generatedImage ? (
              <NextImage src={generatedImage} alt="Generated promo" width={1080} height={1080} className="rounded-lg w-full" />
            ) : (
                <div className="aspect-square w-full flex flex-col items-center justify-center bg-muted rounded-lg">
                    <p className="text-muted-foreground">Your generated image will appear here.</p>
                </div>
            )}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Button onClick={handleShare} disabled={!generatedImage} className="sm:col-span-2 w-full">
                    <Share2 className="mr-2"/> Share Now
                </Button>
                <Button onClick={handleDownload} disabled={!generatedImage} variant="outline">
                    <Download className="mr-2"/> Download
                </Button>
            </div>
             <div className="relative mt-4">
                <Input value={shareText} readOnly className="pr-10"/>
                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => { navigator.clipboard.writeText(shareText); toast({ title: 'Copied promotional text!' }); }}><Copy className="h-4 w-4"/></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

