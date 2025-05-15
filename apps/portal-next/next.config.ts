// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Se você estiver no Next ≥13.4, pode usar a flag experimental:
  // experimental: {
  //   svgr: true,
  // },

  webpack(config) {
    // Injeta o loader do SVGR antes da regra padrão de arquivos
    config.module.rules.unshift({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
