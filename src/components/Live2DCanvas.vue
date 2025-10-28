<template>
  <canvas ref="canvasEl" id="canvas"></canvas>
</template>

<script setup lang="ts">
import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display'
import { onMounted, onBeforeUnmount, ref } from 'vue'

declare global {
  interface Window {
    PIXI: typeof PIXI
  }
}

const canvasEl = ref<HTMLCanvasElement | null>(null)
let app: PIXI.Application | null = null
let model: any

const modelUrl = '/live2d/hiyori_free_zh/runtime/hiyori_free_t08.model3.json'

function resizeModel() {
  if (!model) return
  const scale = Math.min(
    window.innerWidth / model.internalModel.width,
    window.innerHeight / model.internalModel.height
  )
  model.scale.set(scale)
  model.x = (window.innerWidth - model.width) / 2
  model.y = (window.innerHeight - model.height) / 2
}

onMounted(async () => {
  // 让插件能访问 window.PIXI.Ticker
  window.PIXI = PIXI

  app = new PIXI.Application({
    view: canvasEl.value as HTMLCanvasElement,
    autoStart: true,
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: true,
  })

  model = await Live2DModel.from(modelUrl)
  app.stage.addChild(model)
  resizeModel()

  // 交互命中：点击身体播放动作
  model.on('hit', (hitAreas: string[]) => {
    if (hitAreas.includes('Body')) {
      model.motion('Tap@Body')
    }
  })

  window.addEventListener('resize', resizeModel)
})

onBeforeUnmount(() => {
  try {
    window.removeEventListener('resize', resizeModel)
  } catch {}
  if (app) {
    app.destroy(true)
    app = null
  }
})
</script>
<style scoped>
/* 让 Live2D 画布在容器内自适应填满 */
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>