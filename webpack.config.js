var webpack = require("webpack"),
  path = require("path"),
  fileSystem = require("fs"),
  env = require("./utils/env"),
  CleanWebpackPlugin = require("clean-webpack-plugin"),
  CopyWebpackPlugin = require("copy-webpack-plugin"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  WriteFilePlugin = require("write-file-webpack-plugin")
;

const jsPath = path.join(__dirname, 'src/js');

var fileExtensions = ["jpg", "jpeg", "png", "gif", "eot", "otf", "svg", "ttf", "woff", "woff2"];

var options = {
  entry: {
    popup: path.join(__dirname, "src", "js", "popup.js"),
    options: path.join(__dirname, "src", "js", "options.js"),
    background: path.join(__dirname, "src", "js", "background.js"),
    newtab: path.join(__dirname, "src", "js", "newtab.js"),
    contentScript: path.join(__dirname, "src", "js", "content-script.js")
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
        exclude: /node_modules/
      },
      {
        test: new RegExp('\.(' + fileExtensions.join('|') + ')$'),
        loader: "file-loader?name=[name].[ext]",
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        exclude: /node_modules/
      }, {
				test: /\.(sass|scss)$/,
				use: [{
            loader: "style-loader" // creates style nodes from JS strings
        }, {
            loader: "css-loader" // translates CSS into CommonJS
        }, {
            loader: "sass-loader" // compiles Sass to CSS
        }]
			}
    ]
  },
  resolve: {
    //alias: alias
    extensions: ['.js'],
		alias : {
			js: jsPath,
			tiles: path.join( jsPath, 'react-tiles/src' ),
			modules: path.join( jsPath, 'newtab/modules' ),
      utils: path.join( jsPath, 'newtab/utils'),
			state: path.join( jsPath, 'newtab/state')
		}
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(["build"]),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    }),
    new CopyWebpackPlugin([{
      from: "src/manifest.json",
      transform: function (content, path) {
        // generates the manifest file using the package.json informations
        var all = Object.assign(JSON.parse(content.toString()), {
          description: process.env.npm_package_description,
          version: process.env.npm_package_version,
        });
        return Buffer.from(JSON.stringify(all));
      }
    }]),
    new CopyWebpackPlugin([{
      from: "src/fonts",
      to: "fonts",
      toType: "dir"
    }]),
    new CopyWebpackPlugin([{
      from: "images",
      to: "images",
      toType: "dir",
      ignore: ["s3.json"]
    }]),
    new CopyWebpackPlugin([{
      from: "src/img",
      to: "img",
      toType: "dir"
    }]),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"]
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "options.html"),
      filename: "options.html",
      chunks: ["options"]
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "background.html"),
      filename: "background.html",
      chunks: ["background"]
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "newtab.html"),
      filename: "newtab.html",
      chunks: ["newtab"]
    }),
    new WriteFilePlugin()
  ],
  chromeExtensionBoilerplate: {
    notHotReload: ["contentScript"]
  }
};

if (env.NODE_ENV === "development") {
  options.devtool = "eval-source-map";
}

module.exports = options;
