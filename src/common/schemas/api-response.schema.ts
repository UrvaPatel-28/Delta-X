import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseSchema<T> {
  @ApiProperty()
  data: T;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ example: true })
  success: boolean;
}

export class ApiErrorResponseSchema {
  @ApiProperty({ example: null })
  data: null;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  message: string;

  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: '/api/auth/login' })
  path: string;

  @ApiProperty({ example: '2023-06-24T04:46:01.142Z' })
  timestamp: string;
}
