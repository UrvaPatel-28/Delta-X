import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { ApiMessages } from '../../common/constants/api-messages.constants';

@ApiTags('Tenants')
@Controller('tenants')
@ApiBearerAuth()
export class TenantsController {
  @Get('me')
  @ApiOperation({ summary: 'Get current tenant information' })
  @ApiResponse({
    status: 200,
    description: ApiMessages.TENANT.FETCHED,
  })
  @Roles('consultant')
  getCurrentTenant(@CurrentUser() user: any) {
    return {
      data: {
        id: user.tenantId,
      },
      message: ApiMessages.TENANT.FETCHED,
    };
  }
}
