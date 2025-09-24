
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
  htmlContent: z
    .string()
    .describe(
      'An HTML string representing the layout and content for the promo card. This will be rendered to an image and used as the base for the final graphic.'
    ),
  artistName: z.string().describe("The artist's name."),
  styleTags: z.array(z.string()).describe("A list of the artist's style tags (e.g., 'bridal', 'minimalist')."),
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
  model: 'googleai/gemini-pro-vision',
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
  prompt: `
    You are a professional graphic designer tasked with creating a stunning, modern, and elegant promotional image for an artist named {{{artistName}}}.
    You will be given a base image that contains a collage of the artist's work and their details.
    Your job is to enhance this base image to make it look like a high-end social media post.

    Instructions:
    1.  **Analyze the Style:** Look at the artist's work in the collage and their style tags: {{{styleTags}}}. The final design should reflect this style (e.g., if the tags include 'minimalist', the design should be clean and elegant; if 'traditional', use classic motifs).
    2.  **Enhance, Don't Erase:** Do NOT remove or obscure the artist's name, their work images, or the UtsavLook logo. You can add graphical elements around them.
    3.  **Add Graphical Flourishes:** Add subtle, elegant design elements. This could include soft gradients, abstract lines, floral motifs (if relevant to mehndi/weddings), or modern shapes. The goal is to make the card look professionally designed, not just a plain collage.
    4.  **Maintain Readability:** Ensure all text remains perfectly readable.
    5.  **Output:** Return only the final, enhanced image. Do not return any text.

    Here is the base image to work with:
    {{media url=htmlContent}}
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
