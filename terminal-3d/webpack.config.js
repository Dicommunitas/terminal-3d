const path = require('path');

module.exports = {
  mode: 'development',
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
  devServer: {
    static: {
      directory: path.join(__dirname, '/'),
    },
    host: '0.0.0.0',  // Permitir conexões de qualquer host
    allowedHosts: 'all',  // Permitir todos os hosts
    port: 8080,
    hot: true,
    headers: {
      "Access-Control-Allow-Origin": "*",  // Para permitir CORS
    }
  }
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
