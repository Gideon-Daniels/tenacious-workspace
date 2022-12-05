const test = require('../../__fixtures/utils/test_helper').create();

describe.only(test.testName(__filename, 3), function () {
  const CacheBase = require('../../../lib/services/cache/cache-base');
  let mockOpts;
  beforeEach(() => {
    mockOpts = {};
  });

  afterEach(() => {
    test.sinon.restore();
    mockOpts = null;
  });
  context('constructor', () => {
    it('throws new error if name is not as string', () => {
      const mockName = null;
      try {
        new CacheBase(mockName, mockOpts);
      } catch (error) {
        test.chai.expect(error.message).to.equal('invalid name for cache: null');
      }
    });
  });

  it('test get name', () => {
    const mockName = 'mockName';
    const cacheBase = new CacheBase(mockName, mockOpts);
    cacheBase.name;
    test.chai.expect(cacheBase.name).to.equal('mockName');
  });

  it('test get opts', () => {
    const mockName = 'mockName';
    const cacheBase = new CacheBase(mockName, mockOpts);
    cacheBase.opts;

    test.chai.expect(cacheBase.opts).to.eql({});
  });

  it('', () =>
  {
    
  });
});