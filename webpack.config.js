var nodeExternals = require('webpack-node-externals');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path')

module.exports = {
  entry: './handler.js',
  target: 'node',
  externals: [nodeExternals()],
  plugins: [new CopyWebpackPlugin([{
    from: path.join(__dirname, "/bin/phantomjs-linux"), to: "bin/"
  }]) ],
  module: {
    loaders: []
  }
};
