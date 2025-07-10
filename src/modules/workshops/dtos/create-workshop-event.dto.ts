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

export class QuestionOptionDto {
  @IsString()
  value!: string;
}

export class CreateQuestionDto {
  @IsString()
  id!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsBoolean()
  required!: boolean;

  @IsBoolean()
  expanded!: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];
}

export class CanvasSectionDto {
  @IsString()
  @ApiProperty({
    description: 'Unique identifier for the canvas section',
    example: 'value-proposition',
  })
  sectionId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  questions?: string[];

  @IsString()
  aiInstructions!: string;

  @IsString()
  @IsOptional()
  feedbackRules?: string;
}

export class CreateWorkshopEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(CanvasType)
  canvasType!: CanvasType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CanvasSectionDto)
  canvasSections!: CanvasSectionDto[];

  @IsBoolean()
  isPublished!: boolean;

  @IsBoolean()
  allowReviews!: boolean;
}
