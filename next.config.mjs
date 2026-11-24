/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  output: "standalone",
};
export default nextConfig;
