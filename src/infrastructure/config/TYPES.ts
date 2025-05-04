export const TYPES = {
  Logger: Symbol.for('LoggerService'),
  Config: Symbol.for('ConfigService'),
  DataGateway: Symbol.for('DataGateway'),
  OnInit: Symbol.for('OnInit'),
  OnDestroy: Symbol.for('OnDestroy'),

  FlagRepository: Symbol.for('FlagRepository'),
  AuditRepository: Symbol.for('AuditRepository'),
  AuditService: Symbol.for('AuditService'),
  CategoryRepository: Symbol.for('CategoryRepository'),
  FlagEvaluationService: Symbol.for('FlagEvaluationService'),
};
