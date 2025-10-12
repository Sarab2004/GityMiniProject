/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export', // Disabled for development
    trailingSlash: true,
    images: {
        unoptimized: true
    },
    experimental: {
        esmExternals: false
    },
    webpack: (config) => {
        config.optimization = config.optimization || {}
        config.optimization.splitChunks = {
            ...(config.optimization.splitChunks || {}),
            chunks: 'all',
            maxSize: 244000
        }
        config.optimization.minimize = false
        return config
    }
}

module.exports = nextConfig
