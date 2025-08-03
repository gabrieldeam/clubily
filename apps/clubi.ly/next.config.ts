import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
