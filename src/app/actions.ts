
'use server';

import { styleMatch } from "@/ai/flows/style-match";
import type { StyleMatchInput } from "@/ai/flows/style-match";

export async function fetchStyleMatch(input: StyleMatchInput) {
    return await styleMatch(input);
}

    