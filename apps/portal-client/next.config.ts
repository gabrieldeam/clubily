import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // allow app.clubi.ly to fetch /_next/* during `next dev`
  allowedDevOrigins: ['app.clubi.ly'],

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/**',
      },
      {
        protocol: 'https',
        hostname: 'api.clubi.ly',
        port: '',                    // sem porta explícita
        pathname: '/static/**',
      },
    ],
  },

  webpack(config: any) {
    // Injeta o loader do SVGR antes da regra padrão de arquivos
    config.module.rules.unshift({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

export default nextConfig;
