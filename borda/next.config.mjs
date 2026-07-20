/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // As fotos das peças são servidas pelo Baserow (photo_url público, /media/user_files/…).
  // É o MESMO host que o WAHA busca pra postar no grupo — se mudar aqui, confira lá.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'baserow.arvsystems.cloud', pathname: '/media/**' },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // A borda é um canal interno do Caio. Não deve aparecer em busca nenhuma,
          // mesmo com a URL vazando — mesma postura do garimpo/index.html.
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
