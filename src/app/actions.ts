
'use server';

import { styleMatch } from "@/ai/flows/style-match";
import type { StyleMatchInput, RawArtistRecommendation } from "@/lib/types";

export async function fetchStyleMatch(input: StyleMatchInput) {
    return await styleMatch(input);
}

export async function fetchRecommendations(input: any): Promise<RawArtistRecommendation[]> {
    console.log("Placeholder: fetchRecommendations called with:", input);
    // In a real app, you would call a Genkit flow here.
    return [];
}
