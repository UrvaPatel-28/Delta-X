import { Body, Controller, Param, Post, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator';
import { GenerateCanvasContentDto } from './dtos/generate-canvas-content.dto';
import { ApiMessages } from '../../common/constants/api-messages.constants';
import { UserChatDto } from './dtos/user-chat.dto';

@Controller('ai')
@ApiTags('AI')
@ApiBearerAuth()
@Public() // Make all endpoints public by default
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-content')
  @ApiOperation({
    summary: 'Generate initial canvas content based on question answers',
  })
  @ApiResponse({
    status: 200,
    description: ApiMessages.AI.CONTENT_GENERATED,
  })
  @ApiResponse({
    status: 400,
    description: ApiMessages.GENERIC.BAD_REQUEST,
  })
  async generateCanvasContent(
    @Body() generateContentDto: GenerateCanvasContentDto,
  ) {
    const result = await this.aiService.generateCanvasContent(
      generateContentDto.workshopEventId,
      generateContentDto.questionAnswers,
    );
    return {
      data: result,
      message: ApiMessages.AI.CONTENT_GENERATED,
    };
  }

  @Post('generate-feedback/:submissionId')
  @ApiOperation({ summary: 'Generate AI feedback for a submission' })
  @ApiResponse({
    status: 200,
    description: ApiMessages.AI.FEEDBACK_GENERATED,
  })
  @ApiResponse({
    status: 404,
    description: ApiMessages.GENERIC.NOT_FOUND,
  })
  async generateFeedback(@Param('submissionId') submissionId: string) {
    const result = await this.aiService.generateFeedback(submissionId);
    return {
      data: result,
      message: ApiMessages.AI.FEEDBACK_GENERATED,
    };
  }

  @Post('request-feedback/:submissionId')
  @ApiOperation({
    summary: 'Request AI feedback for a submission',
  })
  @ApiResponse({
    status: 200,
    description: ApiMessages.AI.FEEDBACK_REQUESTED,
  })
  @ApiResponse({
    status: 404,
    description: ApiMessages.GENERIC.NOT_FOUND,
  })
  async requestFeedback(@Param('submissionId') submissionId: string) {
    await this.aiService.generateFeedback(submissionId);
    return {
      data: { submissionId },
      message: ApiMessages.AI.FEEDBACK_REQUESTED,
    };
  }

  @Post('chat/:submissionId')
  @ApiOperation({ summary: 'Chat with AI about a canvas' })
  @ApiResponse({
    status: 200,
    description: ApiMessages.AI.CHAT_RESPONSE_GENERATED,
  })
  @ApiResponse({
    status: 404,
    description: ApiMessages.GENERIC.NOT_FOUND,
  })
  async chatWithAi(
    @Param('submissionId') submissionId: string,
    @Body() userChatDto: UserChatDto,
  ) {
    // Use a default user ID for public access
    const userId = `public-${submissionId}`;

    // We'll let the AI service handle the section detection
    // based on the actual canvas structure
    const result = await this.aiService.processUserChat(
      submissionId,
      userId,
      userChatDto.question,
      userChatDto.sectionId,
    );
    return {
      data: result,
      message: ApiMessages.AI.CHAT_RESPONSE_GENERATED,
    };
  }

  @Post('reset-conversation/:submissionId')
  @ApiOperation({ summary: 'Reset the conversation thread for a submission' })
  @ApiResponse({
    status: 200,
    description: 'Conversation reset successfully',
  })
  @ApiResponse({
    status: 404,
    description: ApiMessages.GENERIC.NOT_FOUND,
  })
  async resetConversation(@Param('submissionId') submissionId: string) {
    const result = await this.aiService.resetConversation(submissionId);
    return {
      data: { success: result },
      message: 'Conversation reset successfully',
    };
  }
}
