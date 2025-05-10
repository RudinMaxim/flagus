import { ContainerModule } from 'inversify';
import { TYPES } from '../../../../config/types';
import { AuditHttpController } from './audit.http.controller';
import { AuthHttpController } from './auth.http.controller';
import { CategoryHttpController } from './category.http.controller';
import { EvaluateHttpController } from './evaluate.http.controller';
import { FlagHttpController } from './flag.http.controller';
import { UserHttpController } from './user.http.controller';
import { GroupHttpController } from './group.http.controller';
import { EnvironmentHttpController } from './environment.http.controller';

export const httpControllerModule = new ContainerModule(({ bind }) => {
  bind<AuditHttpController>(TYPES.AuditHttpController).to(AuditHttpController).inSingletonScope();
  bind<AuthHttpController>(TYPES.AuthHttpController).to(AuthHttpController).inSingletonScope();
  bind<CategoryHttpController>(TYPES.CategoryHttpController)
    .to(CategoryHttpController)
    .inSingletonScope();
  bind<EvaluateHttpController>(TYPES.EvaluateHttpController)
    .to(EvaluateHttpController)
    .inSingletonScope();
  bind<FlagHttpController>(TYPES.FlagHttpController).to(FlagHttpController).inSingletonScope();
  bind<UserHttpController>(TYPES.UserHttpController).to(UserHttpController).inSingletonScope();
  bind<GroupHttpController>(TYPES.GroupHttpController).to(GroupHttpController).inSingletonScope();
  bind<EnvironmentHttpController>(TYPES.EnvironmentHttpController)
    .to(EnvironmentHttpController)
    .inSingletonScope();
});
