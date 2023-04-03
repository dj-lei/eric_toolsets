const { defineConfig } = require('@vue/cli-service')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [new MiniCssExtractPlugin()],
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        productName: "narrator",
        appId: "narrator",
        publish: [
          {
            "provider": "generic",
            // "url": "http://localhost:8001/download"
            "url": "http://10.166.152.87/share/download"
          }
        ],
        extraFiles: [
          {
            "from": "src/python/dist/text_analysis",
            "to": "resources/text_analysis"
          },
          {
            "from": "src/config",
            "to": "resources/config"
          }
        ]
      }
    }
  }
})
