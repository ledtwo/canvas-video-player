# Canvas Video Player 🎬

![npm](https://img.shields.io/npm/v/canvas-video-player)
![license](https://img.shields.io/github/license/ledtwo/canvas-video-player)
![stars](https://img.shields.io/github/stars/ledtwo/canvas-video-player?style=social)

A lightweight, seamless video mashup player rendered via `<canvas>`. Designed specifically for multi-video source splicing, short video sequence playback, and lightweight video preview scenarios on the Web.

## ✨ Core Features

* **Seamless Mashup Experience**: Say goodbye to the black screens, stuttering, and loading delays common when switching between traditional `<video>` tags. By drawing the underlying frames onto a Canvas, it achieves a truly seamless transition.
* **Precise Fragment Clipping**: Supports configuring independent playback periods (`start` / `end`) for each video source, rendering specific video segments exactly as needed.
* **Customizable Watermarks**: Built-in logo overlay functionality allows you to set the watermark position (e.g., top-left, bottom-right) independently for different video sources.
* **Minimalist API Design**: A highly encapsulated plugin approach. No need to mount cluttered DOM elements in your templates—invoke the player on the front end with just one line of code.
* **High-Performance Rendering**: Directly manipulates the Canvas to draw video streams, ensuring silky-smooth visual transitions.

## 🚀 Live Demo

Experience it online: [http://canvas-v.epochy.cn/](http://canvas-v.epochy.cn/)

## 📦 Installation

You can install it via npm or yarn:

```bash
npm install canvas-video-player
# OR
yarn add canvas-video-player
🛠️ Quick Start
The current version is deeply optimized for the Vue 2.x environment.

1. Global Registration (main.js)
JavaScript
import Vue from 'vue';
import canvasPlayer from "canvas-video-player";

Vue.use(canvasPlayer);
2. In-Component Invocation
Call the player directly via the $canvasVideoPlayer method without intruding on your existing HTML structure.

代码段
<template>
  <div id="app">
    <button @click="playVideo">▶️ Play Mashup Sequence</button>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      playlist: [
        {
          url: '[https://example.com/video1.mp4](https://example.com/video1.mp4)',
          width: 1080, // Canvas width for the video
          height: 1920, // Canvas height for the video
          logoPosition: { x: 'left', y: 'top' },
          playPoint: { start: '0', end: '3.120000' } // Play only the first 3.12 seconds
        },
        {
          url: '[https://example.com/video2.mp4](https://example.com/video2.mp4)',
          width: 1080,
          height: 1920,
          logoPosition: { x: 'right', y: 'bottom' },
          playPoint: { start: '1.5', end: '5.0' } // Continue playing from 1.5 seconds
        }
        // Supports an unlimited number of video fragments
      ]
    }
  },
  methods: {
    playVideo() {
      // Pass the playlist to invoke the player
      this.$canvasVideoPlayer(this.playlist);
    }
  }
}
</script>

🗺️ Roadmap
[x] Deep plugin support for Vue 2.x

[ ] Provide a pure Vanilla JS core library independent of any framework

[ ] Expand support for modern frameworks (e.g., React Hooks / Component ecosystem compatibility)

[ ] Add more video transition effects (Fade, Wipe, etc.)

📄 License
MIT License
