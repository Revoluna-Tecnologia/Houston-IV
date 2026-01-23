import type { NextConfig } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@houston/types'],

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize images
  images: {
    remotePatterns: [],
    formats: ['image/webp', 'image/avif'],
  },

  // Faster builds
  swcMinify: true,

  // Reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
    turbo: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js'],
    },
  },

  // Proxy API requests to the NestJS backend
  // This solves cross-domain cookie issues by keeping all requests on the same domain
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests (except /api/auth/* which has its own handler)
        source: '/api/:path((?!auth).*)',
        destination: `${API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
