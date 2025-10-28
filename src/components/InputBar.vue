<template>
  <div class="input-container" :class="{ hidden: !visible }">
    <input
      type="text"
      ref="inputRef"
      class="user-input"
      v-model="message"
      placeholder="说点什么吧..."
      autocomplete="off"
      @keydown.enter.prevent="onSend"
      @keydown.escape.prevent="onClose"
    />
    <button class="send-btn" @click="onSend">发送</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'send', message: string): void; (e: 'close'): void }>()
const message = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function onSend() {
  const text = message.value.trim()
  if (!text) return
  emit('send', text)
  message.value = ''
}

function onClose() {
  emit('close')
}

watch(
  () => props.visible,
  (v) => {
    if (v) nextTick(() => inputRef.value?.focus())
  }
)
</script>
<style scoped>
.input-container {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: input-slide-up 0.3s ease-out;
  z-index: 100;
}

@keyframes input-slide-up {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.user-input {
  width: 180px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 15px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei",
    sans-serif;
}

.user-input:focus {
  border-color: #667eea;
}

.send-btn {
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei",
    sans-serif;
}

.send-btn:hover {
  opacity: 0.9;
}

.send-btn:active {
  opacity: 0.8;
}

/* 与该组件模板配套的隐藏类 */
.hidden {
  display: none !important;
}
</style>