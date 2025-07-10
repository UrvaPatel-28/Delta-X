import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from '../../decorators/public.decorator';
import { ApiMessages } from '../../common/constants/api-messages.constants';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: ApiMessages.AUTH.LOGIN_SUCCESS,
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: ApiMessages.AUTH.LOGIN_FAILED,
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      data: result,
      message: ApiMessages.AUTH.LOGIN_SUCCESS,
    };
  }
}
