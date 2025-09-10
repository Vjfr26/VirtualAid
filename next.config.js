
/** @type {import('next').NextConfig} */
// Revertido: fijar backend base a IP conocida; ignorar NEXT_PUBLIC_API_URL por ahora
const backendBase = 'http://13.60.223.37/';
const nextConfig = {
  // Configuración para evitar problemas con symlinks en Windows
  webpack: (config) => {
    // Resolver problemas de symlinks en Windows
    config.resolve.symlinks = false;
    return config;
  },
  images: {
    // Desactivar optimización completamente
    unoptimized: true,
    remotePatterns: [
      // Avatares generados (dicebear)
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/7.x/**',
      },
      // Avatares placeholder
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
        pathname: '/api/portraits/**',
      },
      // Storage local (Laravel) - sirve /storage/...
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
      // Storage producción/remoto
      {
        protocol: 'http',
        hostname: '13.60.223.37',
        port: '',
        pathname: '/storage/**',
      },
      // Storage AWS (si es diferente)
      {
        protocol: 'https',
        hostname: 'api.virtualaid.us',
        port: '',
        pathname: '/storage/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase.replace(/\/$/, '')}/api/:path*`,
      },
      {
        source: '/storage/:path*',
        destination: `${backendBase.replace(/\/$/, '')}/storage/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
