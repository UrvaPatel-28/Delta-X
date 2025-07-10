import { Injectable, NotFoundException } from '@nestjs/common';
import {
  WorkshopEvent,
  WorkshopQuestion,
  WorkshopCanvasSection,
} from '../../entities/workshop-event.entity';
import { CreateWorkshopEventDto } from './dtos/create-workshop-event.dto';
import { UpdateWorkshopEventDto } from './dtos/update-workshop-event.dto';
import { WorkshopEventRepository } from '../../repositories/workshop-event.repository';
import { WorkshopSubmissionRepository } from '../../repositories/workshop-submission.repository';
import { SubmissionStatus } from '../../common/enums';

export interface WorkshopEventWithCounts extends WorkshopEvent {
  submissionCounts: {
    started: number;
    completed: number;
    reviewed: number;
  };
}

@Injectable()
export class WorkshopsService {
  constructor(
    private readonly workshopEventRepository: WorkshopEventRepository,
    private readonly workshopSubmissionRepository: WorkshopSubmissionRepository,
  ) {}

  async createWorkshopEvent(dto: CreateWorkshopEventDto) {
    const questions: WorkshopQuestion[] = dto.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      required: q.required,
      expanded: q.expanded,
      options: q.options ?? null,
    }));

    const canvasSections: WorkshopCanvasSection[] = dto.canvasSections.map(
      (s) => ({
        sectionId: s.sectionId,
        title: s.title,
        aiInstructions: s.aiInstructions,
        feedbackRules: s.feedbackRules ?? null,
        questions: s.questions ?? null,
      }),
    );

    const event = this.workshopEventRepository.create({
      ...dto,
      questions,
      canvasSections,
    });

    return this.workshopEventRepository.save(event);
  }

  async getWorkshopEvents(): Promise<WorkshopEventWithCounts[]> {
    const workshops = await this.workshopEventRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    // Get submission counts for each workshop
    const workshopsWithCounts = await Promise.all(
      workshops.map(async (workshop) => {
        const [started, completed, reviewed] = await Promise.all([
          this.workshopSubmissionRepository.count({
            where: {
              workshopEventId: workshop.id,
              status: SubmissionStatus.STARTED,
            },
          }),
          this.workshopSubmissionRepository.count({
            where: {
              workshopEventId: workshop.id,
              status: SubmissionStatus.COMPLETED,
            },
          }),
          this.workshopSubmissionRepository.count({
            where: {
              workshopEventId: workshop.id,
              status: SubmissionStatus.REVIEWED,
            },
          }),
        ]);

        return {
          ...workshop,
          submissionCounts: {
            started,
            completed,
            reviewed,
          },
        };
      }),
    );

    return workshopsWithCounts;
  }

  async getWorkshopEventById(id: string): Promise<WorkshopEvent> {
    const workshop = await this.workshopEventRepository.findOne({
      where: { id },
    });

    if (!workshop) {
      throw new NotFoundException(`Workshop event with ID ${id} was not found`);
    }

    return workshop;
  }

  async generateQrCodeUrl(
    workshopId: string,
    baseUrl: string,
  ): Promise<string | null> {
    const workshop = await this.getWorkshopEventById(workshopId);
    if (!workshop) return null;

    const qrUrl = `${baseUrl}/workshops/${workshop.id}`;
    workshop.qrCodeUrl = qrUrl;
    await this.workshopEventRepository.save(workshop);

    return qrUrl;
  }

  async updateWorkshopEvent(
    id: string,
    dto: UpdateWorkshopEventDto,
  ): Promise<WorkshopEvent> {
    const workshop = await this.getWorkshopEventById(id);
    if (!workshop) {
      throw new NotFoundException(`Workshop event with ID ${id} was not found`);
    }

    // Update simple fields
    if (dto.title) {
      workshop.title = dto.title;
    }

    if (dto.description) {
      workshop.description = dto.description;
    }

    if (dto.canvasType) {
      workshop.canvasType = dto.canvasType;
    }

    if (typeof dto.isPublished !== 'undefined') {
      workshop.isPublished = dto.isPublished;
    }

    if (typeof dto.allowReviews !== 'undefined') {
      workshop.allowReviews = dto.allowReviews;
    }

    // Update questions
    if (dto.questions) {
      const updatedQuestions = dto.questions.map((q) => {
        return {
          id: q.id,
          text: q.text,
          type: q.type,
          required: q.required,
          expanded: q.expanded,
          options: q.options ?? null,
        };
      });
      workshop.questions = updatedQuestions as WorkshopQuestion[];
    }

    // Update canvas sections
    if (dto.canvasSections) {
      const updatedSections = dto.canvasSections.map((s) => {
        return {
          sectionId: s.sectionId,
          title: s.title,
          aiInstructions: s.aiInstructions,
          feedbackRules: s.feedbackRules ?? null,
          questions: s.questions ?? null,
        };
      });
      workshop.canvasSections = updatedSections as WorkshopCanvasSection[];
    }

    const updatedWorkshop = await this.workshopEventRepository.save(workshop);
    return updatedWorkshop as WorkshopEvent;
  }
}
