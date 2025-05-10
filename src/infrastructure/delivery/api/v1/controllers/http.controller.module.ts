import { ContainerModule } from 'inversify';
import { TYPES } from '../../../../config/types';
import { AuditHttpController } from './audit.http.controller';
import { AuthHttpController } from './auth.http.controller';
import { CategoryHttpController } from './category.http.controller';
import { EvaluateHttpController } from './evaluate.http.controller';
import { FlagHttpController } from './flag.http.controller';
import { UserHttpController } from './user.http.controller';

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
});
