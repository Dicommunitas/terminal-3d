const path = require('path');

module.exports = {
  mode: 'development', // ou 'production' para versão otimizada
  entry: './js/app.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'source-map',
};

// webpack.config.js
//const TerserPlugin = require('terser-webpack-plugin');

//module.exports = {
  // ... outras configurações
//  mode: 'production',
//  optimization: {
//    minimizer: [new TerserPlugin({
//      terserOptions: {
//        compress: {
//          drop_console: true,
//        },
//      },
//    })],
//  },
//};
