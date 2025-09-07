const webpack = require('webpack');

module.exports = function override(config, env) {
  // Node.js 폴리필 설정
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "util": require.resolve("util/"),
    "zlib": require.resolve("browserify-zlib"),
    "stream": require.resolve("stream-browserify"),
    "url": require.resolve("url/"),
    "crypto": require.resolve("crypto-browserify"),
    "assert": require.resolve("assert/"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
    "os": false,
    "path": false
  };

  // 플러그인 추가
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  // React Refresh 문제 해결을 위한 설정
  config.resolve.alias = {
    ...config.resolve.alias,
    'process': 'process/browser.js'
  };

  return config;
};
