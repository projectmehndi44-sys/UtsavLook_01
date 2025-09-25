
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
    .max(4)
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
  output: { schema: PromoImage_Background_OutputSchema },
  model: 'googleai/gemini-2.5-flash-image-preview',
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
  prompt: `
    You are a professional graphic designer. Your task is to create a single, elegant, 1080x1080 background image.

    This background will be used for a promotional graphic for the "UtsavLook" brand, which specializes in festive and wedding services like mehndi and makeup.

    **Instructions:**
    1.  Create an artistic and beautiful collage using the provided work images.
    2.  The collage should be aesthetically pleasing, suitable for a premium brand. Avoid a simple grid layout; think more creative and overlapping.
    3.  The final output must be a 1080x1080 image.
    4.  Do NOT add any text, logos, or other graphic elements. Your only job is to create the background collage from the images.

    **Work Images to use:**
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
