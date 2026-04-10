import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // 【重要】experimental の中ではなく、外に出します
  outputFileTracingExcludes: {
    '*': [
      'tmp/**/*',
      './tmp/**/*',
      '**/tmp/**/*',
      '**/*.zip',
      'node_modules/.cache/**/*',
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
  env: {
    APP_URL: process.env.NODE_ENV === 'production' 
      ? 'https://firebasejapan.com' 
      : 'http://localhost:9002',
  },
  // experimental の中身は空にするか、このブロック自体を消してもOKです
  experimental: {},
};

export default nextConfig;