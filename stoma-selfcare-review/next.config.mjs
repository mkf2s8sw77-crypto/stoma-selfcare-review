const basePath = '/stoma-selfcare-review';
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  assetPrefix: basePath,
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push({ 'better-sqlite3': 'commonjs better-sqlite3' });
    return config;
  },
};
export default nextConfig;
