/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    webpack: (config, { isServer }) => {
        // Fix for better-sqlite3
        if (isServer) {
            config.externals = config.externals || []
            config.externals.push('better-sqlite3')
        }
        return config
    },
    // Suppress hydration warnings in development
    reactStrictMode: true,
}

module.exports = nextConfig
