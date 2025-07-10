import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '../modules/tenants/tenant-context.service';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly jwtService: JwtService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const fullPath = req.originalUrl || req.url;

    // Define all public routes that should bypass tenant validation
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/health',
      '/api/swagger',
      '/api/participants',
      '/api/ai',
    ];

    // Check if the path starts with any of the public routes
    if (publicRoutes.some((route) => fullPath.startsWith(route))) {
      return next();
    }

    if (!req.headers.authorization) {
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      const payload = this.jwtService.verify<JwtPayload>(token);

      if (!payload.tenantId) {
        throw new UnauthorizedException('Tenant ID is missing from token');
      }

      this.tenantContextService.setTenantId(payload.tenantId);
      next();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.log(
        'TenantMiddleware - Token verification failed:',
        errorMessage,
      );
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
