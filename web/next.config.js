/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  output: 'standalone',
  i18n: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
    localeDetection: false,
  },
  async redirects() {
    return [
      {
        source: '/dashboard/',
        destination: '/dashboard/overview',
        permanent: false,
      },
    ]
  },
}

module .exports = nextConfig
