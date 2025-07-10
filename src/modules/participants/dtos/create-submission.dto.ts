import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { SubmissionStatus, ReviewStatus } from '../../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class QuestionAnswerDto {
  @IsString()
  questionId!: string;

  @IsArray()
  answer!: string[];
}

export class CanvasSectionDataDto {
  @IsString()
  sectionId!: string;

  @ApiProperty({
    description:
      'Content for this section - can be a string or array of strings',
    example: ['Item 1', 'Item 2'],
  })
  @IsArray()
  content!: string[];
}

export class CreateSubmissionDto {
  @IsUUID()
  @ApiProperty({
    description: 'ID of the workshop event',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  workshopEventId!: string;

  @IsEmail()
  @ApiProperty({
    description: 'Email of the participant',
    example: 'participant@example.com',
  })
  email!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  @IsOptional()
  @ApiProperty({ required: false })
  questionAnswers?: QuestionAnswerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CanvasSectionDataDto)
  @IsOptional()
  @ApiProperty({ required: false })
  canvasData?: CanvasSectionDataDto[];

  @IsEnum(SubmissionStatus)
  @IsOptional()
  status?: SubmissionStatus;

  @IsEnum(ReviewStatus)
  @IsOptional()
  reviewStatus?: ReviewStatus;
}
