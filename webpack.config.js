var nodeExternals = require('webpack-node-externals');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

var handlerRegex = /\.[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;
var include = './_webpack/include.js';
var entries = {};

var doc = yaml.safeLoad(fs.readFileSync('serverless.yml', 'utf8'));

// Find all the handler files in serverless.yml
// and build the entry array with them
for (var key in doc.functions) {
  var handler = doc.functions[key].handler;
  var entryKey = handler.replace(handlerRegex, '');

  // Add error handling and source map support
  entries[entryKey] = [include, './' + entryKey + '.js'];
}

module.exports = {
  entry: './handler.js',
  target: 'node',
  devtool: 'source-map',
  externals: [/aws-sdk/, nodeExternals()],
  plugins: [new CopyWebpackPlugin([{
      from: path.join(__dirname, "/bin/phantomjs-linux"),
      to: "bin/"
    },
    {
      from: path.join(__dirname, "phantom-renderscript.js")
    }
  ])],
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      include: __dirname,
      exclude: /node_modules/,
    }]
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: 'handler.js'
  }
};
