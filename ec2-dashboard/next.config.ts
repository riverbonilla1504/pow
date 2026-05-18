import type { NextConfig } from 'next';

/** Destino del proxy server-side (no expuesto al navegador). */
const apiProxyTarget = (process.env.API_PROXY_TARGET || 'https://api.freck.lat').replace(
  /\/$/,
  '',
);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
