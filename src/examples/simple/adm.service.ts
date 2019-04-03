import { Service } from '@ltv/moleculer-decorators';
import pg from 'pg';
import { PostgraphileMixin } from '../../lib/postgraphile';
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

@Service({
  name: 'adm',
  mixins: [PostgraphileMixin({ schema: 'adm', pgPool })],
  settings: {
    postgraphile: true
  }
})
class AdmService {}

export = AdmService;
