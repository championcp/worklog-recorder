/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Transpile antd and @ant-design/icons for compatibility
  transpilePackages: ['antd', '@ant-design/icons'],
  // SQLite数据库配置
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('sqlite3', 'better-sqlite3');
    }
    return config;
  },
  // 环境变量配置
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'sqlite:./data/nobody-logger.db',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  // PWA配置预留
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  // },
};

module.exports = nextConfig;