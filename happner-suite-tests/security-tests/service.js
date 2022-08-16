const SecurityService = require("../../../lib/services/security/service");

// new tests
it("tests initialize - sets config.disableDefaultAdminNetworkConnections equal to true", async () => {
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

it("tests initialize - sets config.defaultNonceTTL and config.sessionActivityTTL to equal 60000", async () => {
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
      data: "mockData",
      cache: "mockCache",
      crypto: "mockCrypto",
      session: "mockSession",
      utils: { toMilliseconds: milliSeconds },
      error: "mockError",
    },
    dataService: { pathField: "mockPathField" },
  };

  serviceInst.initialize(mockConfig, mockCallback);

  test.chai.expect(mockConfig.defaultNonceTTL).to.equal(60000);
  test.chai.expect(mockConfig.sessionActivityTTL).to.equal(60000);
});

it("tests doAuditData - auditData != null", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: "mockPath", action: "mockAction" },
    response: "mockResponse",
    session: {
      type: "mockType",
      user: { username: "mockUsername" },
      protocol: "mockProtocol",
    },
  };

  serviceInst.happn = {
    services: {
      utils: {
        replacePrefix: test.sinon.stub().returns("mock"),
        replaceSuffix: test.sinon.stub().returns("mock"),
      },
    },
  };
  serviceInst.config = { audit: {} };
  serviceInst.dataService = { upsert: test.sinon.stub() };
  serviceInst.dataService.upsert.callsFake((_, __, ___, callback) => {
    callback();
  });

  serviceInst.doAudit(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
    request: { path: "mockPath", action: "mockAction" },
    response: "mockResponse",
    session: {
      type: "mockType",
      user: { username: "mockUsername" },
      protocol: "mockProtocol",
    },
  });
});

it("tests doAuditData - auditData != null, callback have error", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: "mockPath", action: "mockAction" },
    response: "mockResponse",
    session: {
      type: "mockType",
      user: { username: "mockUsername" },
      protocol: "mockProtocol",
    },
  };

  serviceInst.happn = {
    services: {
      utils: {
        replacePrefix: test.sinon.stub().returns("mock"),
        replaceSuffix: test.sinon.stub().returns("mock"),
      },
      error: { SystemError: test.sinon.stub().returns("tests error") },
    },
  };
  serviceInst.config = { audit: {} };
  serviceInst.dataService = { upsert: test.sinon.stub() };
  serviceInst.dataService.upsert.callsFake((_, __, ___, callback) => {
    callback("mock error");
  });

  serviceInst.doAudit(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly("tests error");
});

it("tests doAuditData - auditData == null", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: { path: "mockPath", action: "mockAction" },
  };

  serviceInst.config = { audit: { paths: "mockPaths" } };
  serviceInst.happn = {
    services: {
      utils: {
        wildcardMatchMultiple: test.sinon.stub().returns(false),
      },
    },
  };
  serviceInst.dataService = { upsert: test.sinon.stub() };

  serviceInst.doAudit(mockMessage, mockCallback);
  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
    request: { path: "mockPath", action: "mockAction" },
  });
});

it("tests getAuditData - message.response is an Array", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { path: "mockPath", action: "get" },
    response: [],
    session: {
      type: "mockType",
      user: { username: "mockUsername" },
      protocol: "mockProtocol",
    },
  };

  serviceInst.config = { audit: {} };

  const result = serviceInst.getAuditData(mockMessage);

  test.chai.expect(result).to.eql({
    response: 0,
    session: {
      type: "mockType",
      username: "mockUsername",
      protocol: "mockProtocol",
    },
  });
});

it("tests getAuditData - message.response is not an Array", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { path: "mockPath", action: "get" },
    response: "mockResponse",
    session: {
      type: "mockType",
      user: { username: "mockUsername" },
      protocol: "mockProtocol",
    },
  };

  serviceInst.config = { audit: {} };

  const result = serviceInst.getAuditData(mockMessage);

  test.chai.expect(result).to.eql({
    response: 1,
    session: {
      type: "mockType",
      username: "mockUsername",
      protocol: "mockProtocol",
    },
  });
});

it("tests getAuditData -should replace path with empty string", () => {
  const paths = ["/ALL@", "/SET@", "/REMOVE@"];

  paths.forEach((path) => {
    const serviceInst = new SecurityService({
      logger: Logger,
    });
    const mockMessage = {
      request: { path: path + "/mockPath", action: "mockAction" },
      response: "mockResponse",
    };

    serviceInst.config = { audit: { paths: "mockPaths" } };
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

it("tests getAuditData - message.request.path does not exists", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { action: "mockAction" },
    response: "mockResponse",
  };

  serviceInst.config = { audit: { paths: "mockPaths" } };
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

it("tests getAuditPath - request.path does not exist", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { action: "mockAction" },
  };

  const result = serviceInst.getAuditPath(mockMessage);

  test.chai.expect(result).to.equal("/_AUDIT/mockAction");
});

it("tests getAuditPath - request.path does exist", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { path: "@mockPath", action: "mockAction" },
  };

  serviceInst.happn = {
    services: {
      utils: {
        replacePrefix: test.sinon.stub().returns("mock"),
        replaceSuffix: test.sinon.stub().returns("mock"),
      },
    },
  };

  const result = serviceInst.getAuditPath(mockMessage);

  test.chai.expect(result).to.equal("/_AUDIT/mock/mockAction");
});

it("tests processUnsecureLogin - it returns callback", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    session: { id: 1 },
    info: "mockInfo",
    request: { data: { info: "mockInfo" } },
  };
  const mockCallback = test.sinon.stub().returns("test callback");

  serviceInst.happn = {
    services: {
      session: {
        attachSession: test.sinon.stub().returns("mock"),
      },
    },
  };

  const result = serviceInst.processUnsecureLogin(mockMessage, mockCallback);

  test.chai.expect(result).to.equal("test callback");
  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
    session: { id: 1 },
    info: "mockInfo",
    request: { data: { info: "mockInfo" } },
    response: { data: "mock" },
  });
});

it("tests processLogin - checks if authProviders.happn exists", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockMessage = {
    request: { data: { token: {}, username: "_ADMIN" } },
  };
  const mockCallback = test.sinon.stub();

  serviceInst.authProviders = {
    happn: { login: test.sinon.stub() },
    default: "mockDefault",
  };
  serviceInst.authProviders.happn.login.callsFake((_, __, ___, callback) => {
    callback("mockError", null);
  });

  serviceInst.processLogin(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly("mockError");
});

it("tests login with no args", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });

  serviceInst.authProviders = {
    default: { login: test.sinon.stub().returns("tests") },
  };

  const result = serviceInst.login();

  test.chai.expect(result).to.equal("tests");
});

it("tests login with args", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });

  serviceInst.authProviders = {
    mockAuthType: { login: test.sinon.stub().returns("tests") },
  };

  const result = serviceInst.login({ authType: "mockAuthType" });

  test.chai.expect(result).to.equal("tests");
});

it("tests processAuthorizeUnsecure", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub().returns("tests");

  const result = serviceInst.processAuthorizeUnsecure(
    "mockMessage",
    mockCallback
  );

  test.chai.expect(result).to.equal("tests");
  test.chai
    .expect(mockCallback)
    .to.have.been.calledWithExactly(null, "mockMessage");
});

it("tests processAuthorize - return this.authorizeOnBehalfOf, calls callback with error", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath",
      action: "get",
      options: { onBehalfOf: "mock" },
    },
  };

  serviceInst.authorizeOnBehalfOf = test.sinon
    .stub()
    .callsFake((_, __, ___, ____, callback) => {
      callback("mockError", null, null, null);
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly("mockError");
});

it("tests processAuthorize - return this.authorizeOnBehalfOf, authorized and reason is null and returns callback", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath",
      action: "get",
      options: { onBehalfOf: "mock" },
    },
  };

  serviceInst.happn = {
    services: {
      error: { AccessDeniedError: test.sinon.stub().returns("test") },
    },
  };

  serviceInst.authorizeOnBehalfOf = test.sinon
    .stub()
    .callsFake((_, __, ___, ____, callback) => {
      callback(null, null, null, null);
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly("test");
});

it("tests processAuthorize - return this.authorizeOnBehalfOf, authorized is not null", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath",
      action: "get",
      options: { onBehalfOf: "mock" },
    },
  };

  serviceInst.authorizeOnBehalfOf = test.sinon
    .stub()
    .callsFake((_, __, ___, ____, callback) => {
      callback(null, "mockAuthorised", null, "mockOnBehalfOfSession");
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
    request: {
      path: "mockPath",
      action: "get",
      options: { onBehalfOf: "mock" },
    },
    session: "mockOnBehalfOfSession",
  });
});

it("tests processAuthorize - return this.authorizeOnBehalfOf, authorized and reason is not null", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath",
      action: "get",
      options: { onBehalfOf: "mock" },
    },
  };

  serviceInst.happn = {
    services: {
      error: { AccessDeniedError: test.sinon.stub().returns("test") },
    },
  };

  serviceInst.authorizeOnBehalfOf = test.sinon
    .stub()
    .callsFake((_, __, ___, ____, callback) => {
      callback(null, null, "mockReason", null);
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);
  test.chai.expect(mockCallback).to.have.been.calledWithExactly("test");
  test.chai
    .expect(serviceInst.happn.services.error.AccessDeniedError)
    .to.have.been.calledWithExactly(
      "unauthorized",
      "mockReason request on behalf of: mock"
    );
});

it("tests processAuthorize - return this.authorize, calls calback with error", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath",
      action: "get",
      options: { onBehalfOf: "_ADMIN" },
    },
  };

  serviceInst.happn = {
    services: {
      error: { AccessDeniedError: test.sinon.stub().returns("test") },
    },
  };

  serviceInst.authorize = test.sinon
    .stub()
    .callsFake((_, __, ___, callback) => {
      callback("mockError", null, null);
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly("mockError");
});

it("tests processAuthorize - return this.authorize, authorized is null", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath",
      action: "get",
      options: { onBehalfOf: "_ADMIN" },
    },
  };

  serviceInst.happn = {
    services: {
      error: { AccessDeniedError: test.sinon.stub().returns("test") },
    },
  };

  serviceInst.authorize = test.sinon
    .stub()
    .callsFake((_, __, ___, callback) => {
      callback(null, null, null);
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly("test");
});

it("tests processAuthorize - return this.authorize, authorized is not null", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath",
      action: "get",
      options: { onBehalfOf: "_ADMIN" },
    },
  };

  serviceInst.happn = {
    services: {
      error: { AccessDeniedError: test.sinon.stub().returns("test") },
    },
  };

  serviceInst.authorize = test.sinon
    .stub()
    .callsFake((_, __, ___, callback) => {
      callback(null, "mockAuthorized", "mockReason");
    });

  serviceInst.processAuthorize(mockMessage, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
    request: {
      path: "mockPath",
      action: "get",
      options: { onBehalfOf: "_ADMIN" },
    },
  });
});

it("tests processNonceRequest - throws error if there is no request.publicKey", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockMessage = {
    response: {},
    request: { data: "mockData" },
  };

  serviceInst.processNonceRequest(mockMessage, mockCallback);

  test.chai
    .expect(mockCallback.lastCall.args[0].message)
    .to.equal("no public key with request");
});

it("tests AccessDeniedError", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });

  serviceInst.happn = {
    services: {
      error: {
        AccessDeniedError: test.sinon.stub().returns("test"),
      },
    },
  };

  const result = serviceInst.AccessDeniedError("mockMessage", "mockReason");

  test.chai.expect(result).to.equal("test");
});

it("tests __ensureAdminUser", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = {
    adminUser: { password: "mockPassword" },
    adminGroup: {},
  };

  serviceInst.groups = {
    __upsertGroup: test.sinon.stub(),
    linkGroup: test.sinon.stub(),
  };
  serviceInst.users = {
    getUser: test.sinon.stub(),
    __upsertUser: test.sinon.stub(),
  };

  await serviceInst.__ensureAdminUser(mockConfig);

  test.chai.expect(mockConfig).to.eql({
    adminGroup: {
      name: "_ADMIN",
      permissions: {
        "*": { actions: ["*"] },
      },
    },
    adminUser: {
      password: "mockPassword",
      username: "_ADMIN",
    },
  });
});

it("tests __ensureAnonymousUser - returns anonymousUser", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = {
    allowAnonymousAccess: {},
  };

  serviceInst.users = {
    getUser: test.sinon.stub().returns("test"),
  };

  const result = serviceInst.__ensureAnonymousUser(mockConfig);

  await test.chai.expect(result).to.eventually.equal("test");
});

it("tests __ensureAnonymousUser - returns users.__upsertUser", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = {
    allowAnonymousAccess: {},
  };

  serviceInst.users = {
    getUser: test.sinon.stub().returns(null),
    __upsertUser: test.sinon.stub().returns("test"),
  };

  const result = serviceInst.__ensureAnonymousUser(mockConfig);

  await test.chai.expect(result).to.eventually.equal("test");
});

it("test linkAnonymousGroup - throws new error when allow config.allowAnonymousAccess is falsy", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockGroup = {};

  serviceInst.config = { allowAnonymousAccess: false };

  try {
    await serviceInst.linkAnonymousGroup(mockGroup);
  } catch (error) {
    test.chai
      .expect(error.message)
      .to.equal("Anonymous access is not configured");
  }
});

it("test linkAnonymousGroup - returns groups.linkGroup when config.allowAnonymousAccess is true", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockGroup = {};

  serviceInst.config = { allowAnonymousAccess: true };
  serviceInst.groups = { linkGroup: test.sinon.stub().returns("test") };

  const result = serviceInst.linkAnonymousGroup(mockGroup);

  await test.chai.expect(result).to.eventually.equal("test");
});

it("test unlinkAnonymousGroup - throws new error when allow config.allowAnonymousAccess is falsy", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockGroup = {};

  serviceInst.config = { allowAnonymousAccess: false };
  const result = serviceInst.unlinkAnonymousGroup(mockGroup);

  await test.chai
    .expect(result)
    .to.eventually.be.rejectedWith("Anonymous access is not configured");
});

it("test unlinkAnonymousGroup - returns groups.unlinkGroup when config.allowAnonymousAccess is true", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockGroup = {};

  serviceInst.config = { allowAnonymousAccess: true };
  serviceInst.groups = { unlinkGroup: test.sinon.stub().returns("test") };

  const result = serviceInst.unlinkAnonymousGroup(mockGroup);

  await test.chai.expect(result).to.eventually.equal("test");
});

it("tests __initializeReplication - happn.services.replicator is false , replicator.on callback returns", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });

  serviceInst.happn = {
    services: { replicator: { on: test.sinon.stub() } },
  };
  serviceInst.happn.services.replicator.on.callsFake((_, self) => {
    self(null, "mockSelf");
  });
  serviceInst.__initializeReplication();

  test.chai.expect(serviceInst.happn.services.replicator).is.not.null;
});

it("tests __initializeReplication - happn.services.replicator is false , changedData.replicated is set to true", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockPayload = {
    whatHappnd: "mockWhatHappnd",
    changedData: {},
    additionalInfo: "mockAdditionalInfo",
  };

  serviceInst.happn = {
    services: { replicator: { on: test.sinon.stub() } },
  };
  serviceInst.happn.services.replicator.on.callsFake((_, self) => {
    self(mockPayload, null);
  });

  serviceInst.__initializeReplication();

  test.chai.expect(mockPayload).is.eql({
    whatHappnd: "mockWhatHappnd",
    changedData: { replicated: true },
    additionalInfo: "mockAdditionalInfo",
  });
});

it("tests __initializeCheckPoint - promise is rejected ", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });

  serviceInst.checkpoint = { initialize: test.sinon.stub() };

  test.sinon
    .stub(CheckPoint.prototype, "initialize")
    .callsFake((_, __, callback) => {
      callback("mockError");
    });

  const result = serviceInst.__initializeCheckPoint("mockConfig");

  await test.chai.expect(result).to.eventually.be.rejectedWith("mockError");
});

it("tests __initializeUsers - promise is rejected", async () => {
  const SecurityUsers = require("../../../lib/services/security/users");

  const serviceInst = new SecurityService({
    logger: Logger,
  });

  test.sinon
    .stub(SecurityUsers.prototype, "initialize")
    .callsFake((_, __, callback) => {
      callback("mockError");
    });

  const result = serviceInst.__initializeUsers("mockConfig");

  await test.chai.expect(result).to.eventually.be.rejectedWith("mockError");
});

it("tests __initializeSessionTokenSecret - promise is rejected", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = { sessionTokenSecret: "mockSessionTokenSecret" };

  serviceInst.dataService = {
    upsert: test.sinon.stub(),
  };
  serviceInst.dataService.upsert.callsFake((_, __, callback) => {
    callback("mockError");
  });

  serviceInst.__initializeSessionTokenSecret(mockConfig);

  const result = serviceInst.__initializeSessionTokenSecret(mockConfig);

  await test.chai.expect(result).to.eventually.be.rejectedWith("mockError");
});

it("tests __initializeSessionTokenSecret - promise is fulfilled", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = { sessionTokenSecret: "mockSessionTokenSecret" };

  serviceInst.dataService = {
    upsert: test.sinon.stub(),
  };
  serviceInst.dataService.upsert.callsFake((_, __, callback) => {
    callback(null);
  });

  serviceInst.__initializeSessionTokenSecret(mockConfig);

  const result = serviceInst.__initializeSessionTokenSecret(mockConfig);

  await test.chai.expect(result).to.eventually.be.fulfilled;
});

it("tests __initializeGroups - promise is rejected", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const SecurityGroups = require("../../../lib/services/security/groups");

  test.sinon
    .stub(SecurityGroups.prototype, "initialize")
    .callsFake((_, __, callback) => {
      callback("mockError");
    });

  const result = serviceInst.__initializeGroups("mockConfig");

  await test.chai.expect(result).to.eventually.be.rejectedWith("mockError");
});

it("tests __initializeOnBehalfOfCache - promise is resolved", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });

  serviceInst.config = { secure: "mockSecure" };
  serviceInst.__cache_session_on_behalf_of = {};

  const result = serviceInst.__initializeOnBehalfOfCache();

  await test.chai.expect(result).to.eventually.be.fulfilled;
});

it("tests __initializeSessionManagement - return this.__loadRevokedTokens and callback is rejected", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = {};

  serviceInst.config = { secure: {} };
  serviceInst.__loadRevokedTokens = test.sinon.stub().callsFake((callback) => {
    callback("mockError");
  });
  const result = serviceInst.__initializeSessionManagement(mockConfig);

  await test.chai.expect(result).to.eventually.be.rejectedWith("mockError");
});

it("tests __initializeSessionManagement - calls this.activateSessionManagement and callback called is rejected", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = { activateSessionManagement: {} };

  serviceInst.config = { secure: {} };
  serviceInst.activateSessionManagement = test.sinon
    .stub()
    .callsFake((_, callback) => {
      callback("mockError");
    });

  const result = serviceInst.__initializeSessionManagement(mockConfig);

  await test.chai.expect(result).to.eventually.be.rejectedWith("mockError");
});

it("tests __initializeSessionManagement - calls this.activateSessionManagement and callback called is resolved", async () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = { activateSessionManagement: {} };

  serviceInst.config = { secure: {} };
  serviceInst.activateSessionManagement = test.sinon
    .stub()
    .callsFake((_, callback) => {
      callback(null);
    });

  const result = serviceInst.__initializeSessionManagement(mockConfig);

  await test.chai.expect(result).to.eventually.be.fulfilled;
});

it("tests __initializeAuthProviders - creates BaseAuthProviders", () => {
  const BaseAuthProvider = require("../../../lib/services/security/authentication/provider-base");
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockConfig = {
    authProviders: { happn: false, mockAuthProvider: "mockAuthProvider" },
    defaultAuthProvider: null,
  };

  test.sinon.stub(BaseAuthProvider, "create").returns("mockAuthProvider");
  serviceInst.authProviders = {};

  serviceInst.__initializeAuthProviders(mockConfig);

  test.chai
    .expect(serviceInst.authProviders)
    .to.eql({ mockAuthProvider: "mockAuthProvider", default: undefined });
});

it("tests activateSessionActivity returns this.__loadSessionActivity", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();

  serviceInst.__loadSessionActivity = test.sinon.stub().returns("mock test");

  const result = serviceInst.activateSessionActivity(mockCallback);

  test.chai.expect(result).to.equal("mock test");
});

it("tests activateSessionManagement - returns callback with new Error ", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockLogSessionActivity = test.sinon.stub();

  serviceInst.config = { secure: false };

  const result = serviceInst.activateSessionManagement(
    mockLogSessionActivity,
    mockCallback
  );

  test.chai.expect(mockCallback).to.have.callCount(0);
  test.chai
    .expect(mockLogSessionActivity)
    .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
});

it("tests activateSessionManagement - returns callback with error if this.config.secure is false ", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockLogSessionActivity = test.sinon.stub();

  serviceInst.config = { secure: false };

  const result = serviceInst.activateSessionManagement(
    mockLogSessionActivity,
    mockCallback
  );

  test.chai.expect(mockCallback).to.have.callCount(0);
  test.chai
    .expect(mockLogSessionActivity)
    .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
});

it("tests activateSessionManagement - calls this.__loadRevokedTokens and returns callback with error", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockLogSessionActivity = {};

  serviceInst.config = { secure: true };
  serviceInst.__loadRevokedTokens = test.sinon.stub().callsFake((callback) => {
    callback("mockError");
  });

  serviceInst.activateSessionManagement(mockLogSessionActivity, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly("mockError");
});

it("tests activateSessionManagement - calls this.__loadRevokedTokens and returns callback if logSessionActivity is false", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub().returns("mockTest");
  const mockLogSessionActivity = false;

  serviceInst.config = { secure: true };
  serviceInst.__loadRevokedTokens = test.sinon.stub().callsFake((callback) => {
    callback();
  });

  serviceInst.activateSessionManagement(mockLogSessionActivity, mockCallback);

  test.chai.expect(mockCallback).to.have.callCount(1);
});

it("tests activateSessionManagement - calls this.__loadRevokedTokens and calls this.__loadSessionActivity if logSessionActivity is true", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub().returns("mockTest");
  const mockLogSessionActivity = true;

  serviceInst.config = { secure: true };
  serviceInst.__loadRevokedTokens = test.sinon.stub().callsFake((callback) => {
    callback();
  });
  serviceInst.__loadSessionActivity = test.sinon.stub();

  serviceInst.activateSessionManagement(mockLogSessionActivity, mockCallback);

  test.chai.expect(serviceInst.__loadSessionActivity).to.have.callCount(1);
});

it("tests __loadRevokedTokens - return callback", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub().returns("mockTest");

  serviceInst.__cache_revoked_tokens = true;

  const result = serviceInst.__loadRevokedTokens(mockCallback);

  test.chai.expect(result).to.equal("mockTest");
});

it("tests deactivateSessionManagement - this.config.secure is false and returns callback with new Error", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockLogSessionActivity = test.sinon.stub();

  serviceInst.config = { secure: false };
  serviceInst.deactivateSessionManagement(mockLogSessionActivity, mockCallback);

  test.chai.expect(mockCallback).to.have.callCount(0);
  test.chai
    .expect(mockLogSessionActivity)
    .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
});

it("tests deactivateSessionManagement - logSessionActivity is true returns callback with new Error", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockLogSessionActivity = true;

  serviceInst.config = { secure: true };
  test.sinon.spy(serviceInst, "deactivateSessionActivity");

  serviceInst.deactivateSessionManagement(mockLogSessionActivity, mockCallback);

  test.chai
    .expect(serviceInst.deactivateSessionActivity)
    .to.have.been.calledWithExactly(true, test.sinon.match.func);
});

it("tests deactivateSessionManagement - logSessionActivity is false and returns callback ", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockLogSessionActivity = false;

  serviceInst.config = { secure: true };
  test.sinon.spy(serviceInst, "deactivateSessionActivity");

  serviceInst.deactivateSessionManagement(mockLogSessionActivity, mockCallback);

  test.chai.expect(mockCallback).to.have.callCount(1);
});

it("tests deactivateSessionActivity - sets callback to equal clear and calls callback", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockClear = test.sinon.stub();

  serviceInst.__cache_session_activity = {};
  serviceInst.config = {};

  serviceInst.deactivateSessionActivity(mockClear, mockCallback);

  test.chai.expect(mockClear).to.have.callCount(1);
});

it("tests deactivateSessionActivity - return this.__cache_session_activity.clear", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub();
  const mockClear = true;

  serviceInst.__cache_session_activity = { clear: test.sinon.stub() };
  serviceInst.config = {};

  serviceInst.deactivateSessionActivity(mockClear, mockCallback);

  test.chai
    .expect(serviceInst.__cache_session_activity.clear)
    .to.have.been.calledWithExactly(test.sinon.match.func);
});

it("tests __loadSessionActivity - return callback", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub().returns("mock");

  serviceInst.config = { _cache_session_activity: true };
  serviceInst.__cache_session_activity = {};

  const result = serviceInst.__loadSessionActivity(mockCallback);

  test.chai.expect(result).to.equal("mock");
  test.chai.expect(mockCallback).to.have.callCount(1);
});

it("tests __loadSessionActivity - _cache_session_activity is false", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub().returns("mock");
  serviceInst.__cache_session_activity = false;

  serviceInst.config = {
    _cache_session_activity: false,
    sessionActivityTTL: true,
  };
  serviceInst.cacheService = {
    create: test.sinon.stub().returns({ sync: test.sinon.stub() }),
  };
  serviceInst.dataService = {};

  const result = serviceInst.__loadSessionActivity(mockCallback);

  test.chai
    .expect(serviceInst.cacheService.create)
    .to.have.been.calledWithExactly("cache_session_activity", {
      type: "persist",
      cache: {
        dataStore: {},
        defaultTTL: true,
      },
    });

  test.chai
    .expect(serviceInst.__cache_session_activity.sync)
    .to.have.been.calledWithExactly(test.sinon.match.func);
});

it("tests __checkRevocations - return callback", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub().returns("mock");
  const mockToken = "mockToken";
  serviceInst.__cache_revoked_tokens = {
    get: test.sinon.stub(),
  };
  serviceInst.__cache_revoked_tokens.get.callsFake((_, callback) => {
    callback("mockError");
  });

  serviceInst.__checkRevocations(mockToken, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly("mockError");
  test.chai
    .expect(serviceInst.__cache_revoked_tokens.get)
    .to.have.been.calledWithExactly("mockToken", test.sinon.match.func);
});

it("tests __checkRevocations - return callback if item equals null", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub().returns("mock");
  const mockToken = "mockToken";
  serviceInst.__cache_revoked_tokens = {
    get: test.sinon.stub(),
  };
  serviceInst.__cache_revoked_tokens.get.callsFake((_, callback) => {
    callback(null, null);
  });

  serviceInst.__checkRevocations(mockToken, mockCallback);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, true);
  test.chai
    .expect(serviceInst.__cache_revoked_tokens.get)
    .to.have.been.calledWithExactly("mockToken", test.sinon.match.func);
});

it("tests __checkRevocations - return callback if item equals null", () => {
  const serviceInst = new SecurityService({
    logger: Logger,
  });
  const mockCallback = test.sinon.stub().returns("mock");
  const mockToken = "mockToken";
  serviceInst.__cache_revoked_tokens = {
    get: test.sinon.stub(),
  };
  serviceInst.__cache_revoked_tokens.get.callsFake((_, callback) => {
    callback(null, "mockItem");
  });

  serviceInst.__checkRevocations(mockToken, mockCallback);

  test.chai
    .expect(mockCallback)
    .to.have.been.calledWithExactly(null, false, "token has been revoked");
});
