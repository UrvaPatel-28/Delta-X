import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopsService } from './workshops.service';
import { WorkshopsController } from './workshops.controller';
import { WorkshopEvent } from '../../entities/workshop-event.entity';
import { WorkshopEventRepository } from '../../repositories/workshop-event.repository';
import { WorkshopSubmission } from '../../entities/workshop-submission.entity';
import { WorkshopSubmissionRepository } from '../../repositories/workshop-submission.repository';

@Module({
  imports: [TypeOrmModule.forFeature([WorkshopEvent, WorkshopSubmission])],
  controllers: [WorkshopsController],
  providers: [
    WorkshopsService,
    WorkshopEventRepository,
    WorkshopSubmissionRepository,
  ],
  exports: [WorkshopsService],
})
export class WorkshopsModule {}
