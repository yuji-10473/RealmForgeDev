import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    APP_URL: process.env.NODE_ENV === 'production' 
      ? 'https://firebasejapan.com' 
      : 'http://localhost:9002',
  },
  // スタンドアロン出力時のファイル除外設定
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'tmp/**/*',     // tmpフォルダの中身をすべて除外
        '**/*.zip',     // ZIPファイルを除外
        'node_modules/.cache/**/*', // npmのキャッシュを除外
      ],
    },
  },
};

export default nextConfig;
