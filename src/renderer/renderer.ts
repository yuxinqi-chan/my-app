/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import "./index.css";

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite'
);
// TypeScript 类型声明
declare global {
  interface Window {
    electronAPI: {
      onToggleInput: (callback: () => void) => void;
      sendMessage: (message: string) => void;
      onAIResponse: (callback: (response: string) => void) => void;
      onAIStreamToken: (callback: (token: string) => void) => void;
      onAIStreamStart: (callback: () => void) => void;
      onAIStreamEnd: (callback: () => void) => void;
      onAIError: (callback: (error: string) => void) => void;
      startDrag: () => void;
    };
  }
}

// 获取DOM元素
const inputContainer = document.getElementById(
  "input-container"
) as HTMLDivElement;
const userInput = document.getElementById("user-input") as HTMLInputElement;
const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
const aiBubble = document.getElementById("ai-bubble") as HTMLDivElement;
const bubbleText = aiBubble.querySelector(".bubble-text") as HTMLDivElement;

// 输入框显示状态
let isInputVisible = false;

// 自动隐藏AI气泡的定时器
let bubbleTimer: NodeJS.Timeout | null = null;

// 当前流式响应的累积文本
let currentStreamResponse = "";

// 切换输入框显示/隐藏
function toggleInput() {
  isInputVisible = !isInputVisible;

  if (isInputVisible) {
    inputContainer.classList.remove("hidden");
    // 自动聚焦到输入框
    setTimeout(() => {
      userInput.focus();
    }, 100);
  } else {
    inputContainer.classList.add("hidden");
    // 清空输入框
    userInput.value = "";
  }
}

// 发送消息
function sendMessage() {
  const message = userInput.value.trim();

  if (!message) {
    return;
  }

  // 发送消息到主进程
  window.electronAPI.sendMessage(message);

  // 清空输入框并隐藏
  userInput.value = "";
  toggleInput();
}

// 显示AI回复气泡
function showAIBubble(response: string) {
  // 清除之前的定时器
  if (bubbleTimer) {
    clearTimeout(bubbleTimer);
  }

  // 更新气泡内容
  bubbleText.textContent = response;

  // 显示气泡
  aiBubble.classList.remove("hidden");

  // 5秒后自动隐藏（增加显示时间，因为流式输出可能较长）
  bubbleTimer = setTimeout(() => {
    aiBubble.classList.add("hidden");
  }, 5000);
}

// 更新流式响应气泡
function updateStreamBubble(text: string) {
  // 清除之前的定时器
  if (bubbleTimer) {
    clearTimeout(bubbleTimer);
  }

  // 更新气泡内容
  bubbleText.textContent = text;

  // 显示气泡
  aiBubble.classList.remove("hidden");
}

// 完成流式响应
function completeStreamBubble() {
  // 5秒后自动隐藏
  bubbleTimer = setTimeout(() => {
    aiBubble.classList.add("hidden");
    currentStreamResponse = "";
  }, 5000);
}

// 监听快捷键触发事件
window.electronAPI.onToggleInput(() => {
  console.log("Toggle input received");
  toggleInput();
});

// 监听AI回复（兼容非流式）
window.electronAPI.onAIResponse((response) => {
  console.log("AI response received:", response);
  showAIBubble(response);
});

// 监听AI流式输出开始
window.electronAPI.onAIStreamStart(() => {
  console.log("AI stream started");
  currentStreamResponse = "";
  // 显示一个加载提示
  updateStreamBubble("思考中...");
});

// 监听AI流式输出 token
window.electronAPI.onAIStreamToken((token) => {
  console.log("AI stream token:", token);
  // 累积响应文本
  currentStreamResponse += token;
  // 实时更新气泡内容
  updateStreamBubble(currentStreamResponse);
});

// 监听AI流式输出结束
window.electronAPI.onAIStreamEnd(() => {
  console.log("AI stream ended");
  // 完成流式输出，设置自动隐藏
  completeStreamBubble();
});

// 监听AI错误
window.electronAPI.onAIError((error) => {
  console.error("AI error:", error);
  showAIBubble(`错误: ${error}`);
});

// 发送按钮点击事件
sendBtn.addEventListener("click", sendMessage);

// 回车键发送消息
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// ESC键隐藏输入框
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (isInputVisible) {
      toggleInput();
    }
  }
});

/**
 * 通过 #drag-handle 元素拖拽移动 Electron 窗口
 * 不使用 webkit-app-region: drag，而是通过 IPC+setPosition 实时移动
 */
const dragHandle = document.getElementById(
  "drag-handle"
) as HTMLDivElement | null;
dragHandle?.addEventListener("mousedown", (e) => {
  window.electronAPI.startDrag();
});

import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display";

declare global {
  //设置全局属性
  interface Window {
    //window对象属性
    PIXI: typeof PIXI; // 自定义属性
  }
}
// expose PIXI to window so that this plugin is able to
// reference window.PIXI.Ticker to automatically update Live2D models
window.PIXI = PIXI;
const cubism2Model =
  "/live2d/hiyori_free_zh/runtime/hiyori_free_t08.model3.json";
(async function () {
  const app = new PIXI.Application({
    view: document.getElementById("canvas") as HTMLCanvasElement,
    autoStart: true,
    resizeTo: window,
    backgroundAlpha: 0, // 让 WebGL 清屏为透明而不是黑色
    antialias: true,
  });

  const model = await Live2DModel.from(cubism2Model);

  app.stage.addChild(model);

  function resizeModel() {
    const scale = Math.min(
      window.innerWidth / model.internalModel.width,
      window.innerHeight / model.internalModel.height
    ); // 0.8 是缩放系数，可自行调整

    model.scale.set(scale);
    model.x = (window.innerWidth - model.width) / 2;
    model.y = (window.innerHeight - model.height) / 2;
  }
  resizeModel();

  // interaction
  model.on("hit", (hitAreas) => {
    console.log("hitAreas:", hitAreas);
    if (hitAreas.includes("Body")) {
      model.motion("Tap@Body");
    }
  });
})();
