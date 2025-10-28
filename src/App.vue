<template>
  <div class="app-container">
    <DragHandle />
    <Live2DCanvas />
    <AIBubble :text="aiBubbleText" :visible="aiBubbleVisible" />
    <InputBar :visible="isInputVisible" @send="onSend" @close="onCloseInput" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import DragHandle from './components/DragHandle.vue'
import Live2DCanvas from './components/Live2DCanvas.vue'
import AIBubble from './components/AIBubble.vue'
import InputBar from './components/InputBar.vue'

declare global {
  interface Window {
    electronAPI: {
      onToggleInput: (cb: () => void) => void
      sendMessage: (message: string) => void
      onAIResponse: (cb: (response: string) => void) => void
      onAIStreamToken: (cb: (token: string) => void) => void
      onAIStreamStart: (cb: () => void) => void
      onAIStreamEnd: (cb: () => void) => void
      onAIError: (cb: (error: string) => void) => void
      startDrag: () => void
    }
  }
}

const isInputVisible = ref(false)
const aiBubbleVisible = ref(false)
const aiBubbleText = ref('')
let bubbleTimer: ReturnType<typeof setTimeout> | null = null
let currentStream = ''

function clearBubbleTimer() {
  if (bubbleTimer) {
    clearTimeout(bubbleTimer)
    bubbleTimer = null
  }
}

function toggleInput() {
  isInputVisible.value = !isInputVisible.value
}

function showAIBubble(text: string) {
  clearBubbleTimer()
  aiBubbleText.value = text
  aiBubbleVisible.value = true
  bubbleTimer = setTimeout(() => {
    aiBubbleVisible.value = false
  }, 5000)
}

function updateStreamBubble(text: string) {
  clearBubbleTimer()
  aiBubbleText.value = text
  aiBubbleVisible.value = true
}

function completeStreamBubble() {
  bubbleTimer = setTimeout(() => {
    aiBubbleVisible.value = false
    currentStream = ''
  }, 5000)
}

function onSend(message: string) {
  // @ts-ignore
  window.electronAPI?.sendMessage?.(message)
  isInputVisible.value = false
}

function onCloseInput() {
  isInputVisible.value = false
}

function setupElectronEvents() {
  // @ts-ignore
  const api = window.electronAPI
  if (!api) return
  api.onToggleInput(() => toggleInput())
  api.onAIResponse((response) => showAIBubble(response))
  api.onAIStreamStart(() => {
    currentStream = ''
    updateStreamBubble('思考中...')
  })
  api.onAIStreamToken((token) => {
    currentStream += token
    updateStreamBubble(currentStream)
  })
  api.onAIStreamEnd(() => completeStreamBubble())
  api.onAIError((error) => showAIBubble(`错误: ${error}`))
}

onMounted(() => {
  setupElectronEvents()
})

onBeforeUnmount(() => {
  clearBubbleTimer()
})
</script>

<style>
html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  margin: 0;
  padding: 0;
}
html {
  box-sizing: border-box;
}
*,
*::before,
*::after {
  box-sizing: inherit;
}
</style>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* 显示顶部拖拽条（嵌套子组件） */
.app-container:hover :deep(.drag-handle) {
  opacity: 0.2;
}
</style>