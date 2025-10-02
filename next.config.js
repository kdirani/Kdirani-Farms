/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   // Enable React Compiler for automatic memoization (requires babel-plugin-react-compiler)
  //   reactCompiler: true,
  //   // Note: ppr is only available in canary versions
  //   // ppr: 'incremental',
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'supabase.com',
      },
    ],
  },
  // Enable webpack bundle analyzer in development
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
