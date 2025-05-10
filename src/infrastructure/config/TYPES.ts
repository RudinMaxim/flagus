export const TYPES = {
  // ———————————————————————————————————————————————
  // Примитивные сервисы и утилиты
  // ———————————————————————————————————————————————
  Logger: Symbol.for('Logger'),
  Config: Symbol.for('Config'),

  // ———————————————————————————————————————————————
  // Жизненный цикл
  // ———————————————————————————————————————————————
  OnInit: Symbol.for('OnInit'),
  OnDestroy: Symbol.for('OnDestroy'),

  // ———————————————————————————————————————————————
  // Фабрики и шлюзы данных
  // ———————————————————————————————————————————————
  DataGateway: Symbol.for('DataGateway'),
  DataGatewayFactory: Symbol.for('DataGatewayFactory'),
  SDKKeyFactory: Symbol.for('SDKKeyFactory'),

  // ———————————————————————————————————————————————
  // Репозитории (Data Access)
  // ———————————————————————————————————————————————
  FlagRepository: Symbol.for('FlagRepository'),
  AuditRepository: Symbol.for('AuditRepository'),
  CategoryRepository: Symbol.for('CategoryRepository'),
  UserRepository: Symbol.for('UserRepository'),
  GroupRepository: Symbol.for('GroupRepository'),
  EnvironmentRepository: Symbol.for('EnvironmentRepository'),

  // ———————————————————————————————————————————————
  // Службы (Services)
  // ———————————————————————————————————————————————
  EnvironmentService: Symbol.for('EnvironmentService'),
  AuditService: Symbol.for('AuditService'),
  FlagEvaluationService: Symbol.for('FlagEvaluationService'),
  FeatureFlagService: Symbol.for('FeatureFlagService'),
  CategoryService: Symbol.for('CategoryService'),
  UserService: Symbol.for('UserService'),
  AuthService: Symbol.for('AuthService'),
  TokenService: Symbol.for('TokenService'),
  GroupService: Symbol.for('GroupService'),
  FlagTTLService: Symbol.for('FlagTTLService'),
  FeatureFlagCleanupService: Symbol.for('FeatureFlagCleanupService'),

  // ———————————————————————————————————————————————
  // HTTP-контроллеры
  // ———————————————————————————————————————————————
  AuditHttpController: Symbol.for('AuditHttpController'),
  CategoryHttpController: Symbol.for('CategoryHttpController'),
  FlagHttpController: Symbol.for('FlagHttpController'),
  UserHttpController: Symbol.for('UserHttpController'),
  AuthHttpController: Symbol.for('AuthHttpController'),
  EvaluateHttpController: Symbol.for('EvaluateHttpController'),
  GroupHttpController: Symbol.for('GroupHttpController'),
  EnvironmentHttpController: Symbol.for('EnvironmentHttpController'),

  // ———————————————————————————————————————————————
  // Web/UI-контроллеры
  // ———————————————————————————————————————————————
  PageController: Symbol.for('PageController'),
  FlagController: Symbol.for('FlagController'),

  // ———————————————————————————————————————————————
  // Middleware
  // ———————————————————————————————————————————————
  AuthMiddleware: Symbol.for('AuthMiddleware'),
};
