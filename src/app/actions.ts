
'use server';

import { getStyleMatch, type StyleMatchInput } from "@/ai/flows/style-match";
import { getPersonalizedArtistRecommendations, type PersonalizedArtistRecommendationsInput } from "@/ai/flows/personalized-artist-recommendation";
import { generatePromoImage, type PromoImageInput } from "@/ai/flows/generate-promo-image";

export async function fetchStyleMatch(input: StyleMatchInput) {
    return await getStyleMatch(input);
}

export async function fetchRecommendations(input: PersonalizedArtistRecommendationsInput) {
    const result = await getPersonalizedArtistRecommendations(input);
    return result.artistRecommendations;
}

export async function fetchPromoImage(input: PromoImageInput) {
    return await generatePromoImage(input);
}
