var path = require('path')
export default {
  entry: path.resolve(__dirname, 'app/main.js'),
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.(j|t)sx$/,
        loader: 'babel',
      },
      {
        test: /\.s?css$/,
        loader: 'style!css!sass',
      },
    ],
  },
}
