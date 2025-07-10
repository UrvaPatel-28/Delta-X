import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, LessThan } from 'typeorm';
import { WorkshopSubmission } from '../../entities/workshop-submission.entity';
import { WorkshopEvent } from '../../entities/workshop-event.entity';
import { AiFeedbackStatus } from '../../common/enums';
import { ConfigService } from '@nestjs/config';
import { OpenAIProvider } from './providers/openai.provider';

@Injectable()
export class AiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiService.name);
  private readonly threadTTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly threadMap = new Map<
    string,
    { threadId: string; lastUsed: Date; isActive: boolean }
  >();
  private cleanupInterval?: NodeJS.Timeout;
  private readonly threadLocks = new Map<string, Promise<string>>();

  constructor(
    @InjectRepository(WorkshopSubmission)
    private submissionRepository: Repository<WorkshopSubmission>,
    @InjectRepository(WorkshopEvent)
    private workshopEventRepository: Repository<WorkshopEvent>,
    private configService: ConfigService,
    private openAIProvider: OpenAIProvider,
  ) {}

  onModuleInit() {
    // Set up periodic cleanup of old threads
    this.cleanupInterval = setInterval(() => {
      void this.cleanupOldThreads();
    }, this.threadTTL);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Clean up old threads that have exceeded the TTL
   */
  private async cleanupOldThreads() {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const submissions = await this.submissionRepository.find({
        where: {
          aiThreadId: Not(IsNull()),
          aiThreadLastUpdated: LessThan(oneHourAgo),
        },
      });

      this.logger.debug(
        `Found ${submissions.length} expired threads to clean up`,
      );

      for (const submission of submissions) {
        if (submission.aiThreadId) {
          try {
            await this.openAIProvider.deleteThread(submission.aiThreadId);
            submission.aiThreadId = null;
            await this.submissionRepository.save(submission);
            this.logger.debug(
              `Cleaned up thread ${submission.aiThreadId} for submission ${submission.id}`,
            );
          } catch (error) {
            const err = error as Error;
            this.logger.error(
              `Failed to delete thread ${submission.aiThreadId}: ${err.message}`,
            );
            // Still set threadId to null even if deletion fails
            submission.aiThreadId = null;
            await this.submissionRepository.save(submission);
          }
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error in thread cleanup: ${err.message}`, err.stack);
    }
  }

  /**
   * Get or create a thread for a submission with proper locking
   */
  private async getOrCreateThread(
    submissionId: string,
    submission: WorkshopSubmission,
    sectionId?: string,
  ): Promise<{ threadId: string; isNewThread: boolean }> {
    // Check if there's already a lock for this submission
    const existingLock = this.threadLocks.get(submissionId);
    if (existingLock) {
      const threadId = await existingLock;
      return { threadId, isNewThread: false };
    }

    // Create a new lock
    const threadPromise = this._createOrReuseThread(
      submissionId,
      submission,
      sectionId,
    );
    this.threadLocks.set(submissionId, threadPromise);

    try {
      const threadId = await threadPromise;

      // Update in-memory cache
      this.threadMap.set(submissionId, {
        threadId,
        lastUsed: new Date(),
        isActive: true,
      });

      return { threadId, isNewThread: !submission.aiThreadId };
    } finally {
      // Remove the lock
      this.threadLocks.delete(submissionId);
    }
  }

  /**
   * Internal method to create or reuse thread
   */
  private async _createOrReuseThread(
    submissionId: string,
    submission: WorkshopSubmission,
    sectionId?: string,
  ): Promise<string> {
    let threadId = submission.aiThreadId;

    // Check if the thread exists and is recent (less than 1 hour old)
    const isThreadValid =
      threadId &&
      submission.aiThreadLastUpdated &&
      new Date().getTime() -
        new Date(submission.aiThreadLastUpdated).getTime() <
        this.threadTTL;

    if (!isThreadValid) {
      // Create a new thread if none exists or it's expired
      const thread = await this.openAIProvider.createThread();
      threadId = thread.id;

      this.logger.debug(
        `Created new thread ${threadId} for submission ${submissionId}`,
      );

      // Add initial context
      await this.openAIProvider.addMessage(threadId, {
        role: 'system',
        content: this.formatCanvasContext(submission, sectionId),
      });

      // Update submission with new thread ID
      submission.aiThreadId = threadId;
      submission.aiThreadLastUpdated = new Date();
      await this.submissionRepository.save(submission);
    } else {
      this.logger.debug(
        `Reusing existing thread ${threadId} for submission ${submissionId}`,
      );

      // Update last used time in cache
      const cached = this.threadMap.get(submissionId);
      if (cached) {
        cached.lastUsed = new Date();
      }
    }

    return threadId!;
  }

  /**
   * Format canvas context for the AI
   */
  private formatCanvasContext(
    submission: WorkshopSubmission,
    sectionId?: string,
  ): string {
    const workshopEvent = submission.workshopEvent;

    if (sectionId) {
      // Get specific section content and config
      const sectionData = submission.canvasData.find(
        (s) => s.sectionId === sectionId,
      );
      const sectionConfig = workshopEvent.canvasSections.find(
        (s) => s.sectionId === sectionId,
      );

      if (!sectionData || !sectionConfig) {
        throw new Error(`Section with ID ${sectionId} not found`);
      }

      // Format content based on type (string or array)
      const formattedContent = Array.isArray(sectionData.content)
        ? sectionData.content.map((item) => `- ${item}`).join('\n')
        : sectionData.content;

      return `
      Canvas Type: ${workshopEvent.canvasType}
      Section: ${sectionConfig.title}
      
      Content:
      ${formattedContent}
      
      AI Instructions:
      ${sectionConfig.aiInstructions}
      
      Feedback Rules:
      ${sectionConfig.feedbackRules || 'No specific rules provided'}
      `;
    } else {
      // Use the entire canvas
      const formattedCanvasData = submission.canvasData
        .map((section) => {
          const sectionConfig = workshopEvent.canvasSections.find(
            (s) => s.sectionId === section.sectionId,
          );
          const title = sectionConfig ? sectionConfig.title : section.sectionId;

          // Format content based on type (string or array)
          const formattedContent = Array.isArray(section.content)
            ? section.content.map((item) => `- ${item}`).join('\n')
            : typeof section.content === 'string'
              ? section.content
              : JSON.stringify(section.content);

          return `## ${title}\n${formattedContent}`;
        })
        .join('\n\n');

      return `
      Canvas Type: ${workshopEvent.canvasType}
      
      Canvas Content:
      ${formattedCanvasData}
      
      General Instructions:
      You are an expert business consultant helping with a ${workshopEvent.canvasType} canvas.
      Provide guidance based on business model best practices and industry expertise.
      `;
    }
  }

  /**
   * Process a user message and return AI response
   */
  async processUserChat(
    submissionId: string,
    userId: string,
    question: string,
    sectionId?: string,
  ) {
    try {
      // Get the submission with its related workshop event
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
        relations: ['workshopEvent'],
      });

      if (!submission) {
        throw new Error(`Submission with ID ${submissionId} not found`);
      }

      // If no explicit sectionId is provided, try to detect it from the question
      if (!sectionId) {
        sectionId = this.detectSectionFromQuestion(question, submission);
      }

      // Use the improved thread management
      const { threadId, isNewThread } = await this.getOrCreateThread(
        submissionId,
        submission,
        sectionId,
      );

      // Add user question to the thread
      if (threadId) {
        await this.openAIProvider.addMessage(threadId, {
          role: 'user',
          content: question,
        });
        console.log('------------------', sectionId);
        // Generate AI response using the assistant
        const instructions = sectionId
          ? `Focus on the ${sectionId} section and provide specific guidance based on business best practices.`
          : `Provide guidance on the entire business canvas based on business best practices.`;

        console.log(instructions);

        const aiResponse = await this.openAIProvider.runAssistant(
          threadId,
          instructions,
        );

        // Update the last updated timestamp
        submission.aiThreadLastUpdated = new Date();
        await this.submissionRepository.save(submission);

        return {
          message: aiResponse,
          threadId,
          isNewThread,
        };
      } else {
        throw new Error('Failed to create or retrieve a valid thread ID');
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error in chat processing: ${err?.message || 'Unknown error'}`,
        err?.stack,
      );
      throw error;
    }
  }

  /**
   * Detect which section the question is about based on the canvas structure
   */
  private detectSectionFromQuestion(
    question: string,
    submission: WorkshopSubmission,
  ): string | undefined {
    const lowercaseQuestion = question.toLowerCase();

    // Get all section titles from the canvas
    const sections = submission.workshopEvent.canvasSections.map((section) => ({
      id: section.sectionId,
      title: section.title.toLowerCase(),
    }));

    // Check if the question starts with or contains a section title
    for (const section of sections) {
      // Check for exact section title match at the start of the question
      if (lowercaseQuestion.startsWith(section.title + ':')) {
        return section.id;
      }

      // Check for section title with colon anywhere in the question
      if (lowercaseQuestion.includes(section.title + ':')) {
        return section.id;
      }

      // Check for section title at the start of the question (without colon)
      if (lowercaseQuestion.startsWith(section.title)) {
        return section.id;
      }
    }

    // No section detected
    return undefined;
  }

  /**
   * Reset a user's chat thread
   */
  async resetConversation(submissionId: string) {
    try {
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
      });

      if (submission && submission.aiThreadId) {
        try {
          await this.openAIProvider.deleteThread(submission.aiThreadId);
        } catch (error) {
          const err = error as Error;
          this.logger.error(
            `Failed to delete thread ${submission.aiThreadId}: ${err.message}`,
          );
          // Continue even if deletion fails
        }

        submission.aiThreadId = null;
        submission.aiThreadLastUpdated = null;
        await this.submissionRepository.save(submission);

        this.logger.debug(`Reset conversation for submission ${submissionId}`);
      }

      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error resetting conversation: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Generate initial canvas content based on question answers
   */
  async generateCanvasContent(
    workshopEventId: string,
    questionAnswers: Array<{ questionId: string; answer: string | string[] }>,
  ) {
    try {
      // Get the workshop event
      const workshopEvent = await this.workshopEventRepository.findOne({
        where: { id: workshopEventId },
      });

      if (!workshopEvent) {
        throw new Error(`Workshop event with ID ${workshopEventId} not found`);
      }

      // Create a thread
      const thread = await this.openAIProvider.createThread();

      try {
        // Format all questions and answers
        const formattedQA = workshopEvent.questions.map((question) => {
          const answer = questionAnswers.find(
            (qa) => qa.questionId === question.id,
          );
          return {
            question: question.text,
            answer: answer ? this.formatAnswer(answer.answer) : 'Not answered',
          };
        });

        // Create a comprehensive prompt with all sections
        const sectionsInfo = workshopEvent.canvasSections
          .map((section) => {
            return `
          Section: ${section.title} (${section.sectionId})
          Instructions: ${section.aiInstructions}
          `;
          })
          .join('\n\n');

        const prompt = `
        You are an expert business consultant helping to create content for a ${workshopEvent.canvasType} canvas.
        
        I need you to generate content for ALL of the following sections:
        ${sectionsInfo}
        
        Based on these questions and answers:
        ${formattedQA.map((qa) => `Question: ${qa.question}\nAnswer: ${qa.answer}`).join('\n\n')}
        
        For each section, generate concise, high-quality content.
        Format your response as JSON with the following structure:
        {
          "sections": [
            {
              "sectionId": "section-id",
              "content": ["item 1", "item 2", "item 3"]
            },
            ...
          ]
        }
        
        Each content item should be a single line of text with key words bolded using markdown (**bold**).
        `;

        // Add system message
        await this.openAIProvider.addMessage(thread.id, {
          role: 'system',
          content: `You are an industry expert who has built and scaled multiple successful businesses. As a business consultant AI, you provide expert feedback on ${workshopEvent.canvasType} canvas content with deep insights, practical strategies, and opportunity-driven advice.`,
        });

        // Add the prompt
        await this.openAIProvider.addMessage(thread.id, {
          role: 'user',
          content: prompt,
        });

        // Run the assistant once
        const response = await this.openAIProvider.runAssistant(
          thread.id,
          `Generate high-quality content for all sections of the ${workshopEvent.canvasType} canvas. Make sure to bold key words in your response and format as JSON.`,
        );

        // Parse the JSON response
        try {
          // Clean the response to handle markdown code blocks
          let cleanedResponse = response;

          // Remove markdown code block formatting if present
          const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
          const match = jsonRegex.exec(cleanedResponse);
          if (match && match[1]) {
            cleanedResponse = match[1].trim();
          }

          interface ParsedResponse {
            sections: Array<{
              sectionId: string;
              content: string[];
            }>;
          }

          const parsedResponse = JSON.parse(cleanedResponse) as ParsedResponse;
          return parsedResponse.sections;
        } catch (parseError: unknown) {
          const err = parseError as Error;
          this.logger.error(`Failed to parse AI response as JSON: ${response}`);
          this.logger.error(`Parse error: ${err.message}`);
          throw new Error(`Failed to parse AI response: ${err.message}`);
        }
      } finally {
        // Clean up the thread
        await this.openAIProvider.deleteThread(thread.id);
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error generating canvas content: ${err.message}`);
      throw error;
    }
  }

  /**
   * Generate AI feedback for a submission
   */
  async generateFeedback(submissionId: string) {
    try {
      // Get the submission with its related workshop event
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
        relations: ['workshopEvent'],
      });

      if (!submission) {
        throw new Error(`Submission with ID ${submissionId} not found`);
      }

      // Update status to processing
      submission.aiFeedbackStatus = AiFeedbackStatus.PROCESSING;
      await this.submissionRepository.save(submission);

      // Create a thread for feedback generation
      const thread = await this.openAIProvider.createThread();

      try {
        // Add canvas context as system message
        await this.openAIProvider.addMessage(thread.id, {
          role: 'system',
          content: this.formatCanvasContext(submission),
        });

        // Generate feedback for each canvas section
        const feedbackBySection = await Promise.all(
          submission.canvasData.map(async (canvasSection) => {
            // Find the corresponding section in the workshop event
            const sectionConfig = submission.workshopEvent.canvasSections.find(
              (s) => s.sectionId === canvasSection.sectionId,
            );

            if (!sectionConfig) {
              return {
                sectionId: canvasSection.sectionId,
                feedback: 'No feedback available for this section.',
              };
            }

            // Format content based on type (string or array)
            const formattedContent = Array.isArray(canvasSection.content)
              ? canvasSection.content.map((item) => `- ${item}`).join('\n')
              : canvasSection.content;

            // Add user message requesting feedback for this section
            await this.openAIProvider.addMessage(thread.id, {
              role: 'user',
              content: `
              Please provide constructive feedback on the ${sectionConfig.title} section:
              
              """
              ${formattedContent}
              """
              
              Follow these specific instructions:
              ${sectionConfig.aiInstructions}
              
              Additional feedback rules:
              ${sectionConfig.feedbackRules || ''}
              
              Your feedback should be:
              1. Constructive and actionable
              2. Specific to the content provided
              3. Include both strengths and areas for improvement
              4. Suggest 2-3 concrete ways to enhance this section
              `,
            });

            // Run the assistant with specific instructions for this section
            const feedback = await this.openAIProvider.runAssistant(
              thread.id,
              `Focus on providing constructive feedback for the ${sectionConfig.title} section. Make sure to bold key words in your feedback for emphasis.`,
            );

            return {
              sectionId: canvasSection.sectionId,
              feedback,
            };
          }),
        );

        // Generate overall feedback
        await this.openAIProvider.addMessage(thread.id, {
          role: 'user',
          content: `
          Please provide comprehensive feedback on the entire ${submission.workshopEvent.canvasType} canvas.
          
          Your feedback should include:
          1. Overall assessment of the business model/canvas
          2. Key strengths and weaknesses
          3. Consistency and alignment between different sections
          4. 3-5 strategic recommendations to improve the business model
          5. Potential risks or blind spots to consider
          
          Be specific, constructive, and actionable in your feedback.
          `,
        });

        const overallFeedback = await this.openAIProvider.runAssistant(
          thread.id,
          `Provide holistic feedback on the entire canvas, focusing on consistency, strategic alignment, and key recommendations. Make sure to bold key words in your feedback for emphasis.`,
        );

        // Update submission with AI feedback
        submission.aiSuggestions = {
          sectionFeedback: feedbackBySection,
          overallFeedback,
          generatedAt: new Date().toISOString(),
        };
        submission.aiFeedbackStatus = AiFeedbackStatus.COMPLETED;

        await this.submissionRepository.save(submission);

        return submission.aiSuggestions;
      } finally {
        // Clean up the thread
        await this.openAIProvider.deleteThread(thread.id);
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error generating feedback: ${err?.message || 'Unknown error'}`,
        err?.stack,
      );

      // Update submission status to failed
      try {
        const submission = await this.submissionRepository.findOne({
          where: { id: submissionId },
        });

        if (submission) {
          submission.aiFeedbackStatus = AiFeedbackStatus.FAILED;
          await this.submissionRepository.save(submission);
        }
      } catch (updateError: unknown) {
        const err = updateError as Error;
        this.logger.error(
          `Failed to update submission status: ${err?.message || 'Unknown error'}`,
          err?.stack,
        );
      }

      throw error;
    }
  }

  /**
   * Format answer for prompt (handle array answers)
   */
  private formatAnswer(answer: string | string[]): string {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer;
  }
}
