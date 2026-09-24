import { APP_ROLES } from '../auth/roles.constants';
import { IS_PUBLIC_KEY } from '../auth/isPublic';
import { RoleController } from '../role/role.controller';
import { UsuarioRolController } from '../usuario-rol/usuario-rol.controller';
import { UsuarioController } from './usuario.controller';

describe('user administration access', () => {
  it.each([UsuarioController, RoleController, UsuarioRolController])(
    'restricts %p to administrators',
    (controller) => {
      expect(Reflect.getMetadata('roles', controller)).toEqual([
        APP_ROLES.ADMIN,
      ]);
    },
  );

  it('does not expose user creation as a public endpoint', () => {
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, UsuarioController.prototype.create),
    ).not.toBe(true);
  });
});
