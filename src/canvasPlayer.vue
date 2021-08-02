<template>
  <div class="popup-layer">
    <div class="video-player-wrapper">
      <div id="VideoDom">
        <div id="canvasDom">
          <div v-show="showDom" id="progressBar" :class="[paused ? 'show' : '']">
            <div class="bar" @click="skipLine">
              <div
                ref="trunk"
                class="line"
                :class="['progress', paused ? 'pause' : 'play', !drag ? 'trans' : '']"
                :style="{ width: `${(playedTime / totalTime) * 100}%` }"
              ></div>
              <div id="circle" :class="{ trans: !drag }"></div>
            </div>

            <div class="left-box">
              <div href="#" class="btn">
                <button
                  class="play"
                  :class="[paused ? 'play' : 'pause']"
                  @click="changeVideoState"
                ></button>
              </div>
              <div class="total-time">{{ sToHs(playedTime) }} / {{ sToHs(totalTime) }}</div>
            </div>
            <div class="volume">
              <input type="checkbox" @click="changeVoiceStatus" />
              <svg viewBox="0 0 108 96">
                <path
                  d="M7,28 L35,28 L35,28 L59,8 L59,88 L35,68 L7,68 C4.790861,68 3,66.209139 3,64 L3,32 C3,29.790861 4.790861,28 7,28 Z"
                ></path>
                <path
                  d="M79,62 C83,57.3333333 85,52.6666667 85,48 C85,43.3333333 83,38.6666667 79,34 L49,3"
                ></path>
                <path
                  d="M95,69 C101.666667,61.6666667 105,54.3333333 105,47 C105,39.6666667 101.666667,32.3333333 95,25 L75.5,6 L49,33"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
    <i class="popup-layer-btn-close" @click="close">x</i>
    <div v-show="!showDom" class="loadEffect">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
    <section v-show="paused" class="playContainer" @click="changeVideoState">
      <li class="playBtn">
        <a href="#" title="start">Start</a>
      </li>
    </section>
  </div>
</template>

<script setup>
export default {
  data() {
    return {
      list: [],
      playerlist: [],
      // new add ===
      playIndex: 0,
      RAFCancelReq: null,
      logo: '',
      videoList: [],
      // 当前播放对象
      videoObj: {},
      // 是否暂停
      paused: true,
      // 总时长
      totalTime: 0,
      // 当前播放时长
      playedTime: 0,
      // 缓存进度条时间
      cacheCurrentTime: 0,
      endFlag: false,
      // 动态增减
      activeLength: 0,
      // 时间段节点记录,进度条快速定位
      skipDict: [],
      // 是否展示进度条
      showDom: false,
      // 是否已经绑定事件
      drag: 0,
    }
  },
  beforeDestroy() {
    this.setFree()
    console.log('desotory')
    document.removeEventListener('keydown', this.keydown)
    document.removeEventListener('mousemove', this.mousemove)
    document.removeEventListener('mouseup', this.mouseup)
    document.querySelector('#AutoCanvasId').removeEventListener('click', this.changeVideoState)
  },
  mounted() {
    let _self = this
    this.init()
    _self.playerlist = _self.list.map((item) => {
      return {
        start: parseFloat(item.playPoint.start),
        end: parseFloat(item.playPoint.end),
      }
    })
    _self.videoList = _self.list
    _self.comTotalTime()
    document.addEventListener('keydown', _self.keydown)
    _self.$nextTick(() => {
      _self.gotoPlay()
    })
  },

  methods: {
    initDrop2() {
      let _self = this
      _self.drag = 0
      let dropBtn = document.querySelector('#circle')
      //进度按钮被点击
      dropBtn.addEventListener('mousedown', function() {
        _self.drag = 1
        if (_self.videoObj && _self.videoObj.played) {
          _self.videoObj.pause()
          _self.paused = true
        }
      })
      //页面被释放
      document.addEventListener('mouseup', _self.mouseup)
      // //拖动事件
      document.addEventListener('mousemove', _self.mouseover)
      // AutoCanvasId
      document.querySelector('#AutoCanvasId').addEventListener('click', _self.changeVideoState)
    },
    setValue(touch) {
      let rate
      let _self = this
      let dropBtn = document.querySelector('#circle')
      let progress = document.querySelector('.bar')
      let oLeft = touch.offsetX //滑块最左端到父元素最左端的距离
      //拖动边界检测
      if (oLeft < 0) {
        oLeft = 0
      } else if (oLeft > progress.offsetWidth) {
        oLeft = progress.offsetWidth
      }
      let dropBtnWidth = dropBtn.offsetWidth / 2
      let durationWidth = oLeft - dropBtnWidth
      if (durationWidth < 1) {
        durationWidth = 0
      }
      //拖动实时改变进度条
      rate = (oLeft / progress.offsetWidth) * _self.totalTime
      _self.playedTime = rate
    },
    mouseup() {
      let _self = this
      if (_self.drag === 1) {
        this.skipProgress()
      }
      this.drag = 0
    },
    mouseover(e) {
      let _self = this
      if (_self.drag === 1) {
        _self.setValue(e)
      }
    },
    // 快进跳转
    skipProgress() {
      let _self = this
      let curIndex = 0
      _self.skipDict.some((item, index) => {
        if (_self.playedTime < item) {
          curIndex = index
          return true
        }
      })
      _self.endFlag = false
      _self.playIndex = curIndex
      let shortSliceTime = 0
      if (_self.playIndex == 0) {
        shortSliceTime = _self.playedTime
      } else {
        shortSliceTime = _self.playedTime - _self.skipDict[curIndex - 1 > 0 ? curIndex - 1 : 0]
      }
      // console.log("重要：", _self.playedTime, shortSliceTime);
      _self.VideoPlay(shortSliceTime)
    },
    // 点击快进跳转
    skipLine(e) {
      let _self = this
      let barBox = document.getElementById('progressBar')
      let rate = (e.offsetX / barBox.clientWidth) * _self.totalTime
      _self.playedTime = rate
      _self.skipProgress()
    },
    init() {
      this.RAF()
      this.playedTime = 0
    },
    resetVideo() {
      if (this.videoObj && !this.videoObj.paused) {
        this.videoObj.pause()
        this.paused = true
        this.playIndex = 0
      }
    },
    RAF(cb) {
      return window.requestAnimationFrame(() => {
        window.setTimeout(cb, 1000 / 60)
      })
    },
    // 计算总时长
    comTotalTime() {
      let _self = this
      let totalTime = 0
      _self.skipDict = []
      this.playerlist.map((item) => {
        let temp = item.end - item.start
        totalTime += temp
        _self.skipDict.push(totalTime)
      })
      this.totalTime = totalTime
    },
    close() {
      let _self = this
      try {
        if (typeof _self.onClose === 'function') {
          _self.onClose(_self)
        }
        setTimeout(() => {
          _self.$destroy(true)
          _self.$el.parentNode.removeChild(_self.$el)
        }, 200)
      } catch (e) {
        console.log(e)
      }
    },
    keydown(e) {
      let _self = this
      if (e.keyCode === 27) {
        // esc关闭消息
        _self.close()
      }
    },
    // add 播放器核心方法
    async gotoPlay() {
      let _self = this
      _self.playIndex = 0
      _self.paused = false
      _self.endFlag = false
      _self.VideoPlay()
    },
    // 截获当前视频播放器
    updateCurrentVideo(videoObj) {
      this.videoObj = videoObj
    },
    // 播放 || 暂停
    changeVideoState() {
      if (this.endFlag || (this.videoObj && this.videoObj.paused)) {
        if (this.playIndex == this.playerlist.length) {
          this.playedTime = 0
          this.gotoPlay()
          return
        }
        this.videoObj.play()
        this.paused = false
      } else if (this.videoObj && !this.videoObj.paused) {
        this.videoObj.pause()
        this.paused = true
      }
    },
    // 静音
    changeVoiceStatus() {
      if (this.videoObj) {
        this.videoObj.muted = !this.videoObj.muted
      }
    },
    // 核心启动逻辑
    async VideoPlay(shortSliceTime = 0) {
      let _self = this
      if (_self.playIndex + 1 > _self.videoList.length) {
        return
      }
      // console.log("_self.playIndex: " + _self.playIndex);
      // 准备工作start
      let elDom = document.querySelector('#VideoDom')
      let canvasDom = document.querySelector('#canvasDom')
      // 一、解析当前视频的各个参数 视频信息：1.当前播放路径、2.播放开始时间、3.播放结束时间、4.下部视频下标
      let currentVideo = _self.videoList[_self.playIndex]
      let currentUrl = currentVideo.url
      let currentStartTime = parseFloat(currentVideo.playPoint.start) + shortSliceTime
      let currentEndTime = parseFloat(currentVideo.playPoint.end)
      // logo信息
      let currentLogoInfo = {
        logo: _self.logo,
        position: currentVideo.logoPosition,
        videoWidth: currentVideo.width,
      }
      let nextIndex = _self.playIndex + 1
      // 当前视频 配置end

      // 二、是否有下一视频
      if (!_self.videoList[nextIndex]) {
        // 如果没有  则重置为零
        nextIndex = 0
      }
      // 如果有  则配置下一视频的基本信息 视频信息：1.当前播放路径、2.播放开始时间
      let nextVideo = _self.videoList[nextIndex]
      let nextVideoUrl = nextVideo.url
      let nextStartTime = parseFloat(nextVideo.playPoint.start)
      //下一视频 配置end

      //创建
      // 创建两部视频的Dom节点
      let videoObj = await _self.createVideo(elDom, 'AutoVideoId')
      let nextVideoObj = await _self.createVideo(elDom, 'preLoadVideoId', true)
      // 创建canvas的Dom节点
      let CanvasEle = await _self.createCanvas(canvasDom, 'AutoCanvasId') //document.getElementById('AutoCanvasId')
      let context = CanvasEle.getContext('2d')

      videoObj.src = currentUrl
      // 更新视频对象
      _self.updateCurrentVideo(videoObj)
      //视频源改变时，指定开始播放时间
      videoObj.ondurationchange = function() {
        // console.log("ondurationchange");
        videoObj.currentTime = currentStartTime
        _self.cacheCurrentTime = currentStartTime
      }
      //重新定位播放位置
      videoObj.onseeked = function() {
        // console.log("onseeked");
        _self.paused = false
        _self.videoObj.volume = 1
        let playPromise = _self.videoObj.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              _self.initDrop2()
              _self.videoObj.play()
            })
            .catch((error) => {
              console.log('sorry! 视频初始化失败', error)
            })
        }
      }
      //播放位置改变
      videoObj.ontimeupdate = function() {
        let updateTime = videoObj.currentTime - _self.cacheCurrentTime
        if (updateTime >= 0 && _self.playedTime <= _self.totalTime) {
          _self.playedTime = _self.playedTime + updateTime
          _self.cacheCurrentTime = videoObj.currentTime
        }
        if (videoObj.currentTime > currentEndTime) {
          _self.playNext(videoObj)
        }
      }

      //开始播放
      videoObj.onplay = function() {
        // console.log("onplay");
        // console.log("开始播放：", _self.videoObj.paused);
        CanvasEle.width = videoObj.width
        CanvasEle.height = videoObj.height
        _self.RAFCancelReq = _self.RAF(drawData)
        // 创建logo
        _self.createAndPutLogo(canvasDom, 'logoId', currentLogoInfo)
        // 展示进度条
        _self.showDom = true
      }

      //预加载视频
      nextVideoObj.src = nextVideoUrl
      //视频源改变时，指定开始播放时间
      nextVideoObj.ondurationchange = function() {
        // console.log("ondurationchange");
        nextVideoObj.currentTime = nextStartTime
      }

      //取消轮询
      let cancelAnimationFrame = function(flag) {
        window.cancelAnimationFrame(flag)
      }

      function drawData() {
        if (
          videoObj.ended ||
          videoObj.paused ||
          videoObj.currentTime < currentStartTime ||
          videoObj.currentTime >= currentEndTime
        ) {
          // console.log("videoObj.paused", videoObj.paused);
          cancelAnimationFrame(_self.RAFCancelReq)
          videoObj.pause()
          return
        }
        context.drawImage(videoObj, 0, 0, videoObj.width, videoObj.height)
        _self.RAF(drawData)
      }
    },
    // 创建并摆放logo
    createAndPutLogo(parentDom, domId, logoInfo) {
      this.$nextTick(() => {
        let canvasDom = document.querySelector('#AutoCanvasId')
        parentDom = parentDom || document.body
        let obj = document.getElementById(domId)
        if (!obj) {
          obj = document.createElement('img')
          obj.id = domId
          parentDom.appendChild(obj)
        }
        obj.style = {}
        obj.style.display = 'none'
        obj.style.width = `${(canvasDom.width * 150) / 1080}px`
        obj.style.position = 'absolute'
        obj.style[logoInfo.position.x] = `${(canvasDom.width / 1080) * 60}px`
        obj.style[logoInfo.position.y] = `${(canvasDom.width / 1080) * 60}px`
        obj.src = logoInfo.logo
        this.$nextTick(() => {
          obj.style.display = 'block'
        }, 10000)
      })
    },
    //根据父容器大小设置视频尺寸
    setVideoStyle(vObj) {
      let parentWidth = vObj.parentNode.getBoundingClientRect().width
      let parentHeight = vObj.parentNode.getBoundingClientRect().height
      //根据父容器宽高计算 视频缩放比例
      let scaleVal = Math.max(vObj.videoWidth / parentWidth, vObj.videoHeight / parentHeight)
      let scaleWidth = vObj.videoWidth / scaleVal
      let scaleHeight = vObj.videoHeight / scaleVal
      vObj.width = scaleWidth
      vObj.height = scaleHeight
    },

    //创建视频对象
    createVideo(parentDom, domId, isMuted = false) {
      let _self = this
      if (!domId) {
        console.warn('缺少命名ID')
        return
      }
      parentDom = parentDom || document.body
      let obj = document.getElementById(domId)
      if (!obj) {
        obj = document.createElement('Video')
        obj.id = domId
        parentDom.appendChild(obj)
        let videoSize = parseInt(document.getElementsByTagName('video').length)
        //设置视频属性
        obj.preload = 'auto'
        obj.style = 'background:#000000;display:none;position:absolute;left:100%;top:0;'
        obj.autoplay = ''
        obj.style.left = videoSize * 100 + '%'
        obj.controls = true
        obj.muted = isMuted
        obj.volume = 0.1
        //视频加载meta信息后，把自身尺寸修改了
        obj.onloadedmetadata = function() {
          // console.log('onloadedmetadata')
          _self.setVideoStyle(obj)
        }
      }
      return obj
    },
    //创建 Canvas对象
    createCanvas(parentDom, domId) {
      if (!domId) {
        console.warn('缺少命名ID')
        return
      }
      parentDom = parentDom || document.body
      let Obj = document.getElementById(domId)
      if (!Obj) {
        Obj = document.createElement('Canvas')
        Obj.id = domId
        parentDom.appendChild(Obj)
      }
      return Obj
    },

    // 播放下一曲
    playNext(curVideo) {
      let _self = this
      curVideo.pause()
      _self.playIndex++
      if (_self.playIndex > _self.list.length - 1) {
        _self.paused = true
        _self.endFlag = true
      }
      _self.VideoPlay()
    },
    sToHs(s) {
      //计算分钟
      //算法：将秒数除以60，然后下舍入，既得到分钟数
      s = parseFloat(s).toFixed(0)
      var h
      h = Math.floor(s / 60)
      //计算秒
      //算法：取得秒%60的余数，既得到秒数
      s = s % 60
      //将变量转换为字符串
      h += ''
      s += ''
      //如果只有一位数，前面增加一个0
      h = h.length == 1 ? '0' + h : h
      s = s.length == 1 ? '0' + s : s
      return h + ':' + s
    },
  },
}
</script>
<style>
@import './style/style.css';
</style>
<style lang="less" scoped>
.popup-layer {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  color: #fff;

  .video-player-wrapper {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .popup-layer-btn-close {
    position: absolute;
    right: 20px;
    top: 20px;
    width: 50px;
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
    font-style: initial;
    font-size: 40px;
    line-height: 30px;
    cursor: pointer;
    padding: 6px 0 12px;
    border-radius: 100%;
    user-select: none;
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 1);
    }
  }
}

#VideoDom {
  position: relative;
  font-size: 0;
  line-height: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  #canvasDom {
    position: relative;
    #progressBar {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      bottom: 0;
      width: 100%;
      background: rgba(0, 0, 0, 0.521);
      z-index: 99;
      opacity: 0;
      transition: all 0.5s;
      .left-box {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 50%;
        .btn {
          height: 100%;
          color: #000;
          margin-right: 2px;
          background: transparent;
          border: none;
          button {
            margin: 10px;
            padding: 0;
            box-sizing: border-box;
            border: transparent;
            background: transparent;
            user-select: none;
            &.play {
              height: 20px;
              border-style: solid;
              outline: none;
              border-width: 10px 0 10px 18px;
              border-color: transparent transparent transparent #00a1d6;
              transition: all 0.1s linear;
            }
            &.pause {
              border-style: double;
              border-width: 0px 0px 0px 18px;
              border-color: #00a1d6;
            }
          }
        }
        .total-time {
          color: #e3e3e3;
          font-size: 15px;
          line-height: 100%;
          pointer-events: none;
          user-select: none;
        }
      }

      .bar {
        display: flex;
        align-items: center;
        margin: 10px auto 0;
        width: 98%;
        height: 7px;
        border-radius: 10px;
        background: #7171716e;
        transition: all 0.2s;
        cursor: pointer;
        .line {
          position: relative;
          width: 100%;
          height: 100%;
          background: #00a1d6;
          border-radius: 5px;
          animation-timing-function: linear;
          &.trans {
            transition: all 0.5s;
          }
          &.play {
            animation-play-state: running;
          }
          &.pause {
            animation-play-state: paused;
          }
        }
        #circle {
          position: relative;
          margin-left: -4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
          pointer-events: none;
          &.trans {
            pointer-events: auto;
            transition: all 0.5s;
          }
        }
      }

      &:hover {
        .bar {
          height: 13px;
          transition: all 0.2s;
          #circle {
            height: 14px;
            width: 14px;
          }
        }
      }
      &.show {
        opacity: 1;
      }
    }
    &:hover {
      #progressBar {
        opacity: 1;
        transition: all 1s;
      }
    }
  }
}
</style>
