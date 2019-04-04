# CHANGELOGS

## v0.1.2

- Add cache option

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

## v0.1.1

- Minor fix & Update documents

## v0.1.0

- Create post graphile mixin

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
