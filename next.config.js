/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://alharamtourbackend.vercel.app/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig