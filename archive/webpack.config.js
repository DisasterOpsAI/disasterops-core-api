import path from 'path';
import nodeExternals from 'webpack-node-externals';
module.exports = {
  entry: { index: './src/index.js' },
  target: 'node',
  externals: [nodeExternals()],
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '.webpack'),
    filename: '[name].js',
  },
  mode: 'production',
};
