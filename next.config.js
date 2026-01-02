/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
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
