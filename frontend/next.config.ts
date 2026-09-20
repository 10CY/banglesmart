
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "banglesmart.onrender.com",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;