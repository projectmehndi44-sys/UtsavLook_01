import type { MasterServicePackage, Promotion, HeroSettings } from './types';

export const masterServicePackages: MasterServicePackage[] = [
  {
    id: 'mehndi-bridal',
    name: 'Bridal Mehndi',
    service: 'mehndi',
    description: 'Exquisite and intricate mehndi designs for the bride, making your special day unforgettable.',
    image: 'https://picsum.photos/seed/smb/400/300',
    tags: ['Intricate', 'Traditional', 'Modern'],
    categories: [
      { name: 'Normal', description: 'Classic bridal designs.', basePrice: 3000, image: 'https://picsum.photos/seed/smb-normal/200/200' },
      { name: 'Premium', description: 'More detailed designs with premium henna.', basePrice: 5000, image: 'https://picsum.photos/seed/smb-premium/200/200' },
      { name: 'Ultra Premium', description: 'Full custom designs with our top artists.', basePrice: 8000, image: 'https://picsum.photos/seed/smb-ultra/200/200' },
    ],
  },
  {
    id: 'mehndi-guest',
    name: 'Guest Mehndi',
    service: 'mehndi',
    description: 'Beautiful mehndi for your guests, adding to the festive spirit of your event.',
    image: 'https://picsum.photos/seed/smg/400/300',
    tags: ['Simple', 'Elegant', 'Group'],
    categories: [
      { name: 'Normal', description: 'Simple patterns for guests.', basePrice: 500, image: 'https://picsum.photos/seed/smg-normal/200/200' },
      { name: 'Premium', description: 'More intricate options for guests.', basePrice: 800, image: 'https://picsum.photos/seed/smg-premium/200/200' },
      { name: 'Ultra Premium', description: 'Customized guest packages.', basePrice: 1200, image: 'https://picsum.photos/seed/smg-ultra/200/200' },
    ],
  },
  {
    id: 'makeup-bridal',
    name: 'Bridal Makeup',
    service: 'makeup',
    description: 'Look your absolute best on your wedding day with our professional bridal makeup services.',
    image: 'https://picsum.photos/seed/sumb/400/300',
    tags: ['HD Makeup', 'Airbrush', 'Natural Look'],
    categories: [
      { name: 'Normal', description: 'Standard HD makeup.', basePrice: 7000, image: 'https://picsum.photos/seed/sumb-normal/200/200' },
      { name: 'Premium', description: 'Airbrush makeup for a flawless finish.', basePrice: 12000, image: 'https://picsum.photos/seed/sumb-premium/200/200' },
      { name: 'Ultra Premium', description: 'Complete bridal package with celebrity artist.', basePrice: 20000, image: 'https://picsum.photos/seed/sumb-ultra/200/200' },
    ],
  },
    {
    id: 'makeup-party',
    name: 'Party Makeup',
    service: 'makeup',
    description: 'Get ready for any event with our glamorous party makeup services.',
    image: 'https://picsum.photos/seed/sump/400/300',
    tags: ['Glam', 'Evening Look', 'Subtle'],
    categories: [
      { name: 'Normal', description: 'Classic party look.', basePrice: 2500, image: 'https://picsum.photos/seed/sump-normal/200/200' },
      { name: 'Premium', description: 'Advanced techniques and products.', basePrice: 4000, image: 'https://picsum.photos/seed/sump-premium/200/200' },
      { name: 'Ultra Premium', description: 'Full glam with our top makeup artists.', basePrice: 6000, image: 'https://picsum.photos/seed/sump-ultra/200/200' },
    ],
  },
  {
    id: 'photo-prewedding',
    name: 'Pre-Wedding Shoot',
    service: 'photography',
    description: 'Capture your love story with a beautiful and cinematic pre-wedding photoshoot.',
    image: 'https://picsum.photos/seed/spp/400/300',
    tags: ['Candid', 'Cinematic', 'Outdoor'],
    categories: [
      { name: 'Normal', description: '4-hour shoot, 1 location.', basePrice: 15000, image: 'https://picsum.photos/seed/spp-normal/200/200' },
      { name: 'Premium', description: '8-hour shoot, 2 locations, drone shots.', basePrice: 25000, image: 'https://picsum.photos/seed/spp-premium/200/200' },
      { name: 'Ultra Premium', description: 'Full day shoot, multiple locations, cinematic video.', basePrice: 40000, image: 'https://picsum.photos/seed/spp-ultra/200/200' },
    ],
  },
  {
    id: 'photo-wedding',
    name: 'Wedding Photography',
    service: 'photography',
    description: 'Comprehensive coverage of your wedding day, capturing every precious moment.',
    image: 'https://picsum.photos/seed/spw/400/300',
    tags: ['Candid', 'Traditional', 'Full Coverage'],
    categories: [
      { name: 'Normal', description: 'One day coverage, 2 photographers.', basePrice: 50000, image: 'https://picsum.photos/seed/spw-normal/200/200' },
      { name: 'Premium', description: 'Two day coverage, 3 photographers, album.', basePrice: 80000, image: 'https://picsum.photos/seed/spw-premium/200/200' },
      { name: 'Ultra Premium', description: 'Full event coverage, cinematic video, luxury album.', basePrice: 150000, image: 'https://picsum.photos/seed/spw-ultra/200/200' },
    ],
  },
];


export const promotions: Promotion[] = [
    {
        "id": "promo_1721210080000",
        "code": "WELCOME10",
        "discount": 10,
        "usageLimit": 1,
        "isActive": true,
        "expiryDate": "2025-12-31"
    },
    {
        "id": "promo_1721210140000",
        "code": "UTSAV20",
        "discount": 20,
        "usageLimit": 0,
        "isActive": true,
        "expiryDate": "2024-12-31"
    }
];


export const heroSettings: HeroSettings = {
    slideshowText: "Artistry for Every Occasion"
};
