/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'picsum.photos', 'localhost', 'placehold.co', 'th.bing.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Remove swcMinify as it's deprecated in Next.js 15.x
  experimental: {
    // Add any experimental features if needed
  },
  // Enable webpack 5 features
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig; 