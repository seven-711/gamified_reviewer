import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['alasql'],
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/pdfs/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
