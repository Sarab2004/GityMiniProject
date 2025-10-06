/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export', // Disabled for development
    trailingSlash: true,
    images: {
        unoptimized: true
    },
    experimental: {
        esmExternals: false
    }
}

module.exports = nextConfig
