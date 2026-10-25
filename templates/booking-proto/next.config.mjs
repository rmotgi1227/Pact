/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone app with its own lockfile: don't let Next.js infer the monorepo root
  // lockfile as the tracing root when this template is edited in place in the dev worktree.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
