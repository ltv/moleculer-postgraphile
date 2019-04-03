import { PostgraphileMixin } from '../index';

describe(`>> index <<`, () => {
  it('Should export PostgraphileMixin', () => {
    expect(PostgraphileMixin).toBeInstanceOf(Function);
  });
});
