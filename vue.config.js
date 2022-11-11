const { defineConfig } = require('@vue/cli-service')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [new MiniCssExtractPlugin()],
  },
  pluginOptions: {
    electronBuilder: {
      // preload: 'src/preload.js',
      nodeIntegration: true,
      // Or, for multiple preload files:
      // preload: { preload: 'src/preload.js', otherPreload: 'src/preload2.js' }
    }
   }
})
