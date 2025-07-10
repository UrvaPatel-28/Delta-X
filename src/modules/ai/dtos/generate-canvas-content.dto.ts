import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';

export class QuestionAnswerDto {
  @IsString()
  questionId!: string;

  @ApiProperty({
    description: 'The answer to the question',
    example: 'Answer to the question',
  })
  @IsArray()
  answer!: string | string[];
}

export class GenerateCanvasContentDto {
  @IsUUID()
  workshopEventId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  questionAnswers!: QuestionAnswerDto[];
}
