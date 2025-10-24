/**
 * AI Agent 模块
 * 使用 LangChain createAgent API 与 OpenAI 兼容模型
 */
import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  createAgent,
  SystemMessage,
  BaseMessage,
  HumanMessage,
  tool,
} from "langchain";
import { AIConfig } from "../config/ai-config";
import z from "zod";
import { logger } from "../config/logger";

export class AIAgent {
  private model!: ChatOpenAI;

  private agent!: ReturnType<typeof createAgent>;

  private chatHistory: BaseMessage[] = [];

  private systemPrompt: string;

  constructor(config: AIConfig) {
    this.systemPrompt = `你是一个可爱的桌面宠物AI助手。你的回答应该：
1. 简洁友好，不要太长
2. 富有个性和情感
3. 使用轻松活泼的语气
4. 回复长度尽量控制在50字以内，除非用户明确要求详细解答`;

    this.initializeAgent(config);
  }

  /**
   * 发送消息并获取流式响应
   */
  async chat(
    userMessage: string,
    onToken: (token: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      this.chatHistory.push(new HumanMessage(userMessage));

      const messages = this.buildMessages();

      let fullResponse = "";

      for await (const [token, metadata] of await this.agent.stream(
        { messages },
        { streamMode: "messages" }
      )) {
        // console.log(`node: ${metadata.langgraph_node}`);
        // console.log(`content: ${JSON.stringify(token.contentBlocks, null, 2)}`);
        if (token.contentBlocks?.length) {
          for (const block of token.contentBlocks) {
            if (block.type === "text") {
              const delta = block.text;
              if (delta) {
                onToken(delta);
                fullResponse += delta;
              }
            }
          }
        }
      }
      logger.info(`AI 响应: ${fullResponse}`);
      if (fullResponse) {
        this.chatHistory.push(new AIMessage(fullResponse));
      }

      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(-20);
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      logger.error("AI Agent 错误:", error);
      if (onError) {
        onError(error as Error);
      }
    }
  }

  /**
   * 构建消息列表
   */
  private buildMessages(): BaseMessage[] {
    const messages: BaseMessage[] = [new SystemMessage(this.systemPrompt)];
    messages.push(...this.chatHistory);
    return messages;
  }

  /**
   * 清除聊天历史
   */
  clearHistory(): void {
    this.chatHistory = [];
  }

  /**
   * 获取聊天历史
   */
  getHistory(): BaseMessage[] {
    return [...this.chatHistory];
  }

  /**
   * 更新配置
   */
  updateConfig(config: AIConfig): void {
    this.initializeAgent(config);
  }
  tools = [
    tool(
      ({ command }: { command: string }) =>
        (async () => {
          logger.info(`执行 PowerShell 命令: ${command}`);
          try {
            const { exec } = await import("child_process");
            const { promisify } = await import("util");
            const execAsync = promisify(exec);
            const { stdout, stderr } = await execAsync(
              `powershell -Command "${command.replace(/"/g, '\\"')}"`
            );
            return stdout || stderr || "命令执行完成，无输出";
          } catch (error: any) {
            return `执行失败: ${error.message}`;
          }
        })(),
      {
        name: "powershell",
        description: "Execute PowerShell commands",
        schema: z.object({
          command: z.string().describe("The PowerShell command to execute"),
        }),
      }
    ),
    tool(
      ({ code }: { code: string }) =>
        (async () => {
          logger.info(`执行 JavaScript 代码: ${code}`);
          try {
            // 使用 Function 构造器在沙箱中执行代码字符串
            const result = new Function("return (" + code + ")")();
            return String(result);
          } catch (error: any) {
            return `eval 执行失败: ${error.message}`;
          }
        })(),
      {
        name: "eval",
        description: "在沙箱中执行一段 JavaScript 代码并返回结果",
        schema: z.object({
          code: z.string().describe("需要执行的 JavaScript 代码"),
        }),
      }
    ),
  ];
  private initializeAgent(config: AIConfig): void {
    this.model = new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000,
      streaming: true,
      configuration: {
        baseURL: config.baseURL,
      },
    });

    this.agent = createAgent({
      model: this.model,
      tools: [...this.tools],
      systemPrompt: this.systemPrompt,
    });
  }
}
