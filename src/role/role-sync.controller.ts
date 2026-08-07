import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from '../auth/isPublic';
import { RoleService } from './role.service';

@Public()
@Controller('internal/roles')
export class RoleSyncController {
  constructor(private readonly roles: RoleService) {}

  @Post('sync')
  async sync(
    @Headers('x-role-sync-secret') receivedSecret: string | undefined,
    @Body('name') name: string,
  ) {
    const expectedSecret = process.env.ROLE_SYNC_SECRET?.trim();
    if (!expectedSecret || receivedSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid role sync secret');
    }

    const role = await this.roles.create({ nombre: name });
    return { ok: true, item: { id: role.id, name: role.nombre } };
  }
}
