import { ContainerModule } from 'inversify';
import { FlagController } from './flag.controller';
import { PageController } from './page.controller';
import { TYPES } from '../../../config/types';
import { IAMController } from './iam.controller';

export const clientControllerModule = new ContainerModule(({ bind }) => {
  bind<FlagController>(TYPES.FlagController).to(FlagController).inSingletonScope();
  bind<PageController>(TYPES.PageController).to(PageController).inSingletonScope();
  bind<IAMController>(TYPES.IAMController).to(IAMController).inSingletonScope();
});
