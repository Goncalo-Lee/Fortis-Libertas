import type { NextConfig } from "next";

// CORS Configuration
// Parse comma-separated allowed origins from environment variable.
// Each origin is trimmed and empty values are filtered out.
// Falls back to empty array if env var is unset or empty.
// Used to restrict which development domains can access this API.
const nextConfig: NextConfig = {
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")                     // Split into individual origins
    .map((origin) => origin.trim()) // Remove whitespace
    .filter(Boolean),               // Remove empty strings
};

export default nextConfig;
