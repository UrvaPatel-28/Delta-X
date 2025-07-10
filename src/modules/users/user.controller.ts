import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ApiMessages } from '../../common/constants/api-messages.constants';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: ApiMessages.USER.FETCHED,
  })
  async getUSers() {
    const users = await this.usersService.getUsers();
    return {
      data: users,
      message: ApiMessages.USER.FETCHED,
    };
  }
}
