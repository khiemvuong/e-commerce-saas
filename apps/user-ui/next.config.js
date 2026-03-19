//@ts-check

// Suppress DEP0169 url.parse() deprecation from Next.js internals
const originalEmit = process.emit;
// @ts-ignore - process.emit override for warning suppression
process.emit = function (event, ...args) {
  if (event === 'warning' && args[0]?.name === 'DeprecationWarning' && args[0]?.code === 'DEP0169') {
    return false;
  }
  // @ts-ignore
  return originalEmit.apply(process, [event, ...args]);
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');


/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  output: 'standalone', 
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  //Image from image kit
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.favpng.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "bunchobagels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Suppress HMR WebSocket connection warnings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);

