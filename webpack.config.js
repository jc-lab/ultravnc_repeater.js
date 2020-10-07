// Combined 'require' statements
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const frontConfig = {
  target: 'web',
  entry: {
    app: ['./src/front/entry.js']
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'public/bundle.js',
  },
  devServer: {
    host: '0.0.0.0', // Required for docker
    publicPath: '/assets/',
    contentBase: path.resolve(__dirname, './views'),
    watchContentBase: true,
    compress: true,
    port: 9001
  },
  devtool: 'inline-source-map',
}

const backConfig = {
  target: 'node',
  entry: {
    app: ['./src/entry.ts']
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'app.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  'targets': {
                    'node': 'current'
                  }
                }
              ],
              '@babel/preset-typescript'
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-classes',
              // '@babel/plugin-transform-runtime'
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: 'public' }
      ],
    }),
  ],
}

// Combined 'module.exports'
module.exports = [ frontConfig, backConfig ];
