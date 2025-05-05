export const TYPES = {
  Logger: Symbol.for('Logger'),
  Config: Symbol.for('Config'),
  DataGateway: Symbol.for('DataGateway'),
  OnInit: Symbol.for('OnInit'),
  OnDestroy: Symbol.for('OnDestroy'),

  FlagRepository: Symbol.for('FlagRepository'),
  AuditRepository: Symbol.for('AuditRepository'),
  CategoryRepository: Symbol.for('CategoryRepository'),
  UserRepository: Symbol.for('UserRepository'),

  AuditService: Symbol.for('AuditService'),
  FlagEvaluationService: Symbol.for('FlagEvaluationService'),
  FeatureFlagService: Symbol.for('FeatureFlagService'),
  CategoryService: Symbol.for('CategoryService'),
};
