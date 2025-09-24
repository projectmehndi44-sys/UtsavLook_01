
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
  workImageUrls: z
    .array(z.string().url())
    .min(1)
    .max(4)
    .describe("An array of public URLs for the artist's best work images. The AI will create a collage from these."),
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
  model: 'googleai/gemini-2.5-flash-image-preview',
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
  prompt: `
    You are a professional graphic designer tasked with creating a stunning, modern, and elegant promotional image for an artist for the "UtsavLook" brand.

    **Brand Guidelines:**
    - Logo/Brand Name: "UtsavLook"
    - Primary Color (for text, accents): Rich Henna (#8B4513)
    - Accent Color (for highlights, icons): Golden Bronze (#CD7F32)
    - Background: Soft Sand (#F5F5DC) or a very light, elegant texture.
    - Title Font: A beautiful serif font (like Playfair Display).
    - Body Font: A clean sans-serif font (like Lato or Roboto).

    **Instructions:**
    1.  **Create a 1080x1080 square graphic.**
    2.  **Header:** Place the "UtsavLook" brand name in the top-left corner, styled according to the brand guidelines. In the top-right, display the artist's rating with a star icon.
    3.  **Image Collage:** Create an elegant collage using the provided images: {{{workImageUrls}}}. Do not just place them in a simple grid; arrange them artistically.
    4.  **Footer/Artist Info:** Prominently display the artist's name, their services (e.g., "Mehndi • Makeup Artist"), and their starting price (e.g., "Starts from ₹{{baseCharge}}").
    5.  **Enhance with Graphics:** Add subtle, elegant design elements that reflect an Indian wedding aesthetic. This could include soft gradients, abstract lines, or minimalist floral/paisley motifs. The final design should look premium and professionally made.
    6.  **Output:** Return ONLY the final, enhanced image. Do not return any text.

    **Artist Details:**
    - Name: {{{artistName}}}
    - Services: {{{artistServices}}}
    - Rating: {{artistRating}}
    - Starting Price: {{baseCharge}}
    - Work Images:
      {{#each workImageUrls}}
        - {{media url=this}}
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
