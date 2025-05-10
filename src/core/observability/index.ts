import { ContainerModule } from 'inversify';
import { TYPES } from '../../infrastructure/config/types';
import { AuditService } from './services';

export const observabilityContainer = new ContainerModule(({ bind }) => {
  bind<AuditService>(TYPES.AuditService).to(AuditService).inSingletonScope();
});
