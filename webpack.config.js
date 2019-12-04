const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/client/clientEntryPoint.js',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    module: {
        loaders: [
            { test: /\.css$/, loader: 'style!css' },
            {
                test: /\.scss$/,
                loaders: ['style-loader', 'raw-loader', 'sass-loader']
            },
            {
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'node_modules/lance-gg/'),
                    fs.realpathSync('./node_modules/lance-gg/')
                ],
                loader: 'babel-loader',
                query: {
                    presets: ['@babel/preset-env'].map(require.resolve)
                }
            }
        ]
    },
    plugins: [
        new CopyPlugin([
          { from: './src/assets/*', to: 'assets', flatten: true },
          { from: './src/html/*', to: '', flatten: true  }
        ])
    ]
};
