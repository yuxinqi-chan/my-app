/**
 * AI Agent 配置
 */

import dotenv from 'dotenv';
import path from 'path';

// 加载 .env 文件
// 在开发环境和打包后的环境都能正确加载
try {
  // 尝试从项目根目录加载 .env
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch (error) {
  console.warn('.env 文件加载失败，使用默认配置');
}

export interface AIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// 默认配置 - 可以通过环境变量或配置文件覆盖
export const defaultAIConfig: AIConfig = {
  // 默认使用 OpenAI 兼容的 API
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
};

// 从本地存储或配置文件加载配置
export function loadAIConfig(): AIConfig {
  // TODO: 可以从本地配置文件或数据库加载
  // 目前使用默认配置
  return { ...defaultAIConfig };
}

// 保存配置
export function saveAIConfig(config: AIConfig): void {
  // TODO: 保存到本地配置文件或数据库
  console.log('保存配置:', config);
}
