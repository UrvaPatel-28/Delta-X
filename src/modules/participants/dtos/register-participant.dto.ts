import { IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterParticipantDto {
  @IsEmail()
  @ApiProperty({
    description: 'Email of the participant',
    example: 'participant@example.com',
  })
  email!: string;

  @IsUUID()
  @ApiProperty({
    description: 'ID of the workshop event',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  workshopEventId!: string;
}
