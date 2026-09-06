import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/canvas',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
