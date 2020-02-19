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
        // loaders: [
        //     { test: /\.css$/, loader: 'style!css' },
        //     {
        //         test: /\.scss$/,
        //         loaders: ['style-loader', 'raw-loader', 'sass-loader']
        //     },
        //     {
        //         test: /\.js$/,
        //         include: [
        //             path.resolve(__dirname, 'src'),
        //             path.resolve(__dirname, 'node_modules/lance-gg/'),
        //             fs.realpathSync('./node_modules/lance-gg/')
        //         ],
        //         loader: 'babel-loader',
        //         query: {
        //             presets: ['@babel/preset-env'].map(require.resolve)
        //         }
        //     }
        // ]
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
