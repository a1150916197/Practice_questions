const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // 生产环境下的优化
      if (env === 'production') {
        // 压缩优化
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                parse: {
                  ecma: 8,
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                },
                mangle: {
                  safari10: true,
                },
                output: {
                  ecma: 5,
                  comments: false,
                  ascii_only: true,
                },
              },
              parallel: true,
            }),
          ],
          splitChunks: {
            chunks: 'all',
            name: false,
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
            },
          },
          runtimeChunk: {
            name: entrypoint => `runtime-${entrypoint.name}`,
          },
        };

        // 仅在需要分析时启用此插件（可通过环境变量控制）
        if (process.env.ANALYZE === 'true') {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: 'report.html',
            })
          );
        }
      }

      return webpackConfig;
    },
  },
}; 