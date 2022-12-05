const test = require('../../__fixtures/utils/test_helper').create();

describe(test.testName(__filename, 3), function () {
  const StaticCache = require('../../../lib/services/cache/cache-static');
  const CacheService = require('../../../lib/services/cache/service');
  let mockOpts;

  beforeEach(() => {
    mockOpts = {
      logger: {
        createLogger: test.sinon.stub(),
        //   .returns({
        //   $$TRACE: test.sinon.stub(),
        //   warn: test.sinon.stub(),
        //   json: { info: test.sinon.stub() },
        // }),
      },
    };
  });

  afterEach('it restores sinon', () => {
    test.sinon.restore();
    mockOpts = null;
  });

  context('constructor', () => {
    it('tests constructor', () => {
      const stubTrace = test.sinon.stub();
      mockOpts.logger.createLogger.returns({ $$TRACE: stubTrace });
      new CacheService(mockOpts);

      test.chai.expect(mockOpts.logger.createLogger).to.have.been.calledWithExactly('Cache');
      test.chai.expect(stubTrace).to.have.been.calledWithExactly('construct(%j)', {
        logger: {
          createLogger: test.sinon.match.func,
        },
      });
    });
  });

  context('initialize', () => {
    it('test initialize - config becomes an empty object when it checks if it is a type of function and then callback is called.', () => {
      const stubTrace = test.sinon.stub();
      mockOpts.logger.createLogger.returns({ $$TRACE: stubTrace });

      const mockConfig = test.sinon.stub();
      const stubCallback = test.sinon.stub();
      const cacheService = new CacheService(mockOpts);
      cacheService.initialize(mockConfig, stubCallback);

      test.chai.expect(mockConfig).to.have.callCount(1);
    });

    it('test initialize - this.log.warn is called if this.#config.statisticsInterval is a number and is less then 1000.', () => {
      const stubTrace = test.sinon.stub();
      const stubWarn = test.sinon.stub();

      mockOpts.logger.createLogger.returns({ $$TRACE: stubTrace, warn: stubWarn });

      const mockConfig = { statisticsInterval: 1e2 };
      const stubCallback = test.sinon.stub();
      const cacheService = new CacheService(mockOpts);
      cacheService.initialize(mockConfig, stubCallback);

      test.chai
        .expect(stubWarn)
        .to.have.been.calledWithExactly(`statisticsInterval smaller than a second, ignoring`);
      test.chai.expect(stubCallback).to.have.callCount(1);
    });

    it('test initilize - calls this.#startLoggingStatistics if this.#config.statisticsInterval is greater or equal to 1000.It creates new StaticCache and logs it every setInterval.', async () => {
      const stubTrace = test.sinon.stub();
      const stubWarn = test.sinon.stub();
      const stubInfo = test.sinon.stub();
      mockOpts.logger.createLogger.returns({
        $$TRACE: stubTrace,
        warn: stubWarn,
        json: { info: stubInfo },
      });
      const spyStaticCache = test.sinon.spy(StaticCache);
      const mockConfig = { statisticsInterval: 1000, overrides: null };
      const stubCallback = test.sinon.stub();
      const cacheService = new CacheService(mockOpts);
      const stubNow = test.sinon.stub(Date, 'now').returns(1000);
      const mockName = 'mockName';
      const mockCreateOpts = { type: 'static' };

      cacheService.happn = { name: 'mockName', services: { utils: {} } };

      cacheService.initialize(mockConfig, stubCallback);
      cacheService.create(mockName, mockCreateOpts);
      await require('timers/promises').setTimeout(1001);
      cacheService.stop(null, test.sinon.stub());

      test.chai.expect(spyStaticCache).to.have.been.calledWithExactly('mockName', {});
      test.chai.expect(stubCallback).to.have.callCount(1);
      test.chai.expect(stubInfo).to.have.been.calledWithExactly(
        {
          mockName: {
            hits: 0,
            misses: 0,
            size: 0,
            type: 'static',
            hitsPerSec: 0,
            missesPerSec: 0,
          },
          timestamp: 1000,
          name: 'mockName',
        },
        'cache-service-statistics'
      );

      stubNow.restore();
    });

    it('test initilize - calls this.#startLoggingStatistics if this.#config.statisticsInterval is greater or equal to 1000.Then this.log.warn is called if this.log.json.info throws error. ', async () => {
      const stubTrace = test.sinon.stub();
      const stubWarn = test.sinon.stub();
      const stubInfo = test.sinon.stub().throws(new Error('mockError'));
      mockOpts.logger.createLogger.returns({
        $$TRACE: stubTrace,
        warn: stubWarn,
        json: { info: stubInfo },
      });

      const mockConfig = { statisticsInterval: 1000, overrides: null };
      const stubCallback = test.sinon.stub();
      const cacheService = new CacheService(mockOpts);
      const stubNow = test.sinon.stub(Date, 'now').returns(1000);
      const mockName = 'mockName';
      const mockCreateOpts = { type: 'static' };

      cacheService.happn = { name: 'mockName', services: { utils: {} } };

      cacheService.initialize(mockConfig, stubCallback);
      cacheService.create(mockName, mockCreateOpts);
      await require('timers/promises').setTimeout(1001);
      cacheService.stop(null, test.sinon.stub());

      test.chai.expect(stubCallback).to.have.callCount(1);
      test.chai
        .expect(stubWarn)
        .to.have.been.calledWithExactly(`failure logging statistics: mockError`);

      stubNow.restore();
    });

    it('test create - calls this.#startLoggingStatistics if this.#config.statisticsInterval is greater and equal to 1000.It creates new LRUCache and logs it every setInterval.', async () => {
      const stubTrace = test.sinon.stub();
      const stubWarn = test.sinon.stub();
      const stubInfo = test.sinon.stub();
      mockOpts.logger.createLogger.returns({
        $$TRACE: stubTrace,
        warn: stubWarn,
        json: { info: stubInfo },
      });

      const mockConfig = { statisticsInterval: 1000, overrides: null };
      const stubCallback = test.sinon.stub();
      const cacheService = new CacheService(mockOpts);
      const stubNow = test.sinon.stub(Date, 'now').returns(1000);
      const mockName = 'mockName';
      const mockCreateOpts = { type: 'lru' };

      cacheService.happn = { name: 'mockName', services: { utils: {} } };

      cacheService.initialize(mockConfig, stubCallback);
      cacheService.create(mockName, mockCreateOpts);
      await require('timers/promises').setTimeout(1001);
      cacheService.stop(null, test.sinon.stub());

      test.chai.expect(stubCallback).to.have.callCount(1);
      test.chai.expect(stubInfo).to.have.been.calledWithExactly(
        {
          mockName: {
            hits: 0,
            misses: 0,
            size: 0,
            type: 'lru',
            hitsPerSec: 0,
            missesPerSec: 0,
          },
          timestamp: 1000,
          name: 'mockName',
        },
        'cache-service-statistics'
      );

      stubNow.restore();
    });

    it('test create - calls this.#startLoggingStatistics if this.#config.statisticsInterval is greater and equal to 1000.It creates new PersistedCache and logs it every setInterval.', async () => {
      const stubTrace = test.sinon.stub();
      const stubWarn = test.sinon.stub();
      const stubInfo = test.sinon.stub();
      mockOpts.logger.createLogger.returns({
        $$TRACE: stubTrace,
        warn: stubWarn,
        json: { info: stubInfo },
      });

      const mockConfig = { statisticsInterval: 1000, overrides: { mockName: { dataStore: {} } } };
      const stubCallback = test.sinon.stub();
      const cacheService = new CacheService(mockOpts);
      const stubNow = test.sinon.stub(Date, 'now').returns(1000);
      const mockName = 'mockName';
      const mockCreateOpts = { type: 'persist', cache: {} };

      cacheService.happn = { name: 'mockName', services: { utils: {} } };

      cacheService.initialize(mockConfig, stubCallback);
      cacheService.create(mockName, mockCreateOpts);
      await require('timers/promises').setTimeout(1001);
      cacheService.stop(null, test.sinon.stub());

      test.chai.expect(stubCallback).to.have.callCount(1);
      test.chai.expect(stubInfo).to.have.been.calledWithExactly(
        {
          mockName: {
            hits: 0,
            misses: 0,
            size: 0,
            type: 'persist',
            hitsPerSec: 0,
            missesPerSec: 0,
          },
          timestamp: 1000,
          name: 'mockName',
        },
        'cache-service-statistics'
      );

      stubNow.restore();
    });
  });
});