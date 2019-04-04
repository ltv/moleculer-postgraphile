import { PostgraphileMixin } from '../postgraphile';
import { Pool } from 'pg';
import { ServiceBroker, Service, Context } from 'moleculer';

describe('>> postgraphile <<', () => {
  it('Should creat mixin correctly', () => {
    const pMixin = PostgraphileMixin({
      schema: 'public',
      pgPool: new Pool({
        connectionString: process.env.DATABASE_URL
      })
    });

    expect.assertions(3);
    const { actions, started } = pMixin;
    expect(actions).toHaveProperty('graphql');
    expect(actions.graphql).toMatchObject({
      params: expect.any(Object),
      handler: expect.any(Function)
    });
    expect(started).toBeInstanceOf(Function);
  });

  it('Should throw error if not passing `schema`', () => {
    expect(() => {
      PostgraphileMixin({
        schema: undefined,
        pgPool: new Pool({
          connectionString: process.env.DATABASE_URL
        })
      });
    }).toThrow('Schema name is required');
  });

  it('Should throw error if not passing `pgPool`', () => {
    expect(() => {
      PostgraphileMixin({
        schema: 'public',
        pgPool: undefined
      });
    }).toThrow('pgPool is required');
  });

  it('Should create mixin with optional action when passing `action`', () => {
    const pMixin = PostgraphileMixin({
      schema: 'public',
      pgPool: new Pool({
        connectionString: process.env.DATABASE_URL
      }),
      action: 'graphile'
    });
    expect.assertions(3);
    const { actions, started } = pMixin;
    expect(actions).toHaveProperty('graphile');
    expect(actions.graphile).toMatchObject({
      params: expect.any(Object),
      handler: expect.any(Function)
    });
    expect(started).toBeInstanceOf(Function);
  });

  describe('>> postgraphile - test integrate with service <<', () => {
    const broker = new ServiceBroker({
      logger: false
    });

    broker.createService({
      name: 'public',
      mixins: [
        PostgraphileMixin({
          schema: 'public',
          pgPool: new Pool({
            connectionString: process.env.DATABASE_URL
          })
        })
      ]
    });

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    it('Should create service correctly with PostgraphileMixix injected', async () => {
      expect.assertions(2);
      const [services, actions] = await Promise.all([
        broker.call('$node.services'),
        broker.call('$node.actions')
      ]);
      const hasService = services.some((s: Service) => s.name === 'public');
      const hasAction = actions.some((a: any) => a.name === 'public.graphql');
      expect(hasService).toEqual(true);
      expect(hasAction).toEqual(true);
    });

    it('Should set schema to cache if cache present', async () => {
      expect.assertions(2);
      const [services, actions] = await Promise.all([
        broker.call('$node.services'),
        broker.call('$node.actions')
      ]);
      const hasService = services.some((s: Service) => s.name === 'public');
      const hasAction = actions.some((a: any) => a.name === 'public.graphql');
      expect(hasService).toEqual(true);
      expect(hasAction).toEqual(true);
    });
  });

  describe('>> postgraphile - test integrate with service - with CACHER <<', () => {
    const broker = new ServiceBroker({
      logger: false,
      cacher: 'Memory'
    });

    const testSchema = {
      name: 'test',
      actions: {
        checkSchemaCache(ctx: Context) {
          const { cacheKey } = ctx.params;
          return this.broker.cacher.get(cacheKey);
        }
      }
    };

    const cache = {
      prefix: 'my_prefix',
      name: 'my_cache_name'
    };

    describe('-- DONOT CACHE --', () => {
      broker.createService({
        name: 'public',
        mixins: [
          PostgraphileMixin({
            schema: 'public',
            pgPool: new Pool({
              connectionString: process.env.DATABASE_URL
            }),
            cache: false
          })
        ]
      });

      broker.createService(testSchema);

      beforeAll(() => broker.start().then(() => broker.cacher.clean('*.*.*')));
      afterAll(() => broker.stop());

      it('Shouldnot set schema to cache if cache set to false', async () => {
        const schemaDataFromCache = await broker.call('test.checkSchemaCache', {
          cacheKey: 'graphile.schema.public'
        });
        expect(schemaDataFromCache).toBeFalsy();
      });

      it('Should return list of data if call graphql', async () => {
        // Use public schema, there is PubPost table with data
        const query: string = `
          query { 
            allPubPosts {
              nodes {
                id
                title
                content
              }
            }
          }
        `;
        const response: any = await broker.call('public.graphql', { query });
        expect(response).toMatchObject({
          data: {
            allPubPosts: {
              nodes: expect.any(Array)
            }
          }
        });
      });
    });

    describe('-- DEFAULT CACHE --', () => {
      broker.createService({
        name: 'public',
        mixins: [
          PostgraphileMixin({
            schema: 'public',
            pgPool: new Pool({
              connectionString: process.env.DATABASE_URL
            }),
            cache: true
          })
        ]
      });

      broker.createService(testSchema);

      beforeAll(() => broker.start().then(() => broker.cacher.clean('*')));
      afterAll(() => broker.stop());

      it('Should set schema to cache if cache present with default cache option `graphile.schema.${schemaName}`', async () => {
        const schemaDataFromCache = await broker.call('test.checkSchemaCache', {
          cacheKey: 'graphile.schema.public'
        });
        expect(schemaDataFromCache).toBeTruthy();
      });

      it('Should return list of data if call graphql', async () => {
        // Use public schema, there is PubPost table with data
        const query: string = `
          query { 
            allPubPosts {
              nodes {
                id
                title
                content
              }
            }
          }
        `;
        const response: any = await broker.call('public.graphql', { query });
        expect(response).toMatchObject({
          data: {
            allPubPosts: {
              nodes: expect.any(Array)
            }
          }
        });
      });
    });

    describe('-- CUSTOM CACHE --', () => {
      broker.createService({
        name: 'public',
        mixins: [
          PostgraphileMixin({
            schema: 'public',
            pgPool: new Pool({
              connectionString: process.env.DATABASE_URL
            }),
            cache
          })
        ]
      });

      broker.createService(testSchema);

      beforeAll(() => broker.start().then(() => broker.cacher.clean('*')));
      afterAll(() => broker.stop());

      it('Should set schema to cache if cacher present with custom cacher option `${prefix}.schema.${name}`', async () => {
        const schemaDataFromCache = await broker.call('test.checkSchemaCache', {
          cacheKey: `${cache.prefix}.schema.${cache.name}`
        });
        expect(schemaDataFromCache).toBeTruthy();
      });

      it('Should return list of data if call graphql', async () => {
        // Use public schema, there is PubPost table with data
        const query: string = `
          query { 
            allPubPosts {
              nodes {
                id
                title
                content
              }
            }
          }
        `;
        const response: any = await broker.call('public.graphql', { query });
        expect(response).toMatchObject({
          data: {
            allPubPosts: {
              nodes: expect.any(Array)
            }
          }
        });
      });
    });
  });
});
