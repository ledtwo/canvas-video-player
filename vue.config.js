/*
 * @description: 
 * @Author: ljc
 * @Date: 2021-07-29 12:05:42
 * @LastEditors: ljc
 * @LastEditTime: 2021-07-29 12:06:33
 */
const path = require('path')
// const webpack = require('webpack')
module.exports = {
  publicPath: '/dist/',
  css: {
    extract: false,
  },
  outputDir: path.resolve(__dirname, './dist'),
  configureWebpack: {
    output: {
      filename: 'canvas-player.min.js',
      library: 'canvas-player',
      libraryTarget: 'umd',
      umdNamedDefine: true,
    },
  },
}
