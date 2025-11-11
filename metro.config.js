const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js modules needed by axios and other packages
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  stream: require.resolve('stream-browserify'),
  url: require.resolve('url'),
  util: require.resolve('util'),
  zlib: require.resolve('browserify-zlib'),
  assert: require.resolve('assert'),
  buffer: require.resolve('buffer'),
  tty: require.resolve('tty-browserify'), // Required by debug package
  os: require.resolve('os-browserify/browser'), // Required by supports-color package
  crypto: require.resolve('crypto-browserify'), // Required by expo-modules-core
  'text-encoding': require.resolve('text-encoding'), // TextEncoder/TextDecoder polyfill
  http2: path.resolve(__dirname, 'web-mocks', 'http2.js'), // Stub for http2 (not needed for web)
  net: path.resolve(__dirname, 'web-mocks', 'net.js'), // Stub for net (not needed for web)
  tls: path.resolve(__dirname, 'web-mocks', 'tls.js'), // Stub for tls (not needed for web)
  fs: path.resolve(__dirname, 'web-mocks', 'fs.js'), // Stub for fs (not needed for web)
  path: path.resolve(__dirname, 'web-mocks', 'path.js'), // Stub for path (use path-browserify if needed)
  '@': path.resolve(__dirname), // Path alias support for @/
};

module.exports = config;