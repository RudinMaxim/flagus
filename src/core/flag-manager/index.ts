import { ContainerModule } from 'inversify';
import { TYPES } from '../../infrastructure/config/types';
import {
  AuditService,
  CategoryService,
  FeatureFlagService,
  FlagEvaluationService,
  FlagTTLService,
} from './service';

export const flagManagerContainer = new ContainerModule(({ bind }) => {
  bind<AuditService>(TYPES.AuditService).to(AuditService).inSingletonScope();
  bind<CategoryService>(TYPES.CategoryService).to(CategoryService).inSingletonScope();
  bind<FeatureFlagService>(TYPES.FeatureFlagService).to(FeatureFlagService).inSingletonScope();
  bind<FlagEvaluationService>(TYPES.FlagEvaluationService)
    .to(FlagEvaluationService)
    .inSingletonScope();
  bind<FlagTTLService>(TYPES.FlagTTLService).to(FlagTTLService).inSingletonScope();
});
