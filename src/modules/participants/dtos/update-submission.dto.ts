import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { SubmissionStatus } from '../../../common/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  QuestionAnswerDto,
  CanvasSectionDataDto,
} from './create-submission.dto';

export class UpdateSubmissionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  @IsOptional()
  @ApiProperty({
    description: 'Array of question answers',
    required: false,
    type: [QuestionAnswerDto],
  })
  questionAnswers?: QuestionAnswerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CanvasSectionDataDto)
  @IsOptional()
  @ApiProperty({
    description: 'Array of canvas section data',
    required: false,
    type: [CanvasSectionDataDto],
  })
  canvasData?: CanvasSectionDataDto[];

  @IsEnum(SubmissionStatus)
  @IsOptional()
  @ApiProperty({
    description: 'Status of the submission (STARTED, COMPLETED, REVIEWED)',
    enum: SubmissionStatus,
    required: false,
  })
  status?: SubmissionStatus;
}
