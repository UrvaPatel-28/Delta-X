import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopSubmission } from '../../entities/workshop-submission.entity';
import { WorkshopEvent } from '../../entities/workshop-event.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { OpenAIProvider } from './providers/openai.provider';

@Module({
  imports: [TypeOrmModule.forFeature([WorkshopSubmission, WorkshopEvent])],
  controllers: [AiController],
  providers: [AiService, OpenAIProvider],
  exports: [AiService],
})
export class AiModule {}
