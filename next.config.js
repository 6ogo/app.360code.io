// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Add this section for proper COOP/COEP headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  // Add transpilePackages for CSS issues
  transpilePackages: ['react-toastify'],
  // Configure webpack to handle CSS properly
  webpack(config) {
    // Find the CSS rule
    const cssRule = config.module.rules.find(
      (rule) => rule.oneOf && rule.oneOf.some((r) => r.test && r.test.toString().includes('css'))
    );

    if (cssRule && cssRule.oneOf) {
      // Add specific handling for react-toastify CSS
      cssRule.oneOf.forEach((rule) => {
        if (rule.test && rule.test.toString().includes('css')) {
          // Add a specific exclusion or inclusion for react-toastify
          if (!rule.exclude) rule.exclude = [];
          if (Array.isArray(rule.exclude)) {
            rule.exclude.push(/node_modules\/react-toastify/);
          }
        }
      });

      // Add a specific rule for react-toastify
      cssRule.oneOf.unshift({
        test: /node_modules\/react-toastify.*\.css$/,
        use: ['style-loader', 'css-loader'],
      });
    }

    return config;
  },
}

module.exports = nextConfig