/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack }) => {
    // yahoo-finance2 includes test files in its ESM build that import
    // Deno-specific test utilities. We need to stub these out.
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /^@std\/testing/ }),
      new webpack.IgnorePlugin({ resourceRegExp: /^@gadicc\/fetch-mock-cache/ })
    );
    return config;
  },
  images: {
    domains: [],
  },
};

export default nextConfig;
