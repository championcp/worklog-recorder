import knex from 'knex';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');

export const db = knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, './migrations')
  },
  seeds: {
    directory: path.join(__dirname, './seeds')
  }
});

export default db;