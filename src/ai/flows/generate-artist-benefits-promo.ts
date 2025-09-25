
'use server';
/**
 * @fileOverview An AI flow to generate a promotional image for artist benefits.
 *
 * This flow takes a list of artist benefits and uses a multimodal AI model
 * to create a professional-looking promotional graphic for social media.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BenefitSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const GenerateArtistBenefitsPromoInputSchema = z.object({
  benefits: z.array(BenefitSchema).describe("An array of benefits for artists, each with a title and description."),
});
export type GenerateArtistBenefitsPromoInput = z.infer<typeof GenerateArtistBenefitsPromoInputSchema>;

const PromoImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "The generated promotional image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
    ),
});
export type PromoImageOutput = z.infer<typeof PromoImageOutputSchema>;

const generatePromoImagePrompt = ai.definePrompt({
  name: 'generateArtistBenefitsPromoPrompt',
  input: { schema: GenerateArtistBenefitsPromoInputSchema },
  output: { schema: PromoImageOutputSchema },
  model: 'googleai/gemini-2.5-flash-image-preview',
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
  prompt: `
    You are a professional graphic designer tasked with creating a stunning, modern, and elegant promotional image for the "UtsavLook" brand to attract new artists.

    **Brand Guidelines:**
    - Logo/Brand Name: "UtsavLook"
    - Primary Color (for text, accents): Rich Henna (#8B4513)
    - Accent Color (for highlights, icons): Golden Bronze (#CD7F32)
    - Background: Soft Sand (#F5F5DC) or a very light, elegant texture with subtle Indian motifs.
    - Title Font: A beautiful, strong serif font (like Playfair Display).
    - Body Font: A clean, modern sans-serif font (like Lato or Roboto).
    - Headline: "Why Artists Love UtsavLook"

    **Instructions:**
    1.  **Create a 1080x1080 square graphic.**
    2.  **Use the provided headline prominently.**
    3.  **Create an elegant and artistic layout for the benefits provided.** Do not just list them. Arrange them in a visually appealing way, perhaps like a stylish infographic or a set of feature cards.
    4.  **For each benefit, display the title and a shortened version of the description.**
    5.  **Enhance with Graphics:** Add subtle, elegant design elements that reflect an Indian wedding aesthetic. This could include soft gradients, abstract lines, or minimalist floral/paisley motifs. The final design should look premium, professional, and highly shareable.
    6.  **Output:** Return ONLY the final, enhanced image as a data URI. Do not return any text.

    **Benefits to Include:**
    {{#each benefits}}
    - **{{title}}**: {{description}}
    {{/each}}
  `,
});

const generateArtistBenefitsPromoFlow = ai.defineFlow(
  {
    name: 'generateArtistBenefitsPromoFlow',
    inputSchema: GenerateArtistBenefitsPromoInputSchema,
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

export async function generateArtistBenefitsPromo(input: GenerateArtistBenefitsPromoInput): Promise<PromoImageOutput> {
  return generateArtistBenefitsPromoFlow(input);
}
