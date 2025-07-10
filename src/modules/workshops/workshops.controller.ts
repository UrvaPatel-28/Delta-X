import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { WorkshopsService } from './workshops.service';
import { CreateWorkshopEventDto } from './dtos/create-workshop-event.dto';
import { UpdateWorkshopEventDto } from './dtos/update-workshop-event.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ApiMessages } from '../../common/constants/api-messages.constants';

@Controller('workshops')
@ApiTags('Workshops')
@ApiBearerAuth()
export class WorkshopsController {
  constructor(
    private readonly workshopsService: WorkshopsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'consultant')
  @ApiOperation({ summary: 'Create a new workshop event' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: ApiMessages.WORKSHOP.CREATED,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ApiMessages.GENERIC.BAD_REQUEST,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ApiMessages.AUTH.UNAUTHORIZED,
  })
  async createWorkshopEvent(
    @Body() createWorkshopEventDto: CreateWorkshopEventDto,
  ) {
    const workshop = await this.workshopsService.createWorkshopEvent(
      createWorkshopEventDto,
    );
    return {
      message: ApiMessages.WORKSHOP.CREATED,
      data: workshop,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'consultant')
  @ApiOperation({ summary: 'Get all workshop events with submission counts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: ApiMessages.WORKSHOP.FETCHED,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ApiMessages.AUTH.UNAUTHORIZED,
  })
  async getWorkshopEvents() {
    const events = await this.workshopsService.getWorkshopEvents();

    // Map the response to match frontend expectations
    const mappedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      canvasType: event.canvasType,
      isPublished: event.isPublished,
      allowReviews: event.allowReviews,
      questionsCount: event.questions.length,
      canvasSectionsCount: event.canvasSections.length,
      createdAt: event.createdAt,
      qrCodeUrl: event.qrCodeUrl,
      submissionCounts: {
        started: event.submissionCounts.started,
        completed: event.submissionCounts.completed,
        reviewed: event.submissionCounts.reviewed,
      },
    }));

    return {
      data: mappedEvents,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'consultant')
  @ApiOperation({ summary: 'Get workshop event by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: ApiMessages.WORKSHOP.FETCHED,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ApiMessages.WORKSHOP.NOT_FOUND,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ApiMessages.AUTH.UNAUTHORIZED,
  })
  async getWorkshopEventById(@Param('id') id: string) {
    const event = await this.workshopsService.getWorkshopEventById(id);
    if (!event) {
      throw new NotFoundException(
        `${ApiMessages.WORKSHOP.NOT_FOUND} (ID: ${id})`,
      );
    }
    return {
      message: ApiMessages.WORKSHOP.FETCHED,
      data: event,
    };
  }

  @Put(':id/generate-qr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'consultant')
  @ApiOperation({ summary: 'Generate QR code for workshop event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: ApiMessages.WORKSHOP.QR_GENERATED,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ApiMessages.WORKSHOP.NOT_FOUND,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ApiMessages.AUTH.UNAUTHORIZED,
  })
  async generateQrCode(@Param('id') id: string) {
    const baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    const qrCodeUrl = await this.workshopsService.generateQrCodeUrl(
      id,
      baseUrl,
    );

    if (!qrCodeUrl) {
      throw new NotFoundException(
        `${ApiMessages.WORKSHOP.NOT_FOUND} (ID: ${id})`,
      );
    }

    return {
      message: ApiMessages.WORKSHOP.QR_GENERATED,
      data: { qrCodeUrl },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'consultant')
  @ApiOperation({ summary: 'Update a workshop event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: ApiMessages.WORKSHOP.UPDATED,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ApiMessages.WORKSHOP.NOT_FOUND,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ApiMessages.GENERIC.BAD_REQUEST,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ApiMessages.AUTH.UNAUTHORIZED,
  })
  async updateWorkshopEvent(
    @Param('id') id: string,
    @Body() updateWorkshopEventDto: UpdateWorkshopEventDto,
  ) {
    const workshop = await this.workshopsService.updateWorkshopEvent(
      id,
      updateWorkshopEventDto,
    );
    return {
      message: ApiMessages.WORKSHOP.UPDATED,
      data: workshop,
    };
  }
}
