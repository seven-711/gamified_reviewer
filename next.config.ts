import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['alasql'],
  turbopack: {},
  outputFileTracingIncludes: {
    '/api/admin/tests': ['./public/data/**/*', './public/img/afp_reviewer_imgs/quantitative_reasoning/**/*'],
  },
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
