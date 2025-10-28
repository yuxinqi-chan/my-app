// 全局类型声明，提供 window.electronAPI 与 window.PIXI 的类型
// 放在 src/types 目录，TS 会自动拾取全局声明

export {};

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
    PIXI: typeof import('pixi.js');
  }
}