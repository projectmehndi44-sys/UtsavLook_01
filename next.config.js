

const withPWA = require('next-pwa');

const nextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // This is to fix a bug with genkit where it uses an old version of handlebars
    // that is not compatible with webpack.
    config.resolve.alias = {
      ...config.resolve.alias,
      'handlebars': 'handlebars/dist/handlebars.js',
    }
    return config
  },
  experimental: {
    serverActions: {
      maxDuration: 120, // Increase timeout to 2 minutes for AI operations
      bodySizeLimit: '4mb', // Allow larger image uploads
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
};

// Correctly merge the PWA config with the main Next.js config
const finalConfig = withPWA(pwaConfig)(nextConfig);

module.exports = finalConfig;
