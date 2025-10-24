import winston from 'winston';
import isDev from 'electron-is-dev';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import util from 'node:util';

// 创建日志目录路径
const getLogPath = () => {
  if (isDev) {
    // 开发环境：项目根目录下的 logs 文件夹
    return path.join(process.cwd(), 'logs');
  } else {
    // 生产环境：Electron 用户数据目录
    return path.join(app.getPath('userData'), 'logs');
  }
};

// 确保日志目录存在
const ensureLogDir = () => {
  const logDir = getLogPath();
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
};

// 创建日志配置
const createLogger = () => {
  const logDir = ensureLogDir();

  // 定义日志格式
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      // 美化对象输出
      const metaStr = Object.keys(meta).length
        ? util.inspect(meta, { depth: null, colors: false })
        : '';
      return `[${timestamp}] [${level}] ${message} ${metaStr}`;
    })
  );

  const transports = [];

  // 控制台输出（开发环境）
  if (isDev) {
    transports.push(
      new winston.transports.Console({
        level: 'debug',
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        ),
      })
    );
  }

  // 文件输出（开发 + 生产）
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 每个文件最大 10MB
      maxFiles: 5,               // 最多保留 5 个文件
      tailable: true,            // 循环写入
      format: logFormat,
    })
  );

  // 单独错误日志
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
    })
  );

  // 创建 logger 实例
  const logger = winston.createLogger({
    level: isDev ? 'debug' : 'info',
    format: logFormat,
    transports,
  });

  return logger;
};

// 导出 logger 实例
export const logger = createLogger();

// 导出日志路径
export { getLogPath };
