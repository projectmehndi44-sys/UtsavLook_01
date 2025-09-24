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
import { toPng } from 'html-to-image';
import { fetchPromoImage } from '@/app/actions';
import { Badge } from '@/components/ui/badge';

export default function PromotePage() {
  const { artist } = useArtistPortal();
  const { toast } = useToast();

  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const promoCardRef = React.useRef<HTMLDivElement>(null);

  const handleImageSelection = (imageUrl: string) => {
    setSelectedImages((prev) => {
      if (prev.includes(imageUrl)) {
        return prev.filter((url) => url !== imageUrl);
      }
      if (prev.length >= 4) {
        toast({
          title: 'Maximum 4 images allowed',
          variant: 'destructive',
        });
        return prev;
      }
      return [...prev, imageUrl];
    });
  };

  const generatePromo = async () => {
    if (!artist || !promoCardRef.current || selectedImages.length === 0) {
      toast({
        title: 'Please select at least one image',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
      // Create a high-quality base image from the HTML layout
      const baseImage = await toPng(promoCardRef.current, { quality: 1.0, pixelRatio: 2 });

      // Send to the Genkit flow for AI enhancement
      const result = await fetchPromoImage({
        htmlContent: baseImage,
        artistName: artist.name,
        styleTags: artist.styleTags || [],
      });

      if (result?.imageUrl) {
        setGeneratedImage(result.imageUrl);
        toast({
          title: 'Your promo image is ready!',
          description: 'You can now download or share it.',
        });
      } else {
        throw new Error('Image generation failed.');
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

  const copyShareText = () => {
    if (!artist) return;
    const shareText = `Book my ${artist.services.join(' & ')} services on UtsavLook! Use my referral code ${artist.referralCode} for a ${artist.referralDiscount}% discount on your first booking. Visit my profile: ${window.location.origin}/artist/${artist.id}`;
    navigator.clipboard.writeText(shareText);
    toast({ title: 'Copied to clipboard!' });
  };
  
  const handleDownload = () => {
      if (!generatedImage) return;
      const link = document.createElement('a');
      link.download = `utsavlook-promo-${artist?.name.replace(/\s+/g, '-')}.png`;
      link.href = generatedImage;
      link.click();
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
            <CardDescription>Choose up to 4 images from your gallery to feature in your promotional graphic.</CardDescription>
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
              {isLoading ? <><Loader2 className="mr-2" /> Generating...</> : <><Sparkles className="mr-2" /> Generate My Promo</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette/> AI Generated Promotion</CardTitle>
                <CardDescription>Here is your personalized, AI-enhanced promotional image. Download it or copy the share text below.</CardDescription>
            </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="aspect-video w-full flex flex-col items-center justify-center bg-muted rounded-lg">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="mt-4 text-muted-foreground">Our AI is designing your graphic...</p>
              </div>
            ) : generatedImage ? (
              <NextImage src={generatedImage} alt="Generated promo" width={1080} height={1080} className="rounded-lg w-full" />
            ) : (
                <div className="aspect-video w-full flex flex-col items-center justify-center bg-muted rounded-lg">
                    <p className="text-muted-foreground">Your generated image will appear here.</p>
                </div>
            )}
             <div className="grid grid-cols-2 gap-4 mt-4">
                <Button onClick={handleDownload} disabled={!generatedImage}><Download className="mr-2"/> Download Image</Button>
                <Button onClick={copyShareText} variant="outline"><Copy className="mr-2"/> Copy Share Text</Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Hidden div for html-to-image to render the base layout */}
        <div className="absolute -left-[9999px]">
          <div ref={promoCardRef} style={{ width: 1080, height: 1080, background: 'white', padding: '40px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#8B4513' }}>UtsavLook</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star style={{color: '#CD7F32'}}/>
                    <span style={{fontSize: '32px', fontWeight: 'bold'}}>{artist.rating}</span>
                </div>
            </div>
             <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px 0' }}>
                {selectedImages.slice(0, 4).map((src, i) => (
                    <img key={i} src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} alt="" crossOrigin="anonymous"/>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '64px', fontWeight: 'bold', margin: 0, lineHeight: 1.2 }}>{artist.name}</h2>
                    <p style={{ fontSize: '32px', margin: 0, textTransform: 'capitalize' }}>{artist.services.join(' • ')} Artist</p>
                </div>
                 <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '28px', margin: 0 }}>Starts from</p>
                    <p style={{ fontSize: '48px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center' }}>
                       ₹{Math.min(...Object.values(artist.charges).filter(Boolean) as number[]).toLocaleString()}
                    </p>
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
