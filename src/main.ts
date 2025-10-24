import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
const dragAddon = require('electron-click-drag-plugin'); // Loads the native addon
import path from "node:path";
import started from "electron-squirrel-startup";
import { AIAgent } from "./ai/agent";
import { loadAIConfig } from "./config/ai-config";
import { logger } from "./config/logger";
import { getLogPath } from "./config/logger";
import fs from "fs";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// 确保日志目录存在
try {
  const logDir = getLogPath();
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    logger.info(`创建日志目录: ${logDir}`);
  }
} catch (error) {
  logger.error("创建日志目录失败", { error: error.message || String(error) });
}

// 存储主窗口的引用
let mainWindow: BrowserWindow | null = null;

// 初始化 AI Agent
let aiAgent: AIAgent | null = null;

// 初始化 AI Agent
function initializeAI() {
  try {
    const config = loadAIConfig();

    // 检查配置是否有效
    if (!config.apiKey) {
      throw new Error(
        "未配置 API Key，AI 功能无法使用。请设置环境变量 OPENAI_API_KEY"
      );
    }

    aiAgent = new AIAgent(config);
    logger.info("AI Agent 初始化成功");
    logger.info("配置", {
      baseURL: config.baseURL,
      model: config.model,
      temperature: config.temperature,
    });
  } catch (error) {
    logger.error("AI Agent 初始化失败", {
      error: error.message || String(error),
    });
    aiAgent = null;
    throw error;
  }
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 600,
    height: 900,
    frame: false, // 隐藏窗口边框
    transparent: true, // 背景透明
    backgroundColor: "#00000000", // 全透明背景，避免黑色清屏
    alwaysOnTop: false, // 窗口始终前置
    resizable: true, // 禁止调整大小
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // 启用上下文隔离
      nodeIntegration: false, // 禁用 Node.js 集成
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // 注册F12快捷键来切换开发者工具
  globalShortcut.register("CommandOrControl+F12", () => {
    logger.debug("F12 pressed");
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  });

  // 注册 Ctrl+Space 快捷键来触发输入框
  globalShortcut.register("CommandOrControl+Space", () => {
    logger.debug("Ctrl+Space pressed");

    // 确保窗口可见并获得焦点
    if (mainWindow) {
      // 如果窗口被最小化，先恢复它
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      // 显示窗口并获得焦点
      mainWindow.show();
      mainWindow.focus();

      // 发送切换输入框的消息到渲染进程
      mainWindow.webContents.send("toggle-input");
    }
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// 处理用户发送的消息
ipcMain.on("user-message", async (_event, message: string) => {
  logger.info("用户输入消息", { message });

  if (!mainWindow) {
    logger.error("主窗口不存在");
    return;
  }

  // 如果 AI Agent 未初始化或不可用，则直接报错
  if (!aiAgent) {
    const errorMessage = "AI Agent 未初始化，请检查配置。";
    logger.error(errorMessage);
    mainWindow.webContents.send("ai-error", errorMessage);
    return;
  }

  // 使用 AI Agent 进行流式响应
  try {
    // 通知开始流式输出
    mainWindow.webContents.send("ai-stream-start");

    await aiAgent.chat(
      message,
      // onToken - 每收到一个 token 就发送
      (token: string) => {
        if (mainWindow) {
          mainWindow.webContents.send("ai-stream-token", token);
        }
      },
      // onComplete - 完成时调用
      () => {
        if (mainWindow) {
          mainWindow.webContents.send("ai-stream-end");
        }
      },
      // onError - 错误时调用
      (error: Error) => {
        logger.error("AI 响应错误", {
          error: error.message,
          stack: error.stack,
        });
        if (mainWindow) {
          mainWindow.webContents.send(
            "ai-error",
            error.message || "AI 响应失败，请稍后重试"
          );
        }
      }
    );
  } catch (error) {
    logger.error("处理消息时出错", {
      error: error.message,
      stack: error.stack,
    });
    if (mainWindow) {
      mainWindow.webContents.send("ai-error", "处理消息时出错，请稍后重试");
    }
  }
});

ipcMain.on("start-drag", () => {
  try {
    const hwndBuffer = mainWindow.getNativeWindowHandle();
    // Linux: extract X11 Window ID from the buffer (first 4 bytes, little-endian)
    // macOS/Windows: pass Buffer directly
    const windowId =
      process.platform === "linux" ? hwndBuffer.readUInt32LE(0) : hwndBuffer;

    dragAddon.startDrag(windowId);
  } catch (error) {
    console.error(error);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  // 初始化 AI Agent
  try {
    initializeAI();
  } catch (error) {
    logger.error("初始化 AI Agent 失败", {
      error: error.message,
      stack: error.stack,
    });
  }
  // 创建窗口
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 在应用退出前注销快捷键
app.on("before-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
