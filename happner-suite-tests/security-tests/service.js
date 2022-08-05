it('tests initialize - sets config.disableDefaultAdminNetworkConnections equal to true', async () => {
  const mockCallback = test.sinon.stub();
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = {};

  serviceInst.happn = {
    config: {
      disableDefaultAdminNetworkConnections: true,
    },
  };

  serviceInst.initialize(mockConfig, mockCallback);

  test.chai.expect(mockConfig.disableDefaultAdminNetworkConnections).to.be.true;
});

it('tests initialize - sets config.defaultNonceTTL and config.sessionActivityTTL to equal 60000', async () => {
  const milliSeconds = test.sinon.stub().returns(60000);
  const mockCallback = test.sinon.stub();
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = {
    defaultNonceTTL: 500,
    sessionActivityTTL: 500,
    updateSubscriptionsOnSecurityDirectoryChanged: true,
    logSessionActivity: true,
    lockTokenToLoginType: true,
  };

  serviceInst.happn = {
    config: {
      disableDefaultAdminNetworkConnections: true,
    },
    services: {
      data: 'mockData',
      cache: 'mockCache',
      crypto: 'mockCrypto',
      session: 'mockSession',
      utils: { toMilliseconds: milliSeconds },
      error: 'mockError',
    },
    dataService: { pathField: 'mockPathField' },
  };

  serviceInst.initialize(mockConfig, mockCallback);

  test.chai.expect(mockConfig.defaultNonceTTL).to.equal(60000);
  test.chai.expect(mockConfig.sessionActivityTTL).to.equal(60000);
});

it('tests doAuditData - auditData != null', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: 'mockPath', action: 'mockAction' },
    response: 'mockResponse',
    session: {
      type: 'mockType',
      user: { username: 'mockUsername' },
      protocol: 'mockProtocol',
    },
  };

  serviceInst.happn = {
    services: {
      utils: {
        replacePrefix: test.sinon.stub().returns('mock'),
        replaceSuffix: test.sinon.stub().returns('mock'),
      },
    },
  };
  serviceInst.config = { audit: {} };
  serviceInst.dataService = { upsert: test.sinon.stub() };
  serviceInst.dataService.upsert.callsFake((_, __, ___, callback) => {
    callback();
  });

  serviceInst.doAudit(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, mockMessage);
});

it('tests doAuditData - auditData != null, callback have error', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: 'mockPath', action: 'mockAction' },
    response: 'mockResponse',
    session: {
      type: 'mockType',
      user: { username: 'mockUsername' },
      protocol: 'mockProtocol',
    },
  };

  serviceInst.happn = {
    services: {
      utils: {
        replacePrefix: test.sinon.stub().returns('mock'),
        replaceSuffix: test.sinon.stub().returns('mock'),
      },
      error: { SystemError: test.sinon.stub().returns('tests error') },
    },
  };
  serviceInst.config = { audit: {} };
  serviceInst.dataService = { upsert: test.sinon.stub() };
  serviceInst.dataService.upsert.callsFake((_, __, ___, callback) => {
    callback('mock error');
  });

  serviceInst.doAudit(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly('tests error');
});

it('tests doAuditData - auditData == null', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: 'mockPath', action: 'mockAction' },
  };

  serviceInst.config = { audit: { paths: 'mockPaths' } };
  serviceInst.happn = {
    services: {
      utils: {
        wildcardMatchMultiple: test.sinon.stub().returns(false),
      },
    },
  };
  serviceInst.dataService = { upsert: test.sinon.stub() };

  serviceInst.doAudit(mockMessage, mockCallback);
  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, mockMessage);
});

it('tests getAuditData - message.response is an Array', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { path: 'mockPath', action: 'get' },
    response: [],
    session: {
      type: 'mockType',
      user: { username: 'mockUsername' },
      protocol: 'mockProtocol',
    },
  };

  serviceInst.config = { audit: {} };

  const result = serviceInst.getAuditData(mockMessage);

  test.chai.expect(result).to.eql({
    response: 0,
    session: {
      type: 'mockType',
      username: 'mockUsername',
      protocol: 'mockProtocol',
    },
  });
});

it('tests getAuditData - message.response is not an Array', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { path: 'mockPath', action: 'get' },
    response: 'mockResponse',
    session: {
      type: 'mockType',
      user: { username: 'mockUsername' },
      protocol: 'mockProtocol',
    },
  };

  serviceInst.config = { audit: {} };

  const result = serviceInst.getAuditData(mockMessage);

  test.chai.expect(result).to.eql({
    response: 1,
    session: {
      type: 'mockType',
      username: 'mockUsername',
      protocol: 'mockProtocol',
    },
  });
});

it('tests getAuditData -should replace path with empty string', () => {
  const paths = ['/ALL@', '/SET@', '/REMOVE@'];

  paths.forEach((path) => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = {
      request: { path: path + '/mockPath', action: 'mockAction' },
      response: 'mockResponse',
    };

    serviceInst.config = { audit: { paths: 'mockPaths' } };
    serviceInst.happn = {
      services: {
        utils: {
          wildcardMatchMultiple: test.sinon.stub().returns(false),
        },
      },
    };

    const result = serviceInst.getAuditData(mockMessage);
    test.chai.expect(result).to.be.null;
  });
});

it('tests getAuditData - message.request.path does not exists', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { action: 'mockAction' },
    response: 'mockResponse',
  };

  serviceInst.config = { audit: { paths: 'mockPaths' } };
  serviceInst.happn = {
    services: {
      utils: {
        wildcardMatchMultiple: test.sinon.stub().returns(false),
      },
    },
  };

  const result = serviceInst.getAuditData(mockMessage);
  test.chai.expect(result).to.be.null;
});

it('tests getAuditPath - request.path does not exist', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { action: 'mockAction' },
  };

  const result = serviceInst.getAuditPath(mockMessage);

  test.chai.expect(result).to.equal('/_AUDIT/mockAction');
});

it('tests getAuditPath - request.path does exist', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { path: '@mockPath', action: 'mockAction' },
  };

  serviceInst.happn = {
    services: {
      utils: {
        replacePrefix: test.sinon.stub().returns('mock'),
        replaceSuffix: test.sinon.stub().returns('mock'),
      },
    },
  };

  const result = serviceInst.getAuditPath(mockMessage);

  test.chai.expect(result).to.equal('/_AUDIT/mock/mockAction');
});

it('tests processUnsecureLogin - it returns callback', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    session: { id: 1 },
    info: 'mockInfo',
    request: { data: { info: 'mockInfo' } },
    response: {},
  };
  const mockCallback = test.sinon.stub().returns('test callback');

  serviceInst.happn = {
    services: {
      session: {
        attachSession: test.sinon.stub().returns('mock'),
      },
    },
  };

  const result = serviceInst.processUnsecureLogin(mockMessage, mockCallback);

  test.chai.expect(result).to.equal('test callback');
  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, mockMessage);
});

it('tests processLogin - checks if authProviders.happn exists', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { data: { token: {}, username: '_ADMIN' } },
  };
  const mockCallback = test.sinon.stub();

  serviceInst.authProviders = {
    happn: { login: test.sinon.stub() },
    default: 'mockDefault',
  };
  serviceInst.authProviders.happn.login.callsFake((_, __, ___, callback) => {
    callback('mockError', null);
  });

  serviceInst.processLogin(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
});

it('tests login with no args', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });

  serviceInst.authProviders = { default: { login: test.sinon.stub().returns('tests') } };

  const result = serviceInst.login();

  test.chai.expect(result).to.equal('tests');
});

it('tests login with args', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });

  serviceInst.authProviders = { mockAuthType: { login: test.sinon.stub().returns('tests') } };

  const result = serviceInst.login({ authType: 'mockAuthType' });

  test.chai.expect(result).to.equal('tests');
});

it('tests processAuthorizeUnsecure', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub().returns('tests');

  const result = serviceInst.processAuthorizeUnsecure('mockMessage', mockCallback);

  test.chai.expect(result).to.equal('tests');
  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'mockMessage');
});

it('tests processAuthorize - return this.authorizeOnBehalfOf, calls callback with error', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: 'mockPath', action: 'get', options: { onBehalfOf: 'mock' } },
  };

  serviceInst.authorizeOnBehalfOf = test.sinon
    .stub()
    .callsFake((_, __, ___, ____, callback) => {
      callback('mockError', null, null, null);
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
});

it('tests processAuthorize - return this.authorizeOnBehalfOf, authorized and reason is null and returns callback', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: 'mockPath', action: 'get', options: { onBehalfOf: 'mock' } },
  };

  serviceInst.happn = {
    services: { error: { AccessDeniedError: test.sinon.stub().returns('test') } },
  };

  serviceInst.authorizeOnBehalfOf = test.sinon
    .stub()
    .callsFake((_, __, ___, ____, callback) => {
      callback(null, null, null, null);
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly('test');
});

it('tests processAuthorize - return this.authorizeOnBehalfOf, authorized is not null', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: 'mockPath', action: 'get', options: { onBehalfOf: 'mock' } },
  };

  serviceInst.authorizeOnBehalfOf = test.sinon
    .stub()
    .callsFake((_, __, ___, ____, callback) => {
      callback(null, 'mockAuthorised', null, 'mockOnBehalfOfSession');
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, mockMessage);
});

it('tests processAuthorize - return this.authorizeOnBehalfOf, reason is not null', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: 'mockPath', action: 'get', options: { onBehalfOf: 'mock' } },
  };

  serviceInst.happn = {
    services: { error: { AccessDeniedError: test.sinon.stub().returns('test') } },
  };

  serviceInst.authorizeOnBehalfOf = test.sinon
    .stub()
    .callsFake((_, __, ___, ____, callback) => {
      callback(null, null, 'mockReason', null);
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly('test');
});

it('tests processAuthorize - return this.authorize, calls calback with error', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: 'mockPath', action: 'get', options: { onBehalfOf: '_ADMIN' } },
  };

  serviceInst.happn = {
    services: { error: { AccessDeniedError: test.sinon.stub().returns('test') } },
  };

  serviceInst.authorize = test.sinon.stub().callsFake((_, __, ___, callback) => {
    callback('mockError', null, null);
  });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockError');
});

it('tests processAuthorize - return this.authorize, authorized is null', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: 'mockPath', action: 'get', options: { onBehalfOf: '_ADMIN' } },
  };

  serviceInst.happn = {
    services: { error: { AccessDeniedError: test.sinon.stub().returns('test') } },
  };

  serviceInst.authorize = test.sinon.stub().callsFake((_, __, ___, callback) => {
    callback(null, null, null);
  });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly('test');
});

it('tests processAuthorize - return this.authorize, authorized is not null', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: 'mockPath', action: 'get', options: { onBehalfOf: '_ADMIN' } },
  };

  serviceInst.happn = {
    services: { error: { AccessDeniedError: test.sinon.stub().returns('test') } },
  };

  serviceInst.authorize = test.sinon.stub().callsFake((_, __, ___, callback) => {
    callback(null, 'mockAuthorized', 'mockReason');
  });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, mockMessage);
});

it('tests processNonceRequest - throws error if there is no request.publicKey', () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    response: {},
    request: { data: 'mockData' },
  };

  serviceInst.processNonceRequest(mockMessage, mockCallback);

  test.chai
    .expect(mockCallback.lastCall.args[0].message)
    .to.equal('no public key with request');
});