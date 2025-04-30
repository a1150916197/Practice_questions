const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: 2, // 限制并行处理的数量
        terserOptions: {
          compress: {
            drop_console: true, // 移除console
          },
        },
      }),
    ],
    splitChunks: {
      chunks: 'all', // 分割所有代码块
      maxInitialRequests: 10, // 最大初始化请求数
      minSize: 0, // 最小分块大小
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // 为不同的npm包创建不同的缓存组
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `npm.${packageName.replace('@', '')}`;
          }
        }
      }
    },
    runtimeChunk: {
      name: entrypoint => `runtime-${entrypoint.name}`,
    },
  },
  performance: {
    hints: false, // 关闭性能提示
  },
}; 