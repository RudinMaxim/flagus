import { ContainerModule } from 'inversify';
import { TYPES } from '../../infrastructure/config/types';
import { AuthService, TokenService, UserService, GroupService } from './services';

export const accessContainer = new ContainerModule(({ bind }) => {
  bind<AuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
  bind<TokenService>(TYPES.TokenService).to(TokenService).inSingletonScope();
  bind<UserService>(TYPES.UserService).to(UserService).inSingletonScope();
  bind<GroupService>(TYPES.GroupService).to(GroupService).inSingletonScope();
});
