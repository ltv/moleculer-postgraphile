import { graphql, introspectionQuery } from 'graphql';
import { Context, ServiceSchema } from 'moleculer';
import pg from 'pg';
import {
  createPostGraphileSchema,
  withPostGraphileContext
} from 'postgraphile';
import { PostGraphileCoreOptions } from 'postgraphile-core';

/**
 * schema: stands for schema name (database schema)
 * pgPool: PostgresQL Pool
 * options: PostGraphileCoreOptions (https://github.com/graphile/graphile-engine/blob/413ea16efe4489aa8c1d652efef08fa5e24204c0/packages/postgraphile-core/src/index.ts#L53)
 * action: action name (default: graphql)
 */
export interface MixinOptions {
  schema: string;
  pgPool: pg.Pool;
  options?: PostGraphileCoreOptions;
  action?: string;
}

export function PostgraphileMixin(options: MixinOptions): ServiceSchema {
  let schema;
  const {
    schema: schemaName,
    pgPool,
    options: postGraphileOptions = {},
    action = 'graphql'
  } = options;
  if (!schemaName) {
    throw new Error('Schema name is required');
  }
  if (!pgPool) {
    throw new Error('pgPool is required');
  }

  return {
    name: '',
    actions: {
      [action]: {
        params: {
          query: { type: 'string' },
          variables: { type: 'object', optional: true }
        },
        handler(ctx: Context): any {
          const { query, variables } = ctx.params;
          const withContextOptions = {
            pgPool
          };
          return withPostGraphileContext(withContextOptions, (context: any) =>
            graphql(schema, query, undefined, context, variables)
          );
        }
      }
    },

    async started(): Promise<void> {
      schema = await createPostGraphileSchema(
        pgPool,
        schemaName,
        postGraphileOptions
      );

      const introsepectedSchema = await this.actions[action]({
        query: introspectionQuery
      });

      if (this.broker.cacher) {
        this.broker.cacher
          .set(`graphile.schema.${schemaName}`, introsepectedSchema.data)
          .then(() => (this.settings.hasGraphQLSchema = true))
          .then(() =>
            this.broker.broadcast('graphile.updated', { schema: schemaName })
          );
      }
    }
  };
}
