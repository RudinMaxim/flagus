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
  FlagTTLService: Symbol.for('FlagTTLService'),
  FeatureFlagCleanupService: Symbol.for('FeatureFlagCleanupService'),

  AuthService: Symbol.for('AuthService'),
  TokenService: Symbol.for('TokenService'),
  UserService: Symbol.for('UserService'),

  AuditHttpController: Symbol.for('AuditHttpController'),
  CategoryHttpController: Symbol.for('CategoryHttpController'),
  FlagHttpController: Symbol.for('FlagHttpController'),
  UserHttpController: Symbol.for('UserHttpController'),
  AuthHttpController: Symbol.for('AuthHttpController'),
  EvaluateHttpController: Symbol.for('EvaluateHttpController'),

  AuthMiddleware: Symbol.for('AuthMiddleware'),

  PageController: Symbol.for('PageController'),
  FlagController: Symbol.for('FlagController'),
};
