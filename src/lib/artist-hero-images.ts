
export type ArtistHeroImage = {
  alt: string;
  imageUrl: string;
};

/**
 * IMPORTANT:
 * 1. Upload your new hero images to the `artist-page-hero/` folder in your Firebase Storage bucket.
 * 2. Get the "Download URL" for each uploaded image.
 * 3. Replace the placeholder `imageUrl` values below with your actual Download URLs.
 */
export const artistHeroImages: ArtistHeroImage[] = [
  { 
    alt: 'An artist carefully applying intricate henna on a client\'s hand', 
    // Replace this placeholder URL
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-163529036-f9a8c.firebasestorage.app/o/artist-page-hero%2Fartist-hero-1.jpg?alt=media' 
  },
  { 
    alt: 'A makeup artist focused on applying eyeshadow to a client', 
    // Replace this placeholder URL
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-163529036-f9a8c.firebasestorage.app/o/artist-page-hero%2Fartist-hero-2.jpg?alt=media' 
  },
  { 
    alt: 'A photographer capturing a moment during a pre-wedding shoot', 
    // Replace this placeholder URL
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-163529036-f9a8c.firebasestorage.app/o/artist-page-hero%2Fartist-hero-3.jpg?alt=media' 
  },
  { 
    alt: 'A collection of professional makeup brushes and palettes neatly arranged', 
    // Replace this placeholder URL
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-163529036-f9a8c.firebasestorage.app/o/artist-page-hero%2Fartist-hero-4.jpg?alt=media'
  },
];
