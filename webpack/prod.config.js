const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// importLoader:1 from https://blog.madewithenvy.com/webpack-2-postcss-cssnext-fdcd2fd7d0bd

module.exports = {
    // devtool: 'source-map', // No need for dev tool in production

    module: {
        rules: [{
            test: /\.css$/,
            include: /node_modules\/react-month-picker/,
            use: ExtractTextPlugin.extract([
                {
                    loader: 'css-loader',
                    options: { importLoaders: 1 },
                },
            ])
        }, {
            test: /\.css$/,
            exclude: /node_modules\/react-month-picker/,
            use: ExtractTextPlugin.extract([
                {
                    loader: 'css-loader',
                    options: { importLoaders: 1 },
                },
                'postcss-loader']
            )
        }, {
            test: /\.scss$/,
            use: ExtractTextPlugin.extract([
                {
                    loader: 'css-loader',
                    options: { importLoaders: 1 },
                },
                'postcss-loader',
                {
                    loader: 'sass-loader',
                    options: {
                        data: `@import "${__dirname}/../src/static/styles/config/_variables.scss";`
                    }
                }]
            )
        }],
    },

    plugins: [
        new ExtractTextPlugin('styles/[name].css'),
        new webpack.optimize.OccurrenceOrderPlugin(),
//        new webpack.LoaderOptionsPlugin({
//          minimize: false,
//          debug: false
//        }),
//        new webpack.optimize.UglifyJsPlugin({
//            compress: {
//                warnings: false
//            }
//        })
    ]
};
