// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 监听快捷键触发事件
  onToggleInput: (callback: () => void) => {
    ipcRenderer.on('toggle-input', callback);
  },
  // 发送用户输入的消息
  sendMessage: (message: string) => {
    ipcRenderer.send('user-message', message);
  },
  // 监听AI回复 - 完整响应（兼容旧版）
  onAIResponse: (callback: (response: string) => void) => {
    ipcRenderer.on('ai-response', (_event, response) => callback(response));
  },
  // 监听AI流式输出 - token by token
  onAIStreamToken: (callback: (token: string) => void) => {
    ipcRenderer.on('ai-stream-token', (_event, token) => callback(token));
  },
  // 监听AI流式输出开始
  onAIStreamStart: (callback: () => void) => {
    ipcRenderer.on('ai-stream-start', callback);
  },
  // 监听AI流式输出结束
  onAIStreamEnd: (callback: () => void) => {
    ipcRenderer.on('ai-stream-end', callback);
  },
  // 监听AI错误
  onAIError: (callback: (error: string) => void) => {
    ipcRenderer.on('ai-error', (_event, error) => callback(error));
  },
  // 发送开始拖动事件
  startDrag: () => {
    ipcRenderer.send('start-drag');
  },
});
