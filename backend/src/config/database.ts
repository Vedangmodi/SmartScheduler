import knex from 'knex';
// @ts-ignore
import knexConfig from '../../knexfile';

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment as keyof typeof knexConfig];

export const db = knex(config);

export default db;
