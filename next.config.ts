import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fhwwhnlitglocotdthpb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-ignore - Ignore type error for ESLint config option in edge cases
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
