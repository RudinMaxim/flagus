export const TYPES = {
  // Сервисы
  LoggerService: Symbol.for('LoggerService'),
  ConfigService: Symbol.for('ConfigService'),

  // Гейтвеи хранилищ
  DataGateway: Symbol.for('DataGateway'),

  // Интерфейсы жизненного цикла
  OnInit: Symbol.for('OnInit'),
  OnDestroy: Symbol.for('OnDestroy'),
};
