const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js modules needed by axios and other packages
config.resolver.extraNodeModules = {
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  stream: require.resolve('stream-browserify'),
  url: require.resolve('url'),
  util: require.resolve('util'),
  zlib: require.resolve('browserify-zlib'),
  assert: require.resolve('assert'),
  buffer: require.resolve('buffer'),
  tty: require.resolve('tty-browserify'), // Required by debug package
  // Disable modules that can't be polyfilled
  http2: false,
  net: false,
  tls: false,
  fs: false,
  os: false,
  path: false,
  crypto: false,
};

module.exports = config;