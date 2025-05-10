import { Container } from 'inversify';
import { describe, beforeEach, it } from 'node:test';
import { Environment, SDKKeyType } from '../../core/environment/model';
import { SDKKeyFactory } from '../../core/environment/sdk-key.factory';
import { EnvironmentService } from '../../core/environment/service/environment.service';
import { AuditService } from '../../core/flag-manager/service';
import { ILogger } from '../../shared/logger';
import { TYPES } from '../config/types';
import { IEnvironmentRepository } from '../persistence';

describe('EnvironmentService', () => {
  let container: Container;
  let environmentService: EnvironmentService;
  let environmentRepository: jest.Mocked<IEnvironmentRepository>;
  let auditService: jest.Mocked<AuditService>;
  let logger: jest.Mocked<ILogger>;
  let sdkKeyFactory: jest.Mocked<SDKKeyFactory>;

  beforeEach(() => {
    container = new Container();
    environmentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    auditService = {
      logAction: jest.fn(),
    } as any;
    logger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;
    sdkKeyFactory = {
      generateKey: jest.fn(),
    } as any;

    container
      .bind<IEnvironmentRepository>(TYPES.EnvironmentRepository)
      .toConstantValue(environmentRepository);
    container.bind<AuditService>(TYPES.AuditService).toConstantValue(auditService);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(logger);
    container.bind<SDKKeyFactory>(TYPES.SDKKeyFactory).toConstantValue(sdkKeyFactory);
    container.bind<EnvironmentService>(TYPES.EnvironmentService).to(EnvironmentService);

    environmentService = container.get<EnvironmentService>(TYPES.EnvironmentService);
  });

  describe('create', () => {
    it('should create a new environment and log audit', async () => {
      const dto = { name: 'prod', createdBy: 'user1' };
      const environment = new Environment({
        id: 'env1',
        name: 'prod',
        sdkKeys: [],
        metadata: { createdBy: 'user1', createdAt: new Date() },
      });

      environmentRepository.findByName.mockResolvedValue(null);
      environmentRepository.create.mockResolvedValue(environment);
      auditService.logAction.mockResolvedValue({} as any);

      const result = await environmentService.create(dto);

      expect(environmentRepository.findByName).toHaveBeenCalledWith('prod');
      expect(environmentRepository.create).toHaveBeenCalledWith(expect.any(Environment));
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          action: 'create',
          entityType: 'environment',
        })
      );
      expect(result).toEqual(environment);
    });

    it('should throw if environment name already exists', async () => {
      const dto = { name: 'prod', createdBy: 'user1' };
      environmentRepository.findByName.mockResolvedValue({ id: 'env1', name: 'prod' } as any);

      await expect(environmentService.create(dto)).rejects.toThrow(
        'Environment with name prod already exists'
      );
    });
  });

  describe('generateSDKKey', () => {
    it('should generate and save an SDK key', async () => {
      const environment = new Environment({
        id: 'env1',
        name: 'prod',
        sdkKeys: [],
        metadata: { createdBy: 'user1', createdAt: new Date() },
      });
      sdkKeyFactory.generateKey.mockReturnValue('client_123');
      environmentRepository.findById.mockResolvedValue(environment);
      environmentRepository.update.mockResolvedValue(environment);
      auditService.logAction.mockResolvedValue({} as any);

      const key = await environmentService.generateSDKKey('env1', SDKKeyType.CLIENT, 'user1');

      expect(sdkKeyFactory.generateKey).toHaveBeenCalledWith(SDKKeyType.CLIENT);
      expect(environmentRepository.update).toHaveBeenCalledWith('env1', expect.any(Environment));
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          action: 'create',
          entityType: 'sdk_key',
        })
      );
      expect(key).toBe('client_123');
    });
  });

  describe('validateSDKKey', () => {
    it('should validate an active SDK key', async () => {
      const environment = new Environment({
        id: 'env1',
        name: 'prod',
        sdkKeys: [
          {
            key: 'client_123',
            type: SDKKeyType.CLIENT,
            createdAt: new Date(),
            createdBy: 'user1',
            isActive: true,
          },
        ],
        metadata: { createdBy: 'user1', createdAt: new Date() },
      });
      environmentRepository.findById.mockResolvedValue(environment);

      const isValid = await environmentService.validateSDKKey(
        'env1',
        'client_123',
        SDKKeyType.CLIENT
      );

      expect(isValid).toBe(true);
    });

    it('should return false for an inactive SDK key', async () => {
      const environment = new Environment({
        id: 'env1',
        name: 'prod',
        sdkKeys: [
          {
            key: 'client_123',
            type: SDKKeyType.CLIENT,
            createdAt: new Date(),
            createdBy: 'user1',
            isActive: false,
          },
        ],
        metadata: { createdBy: 'user1', createdAt: new Date() },
      });
      environmentRepository.findById.mockResolvedValue(environment);

      const isValid = await environmentService.validateSDKKey(
        'env1',
        'client_123',
        SDKKeyType.CLIENT
      );

      expect(isValid).toBe(false);
    });
  });
});
