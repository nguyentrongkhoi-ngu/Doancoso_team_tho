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
    // Handle ESM packages
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Handle react-pdf ESM imports
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
    });

    return config;
  },

  // Transpile ESM packages
  transpilePackages: ['@react-pdf/renderer'],
};

module.exports = nextConfig; 