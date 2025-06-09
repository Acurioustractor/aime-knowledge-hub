/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['dl.airtable.com', 'img.youtube.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Ensure proper handling of dynamic routes in production
  trailingSlash: false,
  // Enable static optimization for better performance
  poweredByHeader: false,
}

module.exports = nextConfig 