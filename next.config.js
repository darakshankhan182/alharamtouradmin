/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://alharamtour-backend.vercel.app/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig