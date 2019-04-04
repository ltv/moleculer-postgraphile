# Moleculer Postgraphile

This package use for creating mixin for each service which can support

[![CircleCI](https://circleci.com/gh/ltv/moleculer-postgraphile.svg?style=svg)](https://circleci.com/gh/ltv/moleculer-postgraphile)
[![Coverage Status](https://coveralls.io/repos/github/ltv/moleculer-postgraphile/badge.svg?branch=master)](https://coveralls.io/github/ltv/moleculer-postgraphile?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/moleculer-postgraphile.svg)](https://badge.fury.io/js/moleculer-postgraphile)

## Usage

```bash
yarn add moleculer-postgraphile
```

```js
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
```

- The mixin will create the `graphql` action for service.
- To change the action name, just metion the `action` in option

```js
{
  schema: 'public',
  action: 'graphile',
  pgPool: ...
}
```

- To call graphql from other service:

```js
const query = `
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
const variables = {};
const response = await broker.call('public.graphql', { query, variables });
```

- This mixin only create one graphql schema & service for one database schema.
- For stitching multiple schema from multiple services, use can use `introspectionQuery`

```js
import { introspectionQuery } from 'graphql';
const schema = broker.call('serviceName.graphql', {
  query: introspectionQuery
});
```

- After then, you should create custom ApolloLink which context call to:

```js
broker.call('serviceName.graphql', { query, variables });
```

- There is another way to discover the introspection without calling `introspectionQuery`
- After creating graphql schema, the mixin will store the `introspected query` in cacher and set `service.settings.hasGraphQLSchema = true`
- And will emit the event `graphile.updated` with params { schema } // schema stands for Schema Name
- To get the `introspectionQuery`:

```js
if (this.broker.cacher) {
  this.broker.cacher.get(`graphile.schema.${schemaName}`);
}
```

- Custom cache key

```js
PostgraphileMixin({
  schema: 'public',
  pgPool: new Pool({
    connectionString: process.env.DATABASE_URL
  }),
  cache: {
    prefix: 'my_key_prefix',
    name: 'my_key_name'
  }
});
```

- Available options:

```js
export interface MixinOptions {
  schema: string; // Schema name -> required
  pgPool: pg.Pool; // pgPool -> required
  options?: PostGraphileCoreOptions; // Postgraphile option -> default = {}
  action?: string; // action name -> default = 'graphql'
  cache?: { prefix: string, name: string }; // for setting cache -> default = true
}
```

## Test

Before testing, please provision env with docker

```bash
yarn provision:dev
```

And then

```bash
yarn test:unit
```
