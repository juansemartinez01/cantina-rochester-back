// 1) Primero: metadata de TypeORM
import 'reflect-metadata';

// 2) Después: carga tu .env
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({
  path: process.env.TYPEORM_ENV_FILE || process.env.ENV_FILE || '.env.local',
  override: true,
});

// 3) Finalmente: TypeORM DataSource
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // Con __dirname apunta siempre a /.../src cuando corres con ts-node
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: true,
  logging: false,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
