/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    // Allow images from Supabase Storage and common image CDNs
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      // Unsplash for demo/placeholder images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  
  async redirects() {
    return [
      // Canonicalize auth routes: /sign-up -> /signup
      {
        source: '/sign-up',
        destination: '/signup',
        permanent: true,
      },
      // /login -> /sign-in for convenience
      {
        source: '/login',
        destination: '/sign-in',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
