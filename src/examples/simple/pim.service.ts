import { Service } from '@ltv/moleculer-decorators';
import pg from 'pg';
import { PostgraphileMixin } from '../../lib/postgraphile';
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

@Service({
  name: 'pim',
  mixins: [PostgraphileMixin({ schema: 'pim', pgPool })],
  settings: {
    postgraphile: true
  }
})
class PimService {}

export = PimService;
