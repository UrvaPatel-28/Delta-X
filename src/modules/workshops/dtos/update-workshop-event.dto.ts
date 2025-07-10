import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CanvasType, QuestionType } from '../../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateQuestionOptionDto {
  @IsString()
  @IsOptional()
  value?: string;
}

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  text?: string;

  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsBoolean()
  @IsOptional()
  expanded?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];
}

export class UpdateCanvasSectionDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Unique identifier for the canvas section',
    example: 'value-proposition',
    required: false,
  })
  sectionId?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  questions?: string[];

  @IsString()
  @IsOptional()
  aiInstructions?: string;

  @IsString()
  @IsOptional()
  feedbackRules?: string;
}

export class UpdateWorkshopEventDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsEnum(CanvasType)
  @IsOptional()
  canvasType?: CanvasType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionDto)
  @IsOptional()
  questions?: UpdateQuestionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCanvasSectionDto)
  @IsOptional()
  canvasSections?: UpdateCanvasSectionDto[];

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  allowReviews?: boolean;
}
