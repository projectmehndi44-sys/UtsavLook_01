import type { MasterServicePackage, Booking, Customer } from './types';
import { placeholderImages } from './placeholder-images.json';

const findImage = (id: string) => placeholderImages.find(p => p.id === id)?.imageUrl || 'https://picsum.photos/seed/placeholder/400/300';

export const masterServicePackages: MasterServicePackage[] = [
  {
    id: 'mehndi-bridal',
    name: 'Bridal Mehndi',
    service: 'Mehndi',
    description: 'Exquisite and intricate mehndi designs for the bride, making your special day unforgettable.',
    image: findImage('service-mehndi-bridal'),
    tags: ['Intricate', 'Traditional', 'Modern'],
    categories: [
      { name: 'Normal', description: 'Classic bridal designs.', basePrice: 3000, image: findImage('service-mehndi-bridal') },
      { name: 'Premium', description: 'More detailed designs with premium henna.', basePrice: 5000, image: findImage('service-mehndi-bridal') },
      { name: 'ULTRA PREMIUM', description: 'Full custom designs with our top artists.', basePrice: 8000, image: findImage('service-mehndi-bridal') },
    ],
  },
  {
    id: 'mehndi-guest',
    name: 'Guest Mehndi',
    service: 'Mehndi',
    description: 'Beautiful mehndi for your guests, adding to the festive spirit of your event.',
    image: findImage('service-mehndi-guest'),
    tags: ['Simple', 'Elegant', 'Group'],
    categories: [
      { name: 'Normal', description: 'Simple patterns for guests.', basePrice: 500, image: findImage('service-mehndi-guest') },
      { name: 'Premium', description: 'More intricate options for guests.', basePrice: 800, image: findImage('service-mehndi-guest') },
      { name: 'ULTRA PREMIUM', description: 'Customized guest packages.', basePrice: 1200, image: findImage('service-mehndi-guest') },
    ],
  },
  {
    id: 'makeup-bridal',
    name: 'Bridal Makeup',
    service: 'Makeup',
    description: 'Look your absolute best on your wedding day with our professional bridal makeup services.',
    image: findImage('service-makeup-bridal'),
    tags: ['HD Makeup', 'Airbrush', 'Natural Look'],
    categories: [
      { name: 'Normal', description: 'Standard HD makeup.', basePrice: 7000, image: findImage('service-makeup-bridal') },
      { name: 'Premium', description: 'Airbrush makeup for a flawless finish.', basePrice: 12000, image: findImage('service-makeup-bridal') },
      { name: 'ULTRA PREMIUM', description: 'Complete bridal package with celebrity artist.', basePrice: 20000, image: findImage('service-makeup-bridal') },
    ],
  },
    {
    id: 'makeup-party',
    name: 'Party Makeup',
    service: 'Makeup',
    description: 'Get ready for any event with our glamorous party makeup services.',
    image: findImage('service-makeup-party'),
    tags: ['Glam', 'Evening Look', 'Subtle'],
    categories: [
      { name: 'Normal', description: 'Classic party look.', basePrice: 2500, image: findImage('service-makeup-party') },
      { name: 'Premium', description: 'Advanced techniques and products.', basePrice: 4000, image: findImage('service-makeup-party') },
      { name: 'ULTRA PREMIUM', description: 'Full glam with our top makeup artists.', basePrice: 6000, image: findImage('service-makeup-party') },
    ],
  },
  {
    id: 'photo-prewedding',
    name: 'Pre-Wedding Shoot',
    service: 'Photography',
    description: 'Capture your love story with a beautiful and cinematic pre-wedding photoshoot.',
    image: findImage('service-photo-prewedding'),
    tags: ['Candid', 'Cinematic', 'Outdoor'],
    categories: [
      { name: 'Normal', description: '4-hour shoot, 1 location.', basePrice: 15000, image: findImage('service-photo-prewedding') },
      { name: 'Premium', description: '8-hour shoot, 2 locations, drone shots.', basePrice: 25000, image: findImage('service-photo-prewedding') },
      { name: 'ULTRA PREMIUM', description: 'Full day shoot, multiple locations, cinematic video.', basePrice: 40000, image: findImage('service-photo-prewedding') },
    ],
  },
  {
    id: 'photo-wedding',
    name: 'Wedding Photography',
    service: 'Photography',
    description: 'Comprehensive coverage of your wedding day, capturing every precious moment.',
    image: findImage('service-photo-wedding'),
    tags: ['Candid', 'Traditional', 'Full Coverage'],
    categories: [
      { name: 'Normal', description: 'One day coverage, 2 photographers.', basePrice: 50000, image: findImage('service-photo-wedding') },
      { name: 'Premium', description: 'Two day coverage, 3 photographers, album.', basePrice: 80000, image: findImage('service-photo-wedding') },
      { name: 'ULTRA PREMIUM', description: 'Full event coverage, cinematic video, luxury album.', basePrice: 150000, image: findImage('service-photo-wedding') },
    ],
  },
];

export const mockCustomer: Customer = {
    id: 'cust-123',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    email: 'priya.sharma@example.com',
};

export const mockBookings: Booking[] = [
    {
        id: 'booking-001',
        artistIds: ['artist-01'],
        customerId: 'cust-123',
        customerName: 'Priya Sharma',
        serviceAddress: '123, Rose Villa, Juhu, Mumbai',
        serviceDates: [new Date('2024-08-20')],
        amount: 12000,
        status: 'Completed',
        eventType: 'Wedding',
        eventDate: new Date('2024-08-20'),
        completionCode: '1234',
        items: [
            {
                id: 'item-1',
                servicePackage: masterServicePackages[2],
                selectedTier: masterServicePackages[2].categories[1],
                price: 12000
            }
        ]
    },
    {
        id: 'booking-002',
        artistIds: ['artist-02'],
        customerId: 'cust-123',
        customerName: 'Priya Sharma',
        serviceAddress: '123, Rose Villa, Juhu, Mumbai',
        serviceDates: [new Date('2024-07-15')],
        amount: 5000,
        status: 'Completed',
        eventType: 'Sangeet',
        eventDate: new Date('2024-07-15'),
        completionCode: '5678',
        items: [
            {
                id: 'item-2',
                servicePackage: masterServicePackages[0],
                selectedTier: masterServicePackages[0].categories[1],
                price: 5000
            }
        ]
    },
    {
        id: 'booking-003',
        artistIds: ['artist-03'],
        customerId: 'cust-123',
        customerName: 'Priya Sharma',
        serviceAddress: '456, Lakeview Apartments, Powai, Mumbai',
        serviceDates: [new Date('2024-12-25')],
        amount: 25000,
        status: 'Confirmed',
        eventType: 'Pre-Wedding Shoot',
        eventDate: new Date('2024-12-25'),
        completionCode: '9012',
        items: [
            {
                id: 'item-3',
                servicePackage: masterServicePackages[4],
                selectedTier: masterServicePackages[4].categories[1],
                price: 25000
            }
        ]
    },
];
