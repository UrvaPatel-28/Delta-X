import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserChatDto {
  @ApiProperty({
    description: 'The question sent by the user',
    example: 'Can you help me improve my value proposition?',
  })
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiProperty({
    description: 'The ID of the specific section to focus on (optional)',
    example: 'value-proposition',
    required: false,
  })
  @IsOptional()
  @IsString()
  sectionId?: string;
}
