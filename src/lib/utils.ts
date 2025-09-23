import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore";
import { parseISO, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSafeDate(date: any): Date {
    if (!date) return new Date();
    if (date instanceof Date && isValid(date)) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') {
        const parsed = parseISO(date);
        if (isValid(parsed)) return parsed;
    }
    return new Date();
}
