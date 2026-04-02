const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true, // 移除 console
            },
            mangle: true, // 变量名混淆
            keep_classnames: false, // 不保留类名
            keep_fnames: false, // 不保留函数名
          },
        }),
      ];
      return webpackConfig;
    },
  },
}; 