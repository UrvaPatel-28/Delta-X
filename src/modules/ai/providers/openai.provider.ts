import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { AIGenerationOptions } from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;
  private readonly assistantId: string;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    const assistantId = this.configService.get<string>('OPENAI_ASSISTANT_ID');
    if (!assistantId) {
      throw new Error(
        'OPENAI_ASSISTANT_ID is not defined in environment variables',
      );
    }
    this.assistantId = assistantId;
  }

  /**
   * Generate content using OpenAI
   */
  async generateContent(
    prompt: string,
    systemPrompt = 'You are a helpful assistant.',
    options: AIGenerationOptions = {},
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 500,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`OpenAI API Error: ${err.message}`, err.stack);
      throw new Error(`Failed to generate content with OpenAI: ${err.message}`);
    }
  }

  /**
   * Generate a response based on a chat conversation history
   */
  async generateChatResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options: AIGenerationOptions = {},
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 500,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`OpenAI Chat API Error: ${err.message}`, err.stack);
      throw new Error(
        `Failed to generate chat response with OpenAI: ${err.message}`,
      );
    }
  }

  /**
   * Create a new thread for the OpenAI Assistant
   */
  async createThread() {
    try {
      return await this.client.beta.threads.create();
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to create thread: ${err.message}`, err.stack);
      throw new Error(`Failed to create thread: ${err.message}`);
    }
  }

  /**
   * Add a message to an existing thread
   */
  async addMessage(
    threadId: string,
    message: { role: 'user' | 'system'; content: string },
  ) {
    try {
      // OpenAI Assistants API only supports 'user' role for messages
      // For system messages, we'll add them as user messages with a prefix
      const content =
        message.role === 'system'
          ? `[SYSTEM]: ${message.content}`
          : message.content;

      return await this.client.beta.threads.messages.create(threadId, {
        role: 'user',
        content,
      });
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to add message: ${err.message}`, err.stack);
      throw new Error(`Failed to add message: ${err.message}`);
    }
  }

  /**
   * Run the assistant on a thread and get the response
   */
  async runAssistant(threadId: string, instructions?: string) {
    try {
      const run = await this.client.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId,
        instructions,
      });

      // Poll for completion
      let runStatus = await this.client.beta.threads.runs.retrieve(run.id, {
        thread_id: threadId,
      });

      // Wait for the run to complete with exponential backoff
      let attempts = 0;
      const maxAttempts = 30; // Prevent infinite loops
      const initialDelay = 200; // 500ms

      while (
        ['queued', 'in_progress'].includes(runStatus.status) &&
        attempts < maxAttempts
      ) {
        // Exponential backoff with a cap
        // const delay = Math.min(initialDelay * Math.pow(1.5, attempts), 5000);
        const delay = Math.min(initialDelay * (attempts + 1), 2000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        runStatus = await this.client.beta.threads.runs.retrieve(run.id, {
          thread_id: threadId,
        });
        attempts++;
      }

      if (runStatus.status === 'completed') {
        // Get the latest message from the assistant
        const messages = await this.client.beta.threads.messages.list(threadId);
        const assistantMessages = messages.data.filter(
          (msg) => msg.role === 'assistant',
        );

        if (assistantMessages.length > 0) {
          // Get the most recent assistant message
          const latestMessage = assistantMessages[0];

          // Extract text content
          if (latestMessage.content && latestMessage.content.length > 0) {
            const textContent = latestMessage.content.find(
              (content) => content.type === 'text',
            );

            if (
              textContent &&
              'text' in textContent &&
              textContent.text.value
            ) {
              return textContent.text.value;
            }
          }
        }

        return 'No response from assistant.';
      } else {
        this.logger.error(
          `Assistant run failed with status: ${runStatus.status}`,
        );
        throw new Error(
          `Assistant run failed with status: ${runStatus.status}`,
        );
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Assistant run error: ${err.message}`, err.stack);
      throw new Error(`Failed to run assistant: ${err.message}`);
    }
  }

  /**
   * Delete a thread
   */
  async deleteThread(threadId: string) {
    try {
      return await this.client.beta.threads.delete(threadId);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to delete thread: ${err.message}`, err.stack);
      // Don't throw here, just log the error as this is cleanup
    }
  }
}
