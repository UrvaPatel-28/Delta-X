import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator';
import { GenerateCanvasContentDto } from '../ai/dtos/generate-canvas-content.dto';
import { ApiMessages } from '../../common/constants/api-messages.constants';
import { CreateSubmissionDto } from './dtos/create-submission.dto';
import { UpdateSubmissionDto } from './dtos/update-submission.dto';

@Controller('participants')
@ApiTags('Participants')
@ApiBearerAuth()
@Public()
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get('workshops/:id')
  @ApiOperation({
    summary: 'Get workshop event by ID (for participants)',
  })
  @ApiResponse({
    status: 200,
    description: ApiMessages.PARTICIPANT.WORKSHOP_FETCHED,
  })
  @ApiResponse({
    status: 404,
    description: ApiMessages.WORKSHOP.NOT_FOUND,
  })
  async getWorkshopEventById(@Param('id') id: string) {
    const event = await this.participantsService.getWorkshopEventById(id);
    return {
      data: event,
      message: ApiMessages.PARTICIPANT.WORKSHOP_FETCHED,
    };
  }

  @Post('submissions')
  @ApiOperation({
    summary: 'Start a new workshop submission with participant email',
  })
  @ApiResponse({
    status: 201,
    description: ApiMessages.PARTICIPANT.SUBMISSION_CREATED,
  })
  async createSubmission(@Body() createSubmissionDto: CreateSubmissionDto) {
    const result =
      await this.participantsService.createSubmission(createSubmissionDto);
    return {
      data: result,
    };
  }

  @Put('submissions/:id')
  @ApiOperation({ summary: 'Update a submission with answers or complete it' })
  @ApiResponse({
    status: 200,
    description: ApiMessages.PARTICIPANT.SUBMISSION_UPDATED,
  })
  @ApiResponse({
    status: 404,
    description: ApiMessages.PARTICIPANT.SUBMISSION_NOT_FOUND,
  })
  async updateSubmission(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
  ) {
    const result = await this.participantsService.updateSubmission(
      id,
      updateSubmissionDto,
    );
    return {
      data: result,
      message: ApiMessages.PARTICIPANT.SUBMISSION_UPDATED,
    };
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Get submission by ID' })
  @ApiResponse({
    status: 200,
    description: ApiMessages.PARTICIPANT.SUBMISSION_FETCHED,
  })
  @ApiResponse({
    status: 404,
    description: ApiMessages.PARTICIPANT.SUBMISSION_NOT_FOUND,
  })
  async getSubmissionById(@Param('id') id: string) {
    const submission = await this.participantsService.getSubmissionById(id);
    return {
      data: submission,
      message: ApiMessages.PARTICIPANT.SUBMISSION_FETCHED,
    };
  }

  @Post('generate-canvas')
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
    const result = await this.participantsService.generateCanvasContent(
      generateContentDto.workshopEventId,
      generateContentDto.questionAnswers,
    );
    return {
      data: result,
      message: ApiMessages.AI.CONTENT_GENERATED,
    };
  }
}
