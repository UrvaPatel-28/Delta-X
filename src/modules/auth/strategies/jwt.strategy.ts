import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { TenantContextService } from '../../tenants/tenant-context.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private moduleRef: ModuleRef,
  ) {
    super({
      passReqToCallback: true,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'secretkeyforproduction',
    });

    this.logger.log('JWT Strategy - Constructor initialized');
  }

  async validate(request: Request, payload: JwtPayload) {
    this.logger.debug(`Validating token payload: ${JSON.stringify(payload)}`);

    try {
      if (!payload.sub || !payload.tenantId) {
        this.logger.error('Invalid token payload: Missing required fields');
        throw new UnauthorizedException('Invalid token payload');
      }

      // Get the contextId from the request
      const contextId = ContextIdFactory.getByRequest(request);

      // Resolve both services in parallel for better performance
      const [tenantContextService, usersService] = await Promise.all([
        this.moduleRef.resolve(TenantContextService, contextId, {
          strict: false,
        }),
        this.moduleRef.resolve(UsersService, contextId, { strict: false }),
      ]);

      // Set the tenant ID from the JWT payload
      tenantContextService.setTenantId(payload.tenantId);
      this.logger.debug(`Set tenant ID: ${payload.tenantId}`);

      // Find the user using the resolved service
      const user = await usersService.findById(payload.sub);

      if (!user) {
        this.logger.warn(`User not found with ID: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      const userData = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };

      this.logger.debug(`Validated user: ${JSON.stringify(userData)}`);
      return userData;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        this.logger.error(
          `Error validating user: ${errorMessage}`,
          error.stack,
        );
      } else {
        this.logger.error(`Error validating user: ${errorMessage}`);
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }
}
