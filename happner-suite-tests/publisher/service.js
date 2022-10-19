const test = require('../../__fixtures/utils/test_helper').create();
const PublisherService = require('../../../lib/services/publisher/service');
const CONSTANTS = require('../../../lib/constants');
describe.only(test.testName(__filename, 3), function () {
  let mockOpts;
  let mockPublication;
  let mockHappn;
  beforeEach(() => {
    mockOpts = {
      logger: { createLogger: test.sinon.stub().returns({ $$TRACE: test.sinon.stub() }) },
    };
    mockPublication = { create: test.sinon.stub() };
    mockHappn = {
      services: {
        error: {},
        dataService: {},
        security: {},
        protocol: { processMessageOut: test.sinon.stub() },
      },
    };
  });

  afterEach(() => {
    mockOpts = null;
    mockPublication = null;
  });

  it('create PublisherService instance', () => {
    mockPublication = null;
    const publisherService = new PublisherService(mockOpts, mockPublication);

    test.chai.expect(mockOpts.logger.createLogger).to.have.been.calledWithExactly('Publisher');
    test.chai.expect(publisherService.log.$$TRACE).to.have.been.calledWithExactly('construct(%j)', {
      logger: { createLogger: test.sinon.match.func },
    });
    test.chai.expect(publisherService.publication.name).to.equal('Publication');
  });

  it('tests stats - returns JSON.parse', () => {
    const mockCallback = test.sinon.stub();
    const mockConfig = {};
    const publisherService = new PublisherService(mockOpts, mockPublication);

    publisherService.happn = mockHappn;
    publisherService.initialize(mockConfig, mockCallback);

    const result = publisherService.stats();

    test.chai.expect(result).to.eql({ attempted: 0, failed: 0, unacknowledged: 0 });
  });

  it('tests processAcknowledge - calls this.__recipientAcknowledge with message and callback function. Callback is called with error. .', () => {
    const stubPublish = test.sinon.stub();
    const stubAcknowledge = test.sinon.stub();

    mockPublication.create.returns({
      id: 'mockData',
      options: { consistency: CONSTANTS.CONSISTENCY.ACKNOWLEDGED },
      publish: stubPublish,
      resultsMessage: test.sinon.stub().returns('result'),
      acknowledge: stubAcknowledge,
    }),
      mockHappn.services.protocol.processMessageOut.callsFake((_, cb) => {
        cb(null);
      });
    mockHappn.services.error.handleSystem = test.sinon.stub();

    const mockCallbackOne = test.sinon.stub();
    const mockConfig = null;
    const publisherService = new PublisherService(mockOpts, mockPublication);
    const mockMessage = {};
    const mockCallbackTwo = test.sinon.stub();
    const mockMessageTwo = { request: { data: 'mockData', sessionId: 1 } };
    const mockCallbackThree = test.sinon.stub();

    publisherService.happn = mockHappn;

    publisherService.initialize(mockConfig, mockCallbackOne);
    publisherService.processPublish(mockMessage, mockCallbackTwo);
    publisherService.processAcknowledge(mockMessageTwo, mockCallbackThree);
    stubPublish.getCall(0).callArgWith(0, new Error('mockError'));

    test.chai
      .expect(mockCallbackThree)
      .to.have.been.calledWithExactly(null, { request: { data: 'mockData', sessionId: 1 } });
    test.chai.expect(stubAcknowledge).to.have.been.calledWithExactly(1);
  });

  it('tests processAcknowledge - calls this.__recipientAcknowledge with message and callback function. Callback is called with error. .', () => {
    const stubPublish = test.sinon.stub();
    const stubAcknowledge = test.sinon.stub();

    mockPublication.create.returns({
      id: 'mockData',
      options: { consistency: CONSTANTS.CONSISTENCY.ACKNOWLEDGED },
      publish: stubPublish,
      resultsMessage: test.sinon.stub().returns('result'),
      acknowledge: stubAcknowledge,
    }),
      mockHappn.services.protocol.processMessageOut.callsFake((_, cb) => {
        cb(null);
      });
    mockHappn.services.error.handleSystem = test.sinon.stub();

    const mockCallbackOne = test.sinon.stub();
    const mockConfig = null;
    const publisherService = new PublisherService(mockOpts, mockPublication);
    const mockMessage = {};
    const mockCallbackTwo = test.sinon.stub();
    const mockMessageTwo = { request: { data: null, sessionId: 1 } };
    const mockCallbackThree = test.sinon.stub();

    publisherService.happn = mockHappn;

    publisherService.initialize(mockConfig, mockCallbackOne);
    publisherService.processPublish(mockMessage, mockCallbackTwo);
    publisherService.processAcknowledge(mockMessageTwo, mockCallbackThree);
    stubPublish.getCall(0).callArgWith(0, new Error('mockError'));

    test.chai
      .expect(mockCallbackThree)
      .to.have.been.calledWithExactly(null, { request: { data: null, sessionId: 1 } });
  });

  it('tests initialize - config exists and callback is called.', () => {
    const mockCallback = test.sinon.stub();
    const mockConfig = { publicationOptions: { acknowledgeTimeout: 6000 }, timeout: true };
    const publisherService = new PublisherService(mockOpts, mockPublication);

    publisherService.happn = mockHappn;
    publisherService.initialize(mockConfig, mockCallback);

    test.chai
      .expect(publisherService.config)
      .to.eql({ publicationOptions: { acknowledgeTimeout: 6000 }, timeout: false });
    test.chai.expect(mockCallback).to.have.callCount(1);
  });

  it('tests initialize - config does not exists and callback is called.', () => {
    const mockCallback = test.sinon.stub();
    const mockConfig = null;
    const publisherService = new PublisherService(mockOpts, mockPublication);

    publisherService.happn = mockHappn;
    publisherService.initialize(mockConfig, mockCallback);

    test.chai
      .expect(publisherService.config)
      .to.eql({ publicationOptions: { acknowledgeTimeout: 60000 } });
    test.chai.expect(mockCallback).to.have.callCount(1);
  });

  it('tests initialize - config is null and happn services dependency throws error.', () => {
    const mockCallback = test.sinon.stub();
    const mockConfig = null;
    const publisherService = new PublisherService(mockOpts, mockPublication);

    publisherService.initialize(mockConfig, mockCallback);
    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
  });

  it('tests processPublish - callback is called if publication.options.consistency is strictly equal to CONSTANTS.CONSISTENCY.ACKNOWLEDGED . publish , processMessageOut, handleSystem was called .', () => {
    const stubPublish = test.sinon.stub();
    mockPublication.create.returns({
      id: 1,
      options: { consistency: CONSTANTS.CONSISTENCY.ACKNOWLEDGED },
      publish: stubPublish.callsFake((cb) => {
        cb(new Error('mockError'));
      }),
      resultsMessage: test.sinon.stub().returns('result'),
    }),
      mockHappn.services.protocol.processMessageOut.callsFake((_, cb) => {
        cb(new Error('mockError'));
      });
    mockHappn.services.error.handleSystem = test.sinon.stub();

    const mockCallbackOne = test.sinon.stub();
    const mockConfig = null;
    const publisherService = new PublisherService(mockOpts, mockPublication);
    const mockMessage = {};
    const mockCallbackTwo = test.sinon.stub();

    publisherService.happn = mockHappn;

    publisherService.initialize(mockConfig, mockCallbackOne);
    publisherService.processPublish(mockMessage, mockCallbackTwo);

    test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
      publication: {
        id: 1,
      },
    });
    test.chai.expect(stubPublish).to.have.been.calledWithExactly(test.sinon.match.func);
    test.chai
      .expect(mockHappn.services.protocol.processMessageOut)
      .to.have.been.calledWithExactly('result', test.sinon.match.func);
    test.chai
      .expect(mockHappn.services.error.handleSystem)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error),
        'PublisherService',
        CONSTANTS.ERROR_SEVERITY.MEDIUM
      );
  });

  it('tests processPublish - publication.options.consistency is not strictly equal to CONSTANTS.CONSISTENCY.TRANSACTIONAL', () => {
    const stubPublish = test.sinon.stub();
    mockPublication.create.returns({
      id: 1,
      options: { consistency: CONSTANTS.CONSISTENCY.DEFERRED },
      publish: stubPublish.callsFake((cb) => {
        cb(null);
      }),
      resultsMessage: test.sinon.stub().returns('result'),
    }),
      mockHappn.services.protocol.processMessageOut.callsFake((_, cb) => {
        cb(null);
      });
    mockHappn.services.error.handleSystem = test.sinon.stub();

    const mockCallbackOne = test.sinon.stub();
    const mockConfig = null;
    const publisherService = new PublisherService(mockOpts, mockPublication);
    const mockMessage = {};
    const mockCallbackTwo = test.sinon.stub();

    publisherService.happn = mockHappn;

    publisherService.initialize(mockConfig, mockCallbackOne);
    publisherService.processPublish(mockMessage, mockCallbackTwo);

    test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
      publication: {
        id: 1,
      },
    });
    test.chai.expect(stubPublish).to.have.been.calledWithExactly(test.sinon.match.func);
    test.chai
      .expect(mockHappn.services.protocol.processMessageOut)
      .to.have.been.calledWithExactly('result', test.sinon.match.func);
  });

  it('tests processPublish - callback is called with error if publication.options.consistency is strictly equal to CONSTANTS.CONSISTENCY.TRANSACTIONAL.', () => {
    const stubPublish = test.sinon.stub();
    mockPublication.create.returns({
      id: 1,
      options: { consistency: CONSTANTS.CONSISTENCY.TRANSACTIONAL },
      publish: stubPublish.callsFake((cb) => {
        cb(new Error('mockError'));
      }),
      resultsMessage: test.sinon.stub().returns('result'),
    }),
      (mockHappn.services.error.handleSystem = test.sinon.stub());

    const mockCallbackOne = test.sinon.stub();
    const mockConfig = null;
    const publisherService = new PublisherService(mockOpts, mockPublication);
    const mockMessage = {};
    const mockCallbackTwo = test.sinon.stub();

    publisherService.happn = mockHappn;

    publisherService.initialize(mockConfig, mockCallbackOne);
    publisherService.processPublish(mockMessage, mockCallbackTwo);

    test.chai
      .expect(mockCallbackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    test.chai.expect(stubPublish).to.have.been.calledWithExactly(test.sinon.match.func);
  });

  it('tests processPublish - callback is called with error if publication.options.consistency is strictly equal to CONSTANTS.CONSISTENCY.TRANSACTIONAL.', () => {
    const stubPublish = test.sinon.stub();
    mockPublication.create.returns({
      id: 1,
      options: { consistency: CONSTANTS.CONSISTENCY.TRANSACTIONAL },
      publish: stubPublish.callsFake((cb) => {
        cb(null);
      }),
      resultsMessage: test.sinon.stub().returns('result'),
    }),
      mockHappn.services.protocol.processMessageOut.callsFake((_, cb) => {
        cb(new Error('mockError'));
      });
    mockHappn.services.error.handleSystem = test.sinon.stub();

    const mockCallbackOne = test.sinon.stub();
    const mockConfig = null;
    const publisherService = new PublisherService(mockOpts, mockPublication);
    const mockMessage = {};
    const mockCallbackTwo = test.sinon.stub();

    publisherService.happn = mockHappn;

    publisherService.initialize(mockConfig, mockCallbackOne);
    publisherService.processPublish(mockMessage, mockCallbackTwo);

    test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
      publication: {
        id: 1,
      },
    });
    test.chai.expect(stubPublish).to.have.been.calledWithExactly(test.sinon.match.func);
  });
});
