export const TYPES = {
  Logger: Symbol.for('LoggerService'),
  Config: Symbol.for('ConfigService'),
  DataGateway: Symbol.for('DataGateway'),
  OnInit: Symbol.for('OnInit'),
  OnDestroy: Symbol.for('OnDestroy'),

  FlagRepository: Symbol.for('FlagRepository'),
  AuditRepository: Symbol.for('AuditRepository'),
  CategoryRepository: Symbol.for('CategoryRepository'),
  UserRepository: Symbol.for('UserRepository'),

  AuditService: Symbol.for('AuditService'),
  FlagEvaluationService: Symbol.for('FlagEvaluationService'),
};
