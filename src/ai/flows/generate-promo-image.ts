
'use server';
/**
 * @fileOverview An AI flow to generate a promotional social media image for an artist.
 *
 * This flow takes an artist's details and a selection of their work images and uses
 * a multimodal AI model to create a professional-looking promotional graphic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PromoImageInputSchema = z.object({
  artistName: z.string().describe("The artist's name."),
  artistServices: z.array(z.string()).describe("The services the artist provides (e.g., 'mehndi', 'makeup')."),
  artistRating: z.number().describe("The artist's average rating."),
  baseCharge: z.number().describe("The artist's starting price for services."),
  workImages: z
    .array(
      z.object({
        url: z.string(), // Can be a public URL or a data URI
        contentType: z.string(),
      })
    )
    .min(1)
    .max(6)
    .describe("An array of objects containing public URLs or data URIs for the artist's best work images."),
});
export type PromoImageInput = z.infer<typeof PromoImageInputSchema>;

const PromoImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "The generated promotional image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
    ),
});
export type PromoImageOutput = z.infer<typeof PromoImageOutputSchema>;

const generatePromoImagePrompt = ai.definePrompt({
  name: 'generatePromoImagePrompt',
  input: { schema: PromoImageInputSchema },
  output: { schema: PromoImageOutputSchema },
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
  prompt: `
    You are a professional graphic designer creating a 1080x1080 promotional image for the "UtsavLook" brand.

    **Brand Guidelines:**
    - Brand Name: "UtsavLook"
    - Colors: Use Rich Henna (#8B4513) for main text, Golden Bronze (#CD7F32) for accents, and Soft Sand (#F5F5DC) for the background.
    - Fonts: Use an elegant serif for titles and a clean sans-serif for body text.

    **Instructions:**
    1.  Create an artistic collage of the provided work images. Avoid a simple grid.
    2.  Place the "UtsavLook" brand name in the top-left corner.
    3.  If artist name is not 'New Artists', display the artist's name, services (e.g., "Mehndi • Makeup Artist"), and starting price ("Starts from ₹{{baseCharge}}").
    4.  If artist name is 'New Artists', display a call to action: "Join Our Platform & Grow Your Business".
    5.  Display the artist's rating with a star icon in the top-right corner.
    6.  The overall design must be modern, elegant, and premium.
    7.  Output ONLY the final image.

    **Artist Details:**
    - Name: {{{artistName}}}
    - Services: {{{artistServices}}}
    - Rating: {{artistRating}}
    - Starting Price: {{baseCharge}}
    - Work Images:
      {{#each workImages}}
        - {{media url=this.url contentType=this.contentType}}
      {{/each}}
  `,
});

const generatePromoImageFlow = ai.defineFlow(
  {
    name: 'generatePromoImageFlow',
    inputSchema: PromoImageInputSchema,
    outputSchema: PromoImageOutputSchema,
  },
  async (input) => {
    const { media } = await generatePromoImagePrompt(input);
    if (!media?.url) {
      throw new Error('AI model did not return an image.');
    }
    return { imageUrl: media.url };
  }
);


export async function generatePromoImage(input: PromoImageInput): Promise<PromoImageOutput> {
  return generatePromoImageFlow(input);
}
