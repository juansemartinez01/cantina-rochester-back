import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
  ) {}

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }

  /** Valida email+password y adjunta roles */
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usuarioService.findByEmail(email);
    if (!user) return null;
    if (!user.activo) return null;

    const valid = await bcrypt.compare(pass, user.clave_hash);
    if (!valid) return null;

    const roles = user.roles.map(ur => ur.rol.nombre);

    const { clave_hash, roles: _, ...rest } = user;
    return {
      ...rest,
      roles,
    };
  }

  /** Genera y devuelve el JWT */
  async login(user: any) {
    const payload = { sub: user.id, usuario: user.usuario, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
