const path = require('path');
var nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
require('dotenv').config()
module.exports = {
    entry: './src/index.js',
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: ['ts-loader'],
            enforce: 'pre',
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'dist')
    },
    mode: process.env.MODE,
    node: {
        __dirname: false
    },
    target: 'node',
    externals: [nodeExternals()],
    plugins: [
        new NodemonPlugin(),
    ]
};