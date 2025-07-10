import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkshopSubmission } from '../../entities/workshop-submission.entity';
import { WorkshopEvent } from '../../entities/workshop-event.entity';
import { CreateSubmissionDto } from './dtos/create-submission.dto';
import { UpdateSubmissionDto } from './dtos/update-submission.dto';
import { SubmissionStatus, ReviewStatus } from '../../common/enums';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(WorkshopSubmission)
    private submissionRepository: Repository<WorkshopSubmission>,
    @InjectRepository(WorkshopEvent)
    private workshopEventRepository: Repository<WorkshopEvent>,
    private aiService: AiService,
  ) {}

  async getWorkshopEventById(id: string): Promise<WorkshopEvent> {
    // Use direct query to bypass tenant filtering
    const workshopEvent = await this.workshopEventRepository
      .createQueryBuilder('workshopEvent')
      .where('workshopEvent.id = :id', { id })
      .andWhere('workshopEvent.isPublished = :isPublished', {
        isPublished: true,
      })
      .getOne();

    if (!workshopEvent) {
      throw new NotFoundException(
        `Workshop event with ID ${id} not found or not published`,
      );
    }

    return workshopEvent;
  }

  async createSubmission(
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<WorkshopSubmission> {
    // Check if participant already has a submission for this workshop
    const existingSubmission = await this.submissionRepository.findOne({
      where: {
        workshopEventId: createSubmissionDto.workshopEventId,
        participantIdentifier: createSubmissionDto.email,
      },
    });

    if (existingSubmission) {
      return existingSubmission;
    }

    // Verify workshop exists
    const workshop = await this.workshopEventRepository.findOne({
      where: { id: createSubmissionDto.workshopEventId },
    });

    if (!workshop) {
      throw new NotFoundException(
        `Workshop event with ID ${createSubmissionDto.workshopEventId} not found`,
      );
    }

    // Create submission with STARTED status
    const submission = this.submissionRepository.create({
      workshopEventId: createSubmissionDto.workshopEventId,
      participantIdentifier: createSubmissionDto.email,
      status: SubmissionStatus.STARTED,
      reviewStatus: ReviewStatus.NONE,
      questionAnswers: createSubmissionDto.questionAnswers || [],
      canvasData: createSubmissionDto.canvasData || [],
      tenantId: workshop.tenantId,
    });

    return this.submissionRepository.save(submission);
  }

  async updateSubmission(
    submissionId: string,
    updateData: UpdateSubmissionDto,
  ): Promise<WorkshopSubmission> {
    // Use direct query to bypass tenant filtering
    const submission = await this.submissionRepository
      .createQueryBuilder('submission')
      .where('submission.id = :id', { id: submissionId })
      .getOne();

    if (!submission) {
      throw new NotFoundException(
        `Submission with ID ${submissionId} not found`,
      );
    }

    // Process canvasData if provided to ensure consistent format
    const processedCanvasData = updateData.canvasData;
    if (processedCanvasData) {
      // No need to transform - our entity now accepts both formats
      // This ensures we're storing the data as provided by the frontend
    }

    // Update fields
    Object.assign(submission, {
      questionAnswers: updateData.questionAnswers || submission.questionAnswers,
      canvasData: processedCanvasData || submission.canvasData,
      status: updateData.status || submission.status,
    });

    return this.submissionRepository.save(submission);
  }

  async getSubmissionById(submissionId: string): Promise<WorkshopSubmission> {
    // Use direct query to bypass tenant filtering
    const submission = await this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.workshopEvent', 'workshopEvent')
      .where('submission.id = :id', { id: submissionId })
      .getOne();

    if (!submission) {
      throw new NotFoundException(
        `Submission with ID ${submissionId} not found`,
      );
    }

    return submission;
  }

  async generateCanvasContent(
    workshopEventId: string,
    questionAnswers: Array<{ questionId: string; answer: string | string[] }>,
  ) {
    return this.aiService.generateCanvasContent(
      workshopEventId,
      questionAnswers,
    );
  }
}
