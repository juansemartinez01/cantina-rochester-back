const mockDataSource = {
  setOptions: jest.fn(),
  initialize: jest.fn(),
  destroy: jest.fn(),
  query: jest.fn(),
  synchronize: jest.fn(),
  runMigrations: jest.fn(),
};

jest.mock('src/data-source', () => ({
  __esModule: true,
  default: mockDataSource,
}));

import {
  ensureMigrationBaseline,
  shouldRunDatabaseMigrations,
} from './migration-runtime';

describe('migration runtime', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      DB_MIGRATIONS_RUN: 'true',
      DB_MIGRATIONS_BASELINE: 'true',
    };
    mockDataSource.initialize.mockResolvedValue(undefined);
    mockDataSource.destroy.mockResolvedValue(undefined);
    mockDataSource.synchronize.mockResolvedValue(undefined);
    mockDataSource.runMigrations.mockResolvedValue([]);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates the current schema and fakes migrations for an empty database', async () => {
    mockDataSource.query.mockResolvedValueOnce([]);

    await ensureMigrationBaseline();

    expect(mockDataSource.synchronize).toHaveBeenCalledWith(false);
    expect(mockDataSource.runMigrations).toHaveBeenCalledWith({
      transaction: 'all',
      fake: true,
    });
    expect(mockDataSource.destroy).toHaveBeenCalled();
  });

  it('registers the legacy baseline for a complete existing schema', async () => {
    mockDataSource.query
      .mockResolvedValueOnce([{ tablename: 'producto' }, { tablename: 'venta' }])
      .mockResolvedValueOnce([{ count: 4 }])
      .mockResolvedValueOnce([]);

    await ensureMigrationBaseline();

    expect(mockDataSource.synchronize).not.toHaveBeenCalled();
    expect(mockDataSource.runMigrations).not.toHaveBeenCalled();
    expect(mockDataSource.query).toHaveBeenCalledTimes(
      3 + 11,
    );
  });

  it('stops when only a partial application schema exists', async () => {
    mockDataSource.query
      .mockResolvedValueOnce([{ tablename: 'producto' }])
      .mockResolvedValueOnce([{ count: 1 }]);

    await expect(ensureMigrationBaseline()).rejects.toThrow(
      'Partial database schema detected',
    );
    expect(mockDataSource.synchronize).not.toHaveBeenCalled();
    expect(mockDataSource.destroy).toHaveBeenCalled();
  });

  it('allows an explicit false value to disable migrations on Railway', () => {
    process.env.RAILWAY_PROJECT_ID = 'project-id';
    process.env.DB_MIGRATIONS_RUN = 'false';

    expect(shouldRunDatabaseMigrations()).toBe(false);
  });
});
