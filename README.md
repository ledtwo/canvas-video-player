# canvas-video-player 使用canvas渲染的视频混剪播放器

## 安装
```
npm i canvas-video-player
//or
yarn add canvas-video-player
```

## 使用方式

在Vue2.x项目中使用，首先需要在main.js中引入、全局注册
```
import canvasPlayer from "canvas-video-player"

Vue.use(canvasPlayer)
```
在要使用的组件中，采用API的方式调用
例如：
```
<template>
  <div id="app">
    <button @click="play">我是视频播放器</button>
  </div>
</template>

<script>

export default {
  name: 'App',
   data() {
    return {
      list: [
        {
          url: '**视频地址1**',
          // 视频的尺寸
          width: 1080,
          height: 1920,
          // 摆放logo的位置
          logoPosition: {
            x: 'left',
            y: 'top',
          },
          // 播放截取的时段
          playPoint: {
            end: '3.120000',
            start: '0',
          },
        },
        {
          url: '**视频地址2**',
          // 视频的尺寸
          width: 1080,
          height: 1920,
          // 摆放logo的位置
          logoPosition: {
            x: 'left',
            y: 'top',
          },
          // 播放截取的时段
          playPoint: {
            end: '3.120000',
            start: '0',
          },
        },
        //...不限制视频个数，无限多
      ],
    }
  },
  methods:{
    play(){
      this.$canvasVideoPlayer(this.list)
    }
  }
}
</script>
```