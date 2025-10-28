<template>
  <div class="drag-handle" title="拖拽窗口" @mousedown="onMouseDown" />
</template>

<script setup lang="ts">
function onMouseDown() {
  // 调用主进程拖动窗口
  // 需确保在 preload 中已暴露 electronAPI.startDrag
  // 见 [preload.ts](src/preload.ts:36)
  // @ts-ignore - 若无全局类型可选在后续添加 d.ts
  window.electronAPI?.startDrag?.();
}
</script>
<style scoped>
.drag-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 5%;
  background: #676767;
  cursor: move;
  z-index: 90;
  opacity: 0;
  transition: opacity 0.2s ease;
}
</style>