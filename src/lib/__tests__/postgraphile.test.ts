import { PostgraphileMixin } from '../postgraphile';
import { Pool } from 'pg';
import { ServiceBroker, Service } from 'moleculer';

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

    it('Should set schema to cache if cacher present', async () => {
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

    broker.createService({
      name: 'test',
      actions: {
        checkSchemaCache() {
          return this.broker.cacher.get('graphql.schema.public');
        }
      }
    });

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    it('Should set schema to cache if cacher present', async () => {
      const schemaDataFromCache = broker.call('test.checkSchemaCache');
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

    it('Should run correct mutation', async () => {
      // Use public schema, there is PubPost table with data
      const query: string = `
        mutation createPubPost($input: CreatePubPostInput!) {
          createPubPost(input: $input) {
            pubPost {
              id
              title
              content
            }
          }
        }
      `;
      const variables = {
        input: {
          pubPost: {
            title: 'Hello',
            content: 'World'
          }
        }
      };
      const response: any = await broker.call('public.graphql', {
        query,
        variables
      });
      expect(response).toMatchObject({
        data: {
          createPubPost: {
            pubPost: expect.any(Object)
          }
        }
      });
    });
  });
});
