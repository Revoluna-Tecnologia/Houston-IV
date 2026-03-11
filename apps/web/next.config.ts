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

  // Reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // Turbopack configuration
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.css'],
    resolveAlias: {
      tailwindcss: require.resolve('tailwindcss/index.css', { paths: [__dirname] }),
    },
  },

  // Proxy API requests to the NestJS backend
  // File-system routes (e.g. /api/auth/[...all]) take precedence over rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
