import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack(config) {
    // PDF.js' prebundled runtime collides with Next's development Webpack exports.
    // The equivalent official minified ESM bundle has isolated internal symbols.
    config.resolve.alias['pdfjs-dist$'] = require.resolve('pdfjs-dist/build/pdf.min.mjs');
    return config;
  },
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
