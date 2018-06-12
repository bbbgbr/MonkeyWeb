const path = require("path");
const nodeExternals = require("webpack-node-externals");
const NodemonPlugin = require("nodemon-webpack-plugin");

module.exports = {
	entry: "./src/index.ts",
	node: {
		__dirname: false
	},
	target: "node",
	devtool: "inline-source-map",
	module: {
		rules: [{
			test: /\.tsx?$/,
			use: "ts-loader",
			exclude: /node_modules/
		}]
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	mode: process.env.MODE,
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "dist")
	},
	externals: [nodeExternals()],
	plugins: [
		new NodemonPlugin()
	]
};