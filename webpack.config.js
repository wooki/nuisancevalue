const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    mode: 'development',
    entry: './src/client/clientEntryPoint.js',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: "babel-loader"
          },
          {
            test: /\.s?css$/i,
            use: [MiniCssExtractPlugin.loader, 'css-loader','sass-loader'],
          }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new CopyPlugin([
          { from: './src/assets/*', to: 'assets', flatten: true },
          { from: './src/html/*', to: '', flatten: true  }
        ])
    ]
};
