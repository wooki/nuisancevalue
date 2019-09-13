const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {

	mode: 'development',

	entry: {
		index: './src/index.js',
		server: './src/server.js',
		game: './src/game.js'
	},

	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'build')
	},

	plugins: [
	    new MiniCssExtractPlugin({
	      // Options similar to the same options in webpackOptions.output
	      // all options are optional
	      filename: '[name].css',
	      chunkFilename: '[id].css',
	      ignoreOrder: false, // Enable to remove warnings about conflicting order
	    })
	],

	module: {
		rules: [
			{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
			{ test: /\.(png|svg|jpg|gif)$/, use: [ 'file-loader' ] },
			{
		        test: /\.scss$/,
		        use: [
		          // 'style-loader', // creates style nodes from JS strings
		          MiniCssExtractPlugin.loader,
		          { loader: 'css-loader',
		            options: {
						modules: {
					        // localIdentName: "[hash:base64]" // production
					        localIdentName: "[path][name]__[local]__[hash:base64:5]"
					    },
					    localsConvention: 'camelCase',
						sourceMap: true
		           	}
		          },
		          'sass-loader', // compiles Sass to CSS, using Node Sass by default
		        ],
		      }
		]
	}
};