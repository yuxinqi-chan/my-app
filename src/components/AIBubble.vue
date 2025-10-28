<template>
  <div class="ai-bubble" :class="{ hidden: !visible }">
    <div class="bubble-text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ text: string; visible: boolean }>()
</script>
<style scoped>
.ai-bubble {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 250px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 10px 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: bubble-appear 0.3s ease-out;
  z-index: 100;
}

.ai-bubble::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(255, 255, 255, 0.95);
}

.bubble-text {
  color: #333;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei",
    sans-serif;
}

@keyframes bubble-appear {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 组件内使用到的 hidden 类 */
.hidden {
  display: none !important;
}
</style>