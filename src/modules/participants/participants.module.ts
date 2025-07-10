import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopSubmission } from '../../entities/workshop-submission.entity';
import { WorkshopEvent } from '../../entities/workshop-event.entity';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkshopSubmission, WorkshopEvent]),
    AiModule,
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
