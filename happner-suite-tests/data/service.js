const HappnDbProviderLoki = require("happn-db-provider-loki");
const HappnDbProviderMongo = require("happn-db-provider-mongo");

let mockHappn;
let mockConfig;

beforeEach("it restores sinon", () => {
  test.sinon.restore();
  mockHappn = {
    services: {
      error: { handleSystem: test.sinon.stub() },
    },
  };
  mockConfig = {
    datastores: [],
    dbfile: "mockDbFile",
    filename: "mockDbFileName",
    secure: "mockSecure",
    fsync: true,
  };
});

afterEach(() => {
  mockHappn = null;
  mockConfig = null;
});

it("tests initialize - configs properties exist , this.config.datastores.length is strictly equal to 0 and callback is called.", async () => {
  const dataService = new DataService();

  const mockCallback = test.sinon.stub();

  dataService.happn = mockHappn;
  dataService.initialize(mockConfig, mockCallback);

  await require("node:timers/promises").setTimeout(50);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly();
});

it("tests initialize - this.config.datastores.length is strictly equal to 0 and callback is called.", async () => {
  const dataService = new DataService();
  const mockCallback = test.sinon.stub();

  dataService.happn = mockHappn;
  mockConfig.datastores = null;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallback);

  await require("node:timers/promises").setTimeout(50);

  test.chai.expect(mockConfig.datastores).to.eql([
    {
      name: "default",
      provider: "happn-db-provider-loki",
      isDefault: true,
      settings: {
        fsync: true,
        filename: "mockDbFile",
        snapshotRollOverThreshold: 1000,
        tempDataFilename: "temp_mockDbFile",
      },
    },
  ]);
  test.chai.expect(mockCallback).to.have.been.calledWithExactly();
});

it("tests __initializeProviders calls async.eachSeries method . Its callbacks are called and returns datastoreCallback with e and promise is rejected with e.", async () => {
  const dataService = new DataService();
  const mockCallback = test.sinon.stub();

  dataService.happn = mockHappn;
  mockConfig.datastores = null;
  mockConfig.secure = null;

  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => cb(new Error("mockError")));

  dataService.initialize(mockConfig, mockCallback);

  await require("node:timers/promises").setTimeout(50);

  test.chai
    .expect(mockCallback)
    .to.have.been.calledOnceWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError"))
    );
  test.chai
    .expect(stubInitialize)
    .to.have.been.calledWithExactly(test.sinon.match.func);

  stubInitialize.restore();
});

it("tests __initializeProviders calls async.eachSeries method . Its callbacks are called and returns datastoreCallback with e and initialize throws error.", async () => {
  const dataService = new DataService();
  const mockCallback = test.sinon.stub();

  dataService.happn = mockHappn;
  mockConfig.datastores = null;
  mockConfig.secure = null;

  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .throws(new Error("mockError"));

  dataService.initialize(mockConfig, mockCallback);

  await require("node:timers/promises").setTimeout(50);

  test.chai
    .expect(mockCallback)
    .to.have.been.calledOnceWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError"))
    );
  test.chai
    .expect(stubInitialize)
    .to.have.been.calledWithExactly(test.sinon.match.func);

  stubInitialize.restore();
});

it.skip("tests _insertDataProvider - dataStoreInstance.provider.initialize is called and assigns transform and transform all functions to dataStoreInstance.provider.", async () => {
  const dataService = new DataService();
  const mockCallback = test.sinon.stub();
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  dataService.happn = mockHappn;

  mockConfig.datastores = null;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallback);

  await require("node:timers/promises").setTimeout(100);

  test.chai.expect(mockCallback).to.have.been.calledOnceWithExactly();
  // test.chai
  //   .expect(stubInitialize)
  //   .to.have.been.calledWithExactly(test.sinon.match.func);
});

it.skip("tests __attachProviderEvents - provider.on is not a function", async () => {
  const dataService = new DataService();
  const mockCallback = test.sinon.stub();
  const stubInitialize = test.sinon.stub(
    HappnDbProviderLoki.prototype,
    "initialize"
  );
  // test.sinon.stub(HappnDbProviderMongo.prototype).on
  dataService.happn = mockHappn;
  mockConfig.datastores = null;
  mockConfig.secure = null;

  stubInitialize.callsFake((cb) => {
    cb(null);
  });
  // stubHappnDbProviderLoki.on = null;

  dataService.initialize(mockConfig, mockCallback);

  await require("node:timers/promises").setTimeout(50);

  test.chai.expect(mockCallback).to.have.been.calledOnceWithExactly();
  test.chai
    .expect(stubInitialize)
    .to.have.been.calledWithExactly(test.sinon.match.func);

  stubInitialize.restore();
});

it("tests upsert method - data is falsy and upsert method returns when this.__providerHasFeature returns true.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath";
  const mockData = null;
  const mockOptions = { merge: true };

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);

  const result = dataService.upsert(
    mockPath,
    mockData,
    mockOptions,
    mockCallbackTwo
  );

  test.chai.expect(result).to.be.undefined;
});

it("tests upsert method - It returns when this.__providerHasFeature returns provider.featureset[feature] and callback is called with error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath";
  const mockData = { _meta: "mockMeta" };
  const mockOptions = { merge: true };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderMongo.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubFindOne = test.sinon
    .stub(HappnDbProviderMongo.prototype, "findOne")
    .callsFake((_, __, cb) => {
      cb(new Error("mockError"));
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;
  mockConfig.datastores = [
    {
      provider: "happn-db-provider-mongo",
      name: "mockName",
      patterns: [],
      settings: {},
    },
  ];
  const stubHandleSystem =
    dataService.happn.services.error.handleSystem.callsFake(
      (_, __, ___, cb) => {
        cb(new Error("mockError", null));
      }
    );

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.upsert(
    mockPath,
    mockData,
    mockOptions,
    mockCallbackTwo
  );

  test.chai.expect(result).to.be.undefined;
  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError"))
    );
  test.chai
    .expect(stubFindOne)
    .to.have.been.calledWithExactly(
      { path: "mockPath" },
      {},
      test.sinon.match.func
    );
  test.chai
    .expect(stubHandleSystem)
    .to.have.been.calledWithExactly(
      test.sinon.match.instanceOf(Error),
      "DataService",
      CONSTANTS.ERROR_SEVERITY.MEDIUM,
      test.sinon.match.func
    );

  stubInitialize.restore();
  stubFindOne.restore();
});

it("tests get method - parseFields throws error, error is caught and callback is called with error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath";
  const mockParameters = {
    options: {
      fields: { $regex: true },
    },
  };

  dataService.happn = mockHappn;
  dataService.key = mockConfig.datastores = null;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);

  await require("node:timers/promises").setTimeout(50);

  const result = dataService.get(mockPath, mockParameters, mockCallbackTwo);

  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(
          test.sinon.match.has(
            "message",
            "$regex parameter value must be an Array or a string"
          )
        )
    );
  test.chai.expect(result).to.be.undefined;
});

it("tests get method - find method is called if e is truthy and returns callback with error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath";
  const mockParameters = {};
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubFind = test.sinon
    .stub(HappnDbProviderLoki.prototype, "find")
    .callsFake((_, __, cb) => {
      cb(new Error("mockError"), null);
    });
  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.happn = mockHappn;
  mockConfig.datastores = null;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);

  await require("node:timers/promises").setTimeout(50);

  dataService.get(mockPath, mockParameters, mockCallbackTwo);

  test.chai
    .expect(stubFind)
    .to.have.been.calledWithExactly(
      "mockPath",
      { criteria: null, options: {} },
      test.sinon.match.func
    );
  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError"))
    );

  stubInitialize.restore();
  stubFind.restore();
});

it("tests get method - provider.find method is called and callback is returned if parsedParameters.options.aggregate is truthy.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath";
  const mockParameters = { options: { aggregate: {} } };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderMongo.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubFind = test.sinon
    .stub(HappnDbProviderMongo.prototype, "find")
    .callsFake((_, __, cb) => {
      cb(null, []);
    });
  dataService.happn = mockHappn;
  mockConfig.secure = null;
  mockConfig.datastores = [
    {
      provider: "happn-db-provider-mongo",
      name: "mockName",
      patterns: [],
      settings: {},
    },
  ];

  dataService.initialize(mockConfig, mockCallbackOne);

  await require("node:timers/promises").setTimeout(50);

  dataService.get(mockPath, mockParameters, mockCallbackTwo);

  test.chai
    .expect(stubFind)
    .to.have.been.calledWithExactly(
      "mockPath",
      { criteria: null, options: { aggregate: {} } },
      test.sinon.match.func
    );
  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, []);

  stubInitialize.restore();
  stubFind.restore();
});

it("tests get method -parameters is a function . When provider.find method is called a callback is returned if path.IndexOf strictly equals -1 and if items.length is strictly equal to 0.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath";
  const mockParameters = test.sinon.stub();
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubFind = test.sinon
    .stub(HappnDbProviderLoki.prototype, "find")
    .callsFake((_, __, cb) => {
      cb(null, []);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);

  await require("node:timers/promises").setTimeout(50);

  dataService.get(mockPath, mockParameters, mockCallbackTwo);

  test.chai
    .expect(stubFind)
    .to.have.been.calledWithExactly(
      "mockPath",
      { criteria: null, options: {} },
      test.sinon.match.func
    );
  test.chai.expect(mockParameters).to.have.been.calledWithExactly(null, null);

  stubInitialize.restore();
  stubFind.restore();
});

it("tests get method - provider.find method is called and callback is returned if  path.IndexOf strictly equals -1 and if there are items in the items array .", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath";
  const mockParameters = { options: { aggregate: null, fields: null } };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubFind = test.sinon
    .stub(HappnDbProviderLoki.prototype, "find")
    .callsFake((_, __, cb) => {
      cb(null, [{}]);
    });
  const stubTransform = test.sinon
    .stub(HappnDbProviderLoki.prototype, "transform")
    .returns("mockTransform");

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);

  await require("node:timers/promises").setTimeout(50);

  dataService.get(mockPath, mockParameters, mockCallbackTwo);

  test.chai
    .expect(stubFind)
    .to.have.been.calledWithExactly(
      "mockPath",
      { criteria: null, options: { aggregate: null, fields: null } },
      test.sinon.match.func
    );
  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(null, "mockTransform");
  test.chai
    .expect(stubTransform)
    .to.have.been.calledWithExactly({}, null, null);

  stubInitialize.restore();
  stubFind.restore();
});

it("tests get method - provider.find method is called and callback is returned if parsedParameters.options.path_only is truthy.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath/*";
  const mockParameters = {
    options: { aggregate: null, fields: null },
    path_only: true,
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubFind = test.sinon
    .stub(HappnDbProviderLoki.prototype, "find")
    .callsFake((_, __, cb) => {
      cb(null, [{}]);
    });
  const stubTransformAll = test.sinon
    .stub(HappnDbProviderLoki.prototype, "transformAll")
    .returns("mockTransformAll");

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);

  await require("node:timers/promises").setTimeout(50);

  dataService.get(mockPath, mockParameters, mockCallbackTwo);

  test.chai.expect(stubFind).to.have.been.calledWithExactly(
    "mockPath/*",
    {
      criteria: null,
      options: {
        aggregate: null,
        fields: { path: 1, _meta: 1 },
        path_only: true,
      },
    },
    test.sinon.match.func
  );
  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
    paths: "mockTransformAll",
  });
  test.chai.expect(stubTransformAll).to.have.been.calledWithExactly([{}]);

  stubInitialize.restore();
  stubFind.restore();
});

it("tests get method - provider.find method is called and callback is returned if all conditions are falsy.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath/*";
  const mockParameters = {
    options: { aggregate: null, fields: null },
    path_only: false,
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubFind = test.sinon
    .stub(HappnDbProviderLoki.prototype, "find")
    .callsFake((_, __, cb) => {
      cb(null, [{}]);
    });
  const stubTransformAll = test.sinon
    .stub(HappnDbProviderLoki.prototype, "transformAll")
    .returns("mockTransformAll");

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);

  await require("node:timers/promises").setTimeout(50);

  dataService.get(mockPath, mockParameters, mockCallbackTwo);

  test.chai.expect(stubFind).to.have.been.calledWithExactly(
    "mockPath/*",
    {
      criteria: null,
      options: { aggregate: null, fields: null },
    },
    test.sinon.match.func
  );
  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(null, "mockTransformAll");
  test.chai.expect(stubTransformAll).to.have.been.calledWithExactly([{}], null);

  stubInitialize.restore();
  stubFind.restore();
  stubTransformAll.restore();
});

it("tests get method - provider.find method is called and callback is returned if all conditions are falsy.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath";
  const mockParameters = {
    options: { aggregate: {}, fields: null, sort: {}, collation: null },
    criteria: {},
    path_only: false,
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);

  await require("node:timers/promises").setTimeout(50);

  dataService.get(mockPath, mockParameters, mockCallbackTwo);

  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));

  stubInitialize.restore();
});

it("tests get method - provider.find method is called and callback is returned if all conditions are falsy.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath";
  const mockParameters = {
    options: { aggregate: null, fields: null, sort: {}, collation: {} },
    criteria: {},
    path_only: false,
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);

  await require("node:timers/promises").setTimeout(50);

  dataService.get(mockPath, mockParameters, mockCallbackTwo);

  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));

  stubInitialize.restore();
});

it("tests processGet method - returns and calls this.get .Then its callback functions calls this.errorService.handleSystem and callback is called with error and message.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath/",
      options: {},
    },
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubFind = test.sinon
    .stub(HappnDbProviderLoki.prototype, "find")
    .callsFake((_, __, cb) => {
      cb(new Error("mockError"), null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;
  const stubHandleSystem =
    dataService.happn.services.error.handleSystem.callsFake(
      (_, __, ___, cb) => {
        cb(new Error("mockError"));
      }
    );

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.processGet(mockMessage, mockCallbackTwo);

  test.chai
    .expect(stubFind)
    .to.have.been.calledWithExactly(
      "mockPath/",
      { criteria: null, options: {} },
      test.sinon.match.func
    );
  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error), {
      request: { path: "mockPath/", options: { options: {} } },
    });
  test.chai
    .expect(stubHandleSystem)
    .to.have.been.calledWithExactly(
      test.sinon.match.instanceOf(Error),
      "DataService",
      CONSTANTS.ERROR_SEVERITY.HIGH,
      test.sinon.match.func
    );

  stubInitialize.restore();
  stubFind.restore();
});

it("tests processGet method - returns and call this.get and its callback function returns callback with null and message.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath/",
      options: {},
    },
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubFind = test.sinon
    .stub(HappnDbProviderLoki.prototype, "find")
    .callsFake((_, __, cb) => {
      cb(null, [{}]);
    });
  const stubTransform = test.sinon
    .stub(HappnDbProviderLoki.prototype, "transform")
    .returns("mockTransform");

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.processGet(mockMessage, mockCallbackTwo);

  test.chai.expect(result).to.be.undefined;
  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
    request: { path: "mockPath/", options: { options: {} } },
    response: "mockTransform",
  });
  test.chai
    .expect(stubFind)
    .to.have.been.calledWithExactly(
      "mockPath/",
      { criteria: null, options: {} },
      test.sinon.match.func
    );
  test.chai
    .expect(stubTransform)
    .to.have.been.calledWithExactly({}, null, undefined);

  stubInitialize.restore();
  stubFind.restore();
  stubTransform.restore();
});

it("tests count method - parameters is a function and callback is called with error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath/";
  const mockParameters = test.sinon.stub();

  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubCount = test.sinon
    .stub(HappnDbProviderLoki.prototype, "count")
    .callsFake((_, __, cb) => {
      cb(new Error("mockError"), null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.count(mockPath, mockParameters, mockCallbackTwo);

  test.chai.expect(stubCount).to.have.been.calledWithExactly(
    "mockPath/",
    {
      criteria: null,
      options: {},
    },
    test.sinon.match.func
  );
  test.chai
    .expect(mockParameters)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError"))
    );

  stubInitialize.restore();
  stubCount.restore();
});

it("tests count method - provider.count is called and callback is called with null and count.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath/";
  const mockParameters = {};

  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubCount = test.sinon
    .stub(HappnDbProviderLoki.prototype, "count")
    .callsFake((_, __, cb) => {
      cb(null, "mockCount");
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.count(mockPath, mockParameters, mockCallbackTwo);

  test.chai.expect(stubCount).to.have.been.calledWithExactly(
    "mockPath/",
    {
      criteria: null,
      options: {},
    },
    test.sinon.match.func
  );
  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(null, "mockCount");

  stubInitialize.restore();
  stubCount.restore();
});

it("tests count method - __getPullOptions throws error and when error is caught callback is called with error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath/";
  const mockParameters = {};

  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubCount = test.sinon
    .stub(HappnDbProviderLoki.prototype, "count")
    .callsFake((_, __, cb) => {
      cb(null, "mockCount");
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.count(mockPath, mockParameters, mockCallbackTwo);

  test.chai.expect(stubCount).to.have.been.calledWithExactly(
    "mockPath/",
    {
      criteria: null,
      options: {},
    },
    test.sinon.match.func
  );
  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(null, "mockCount");

  stubInitialize.restore();
  stubCount.restore();
});

it("tests count method - error is caught and callback is called with error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath/";
  const mockParameters = {
    options: {
      fields: { $regex: true },
    },
  };

  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.count(mockPath, mockParameters, mockCallbackTwo);

  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(
          test.sinon.match.has(
            "message",
            "$regex parameter value must be an Array or a string"
          )
        )
    );
  stubInitialize.restore();
});

it("tests processCount method - this.count is called and then this.errorService.handleSystem. Callback is called with error and message.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = { request: { path: "mockPath", options: {} } };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubCount = test.sinon
    .stub(HappnDbProviderLoki.prototype, "count")
    .callsFake((_, __, cb) => {
      cb(new Error("mockError", null));
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;
  const stubHandleSystem =
    dataService.happn.services.error.handleSystem.callsFake(
      (_, __, ___, cb) => {
        cb(new Error("mockError"));
      }
    );

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.processCount(mockMessage, mockCallbackTwo);

  test.chai.expect(result).to.be.undefined;
  test.chai
    .expect(stubCount)
    .to.have.been.calledWithExactly(
      "mockPath",
      { criteria: null, options: {} },
      test.sinon.match.func
    );
  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError")),
      { request: { path: "mockPath", options: { options: {} } } }
    );
  test.chai
    .expect(stubHandleSystem)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError")),
      "DataService",
      CONSTANTS.ERROR_SEVERITY.HIGH,
      test.sinon.match.func
    );

  stubInitialize.restore();
  stubCount.restore();
});

it("tests processCount method - this.count is called and then callback is called with null and message.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = { request: { path: "mockPath", options: {} } };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubCount = test.sinon
    .stub(HappnDbProviderLoki.prototype, "count")
    .callsFake((_, __, cb) => {
      cb(null, "mockCount");
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.processCount(mockMessage, mockCallbackTwo);

  test.chai.expect(result).to.be.undefined;
  test.chai
    .expect(stubCount)
    .to.have.been.calledWithExactly(
      "mockPath",
      { criteria: null, options: {} },
      test.sinon.match.func
    );
  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
    request: { path: "mockPath", options: { options: {} } },
    response: "mockCount",
  });

  stubInitialize.restore();
  stubCount.restore();
});

it("tests processRemove method - this.remove is called and then this.errorService.handleSystem is called. Callback is called withe error and message.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = { request: { path: "mockPath", options: {} } };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubRemove = test.sinon
    .stub(HappnDbProviderLoki.prototype, "remove")
    .callsFake((_, cb) => {
      cb(new Error("mockError"), null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;
  const stubHandleSystem =
    dataService.happn.services.error.handleSystem.callsFake(
      (_, __, ___, cb) => {
        cb(new Error("mockError"));
      }
    );

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.processRemove(mockMessage, mockCallbackTwo);

  test.chai.expect(result).to.be.undefined;
  test.chai
    .expect(stubRemove)
    .to.have.been.calledWithExactly("mockPath", test.sinon.match.func);
  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError")),
      {
        request: { path: "mockPath", options: {} },
      }
    );
  test.chai
    .expect(stubHandleSystem)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(
          test.sinon.match.has(
            "message",
            "error removing item on path mockPath"
          )
        ),
      "DataService",
      CONSTANTS.ERROR_SEVERITY.HIGH,
      test.sinon.match.func
    );

  stubInitialize.restore();
  stubRemove.restore();
});

it("tests processRemove method - this.remove is called and then callback is called with null and message.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = { request: { path: "mockPath", options: {} } };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubRemove = test.sinon
    .stub(HappnDbProviderLoki.prototype, "remove")
    .callsFake((_, cb) => {
      cb(null, "mockRemoved");
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.processRemove(mockMessage, mockCallbackTwo);

  test.chai.expect(result).to.be.undefined;
  test.chai
    .expect(stubRemove)
    .to.have.been.calledWithExactly("mockPath", test.sinon.match.func);
  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
    request: { path: "mockPath", options: {} },
    response: "mockRemoved",
  });

  stubInitialize.restore();
  stubRemove.restore();
});

it("tests processStore method - processNoStore was called and then callback was callled with null and message.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath",
      options: {
        noStore: {},
      },
      data: {},
    },
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.processStore(mockMessage, mockCallbackTwo);

  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
    request: {
      path: "mockPath",
      options: {
        noStore: {},
      },
      data: {},
    },
    response: {
      data: {},
      _meta: {
        path: "mockPath",
      },
    },
  });

  test.chai.expect(result).to.be.undefined;

  stubInitialize.restore();
});

it("tests processStore method - this.upsert is called and this.errorService.handleSystem . Callback is called with error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = {
    request: {
      path: "mockPath",
      data: {},
    },
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubUpsert = test.sinon
    .stub(HappnDbProviderLoki.prototype, "upsert")
    .callsFake((_, __, ___, cb) => {
      cb(new Error("mockError"), null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  const stubHandleSystem =
    dataService.happn.services.error.handleSystem.callsFake(
      (_, __, ___, cb) => {
        cb(new Error("mockError"));
      }
    );

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.processStore(mockMessage, mockCallbackTwo);

  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError"))
    );

  test.chai
    .expect(stubHandleSystem)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError")),
      "DataService",
      CONSTANTS.ERROR_SEVERITY.HIGH,
      test.sinon.match.func
    );

  stubInitialize.restore();
  stubUpsert.restore();
});

it("tests processStore method - this.upsert is called and Callback is called with null and message.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = {
    request: {
      options: {
        upsertType: constants.UPSERT_TYPE.BULK,
      },
      path: "mockPath",
      data: {},
    },
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubUpsert = test.sinon
    .stub(HappnDbProviderLoki.prototype, "upsert")
    .callsFake((_, __, ___, cb) => {
      cb(null, {});
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.processStore(mockMessage, mockCallbackTwo);

  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
    response: {},
    request: {
      options: { upsertType: 3, noPublish: true },
      data: {},
      path: "mockPath",
    },
  });

  stubInitialize.restore();
  stubUpsert.restore();
});

it("tests procesSecuresStore method - this.upsert is called and Callback is called with null and message.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = {
    session: {
      user: {
        username: "mockUsername",
      },
    },
    request: {
      path: "mockPath",
      data: {},
    },
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubUpsert = test.sinon
    .stub(HappnDbProviderLoki.prototype, "upsert")
    .callsFake((_, __, ___, cb) => {
      cb(null, {});
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.processSecureStore(mockMessage, mockCallbackTwo);

  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
    session: { user: { username: "mockUsername" } },
    request: {
      path: "mockPath",
      data: {},
      options: { modifiedBy: "mockUsername" },
    },
    response: {},
  });

  stubInitialize.restore();
  stubUpsert.restore();
});

it("tests procesSecuresStore method - this.processNoStore is called if message.request.options.noStore is truthy.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = {
    session: {
      user: {
        username: "mockUsername",
      },
    },
    request: {
      options: { noStore: {} },
      path: "mockPath",
      data: {},
    },
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.processSecureStore(mockMessage, mockCallbackTwo);

  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {
    session: { user: { username: "mockUsername" } },
    request: {
      path: "mockPath",
      data: {},
      options: { noStore: {} },
    },
    response: {
      data: {},
      _meta: {
        path: "mockPath",
      },
    },
  });

  stubInitialize.restore();
});

it("tests procesSecuresStore method - this.upsert is called and this.errorService.handleSystem. Callback is then called with error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockMessage = {
    session: {
      user: {
        username: "mockUsername",
      },
    },
    request: {
      path: "mockPath",
      data: {},
    },
  };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubUpsert = test.sinon
    .stub(HappnDbProviderLoki.prototype, "upsert")
    .callsFake((_, __, ___, cb) => {
      cb(new Error("mockError"), null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;
  const stubHandleSystem =
    dataService.happn.services.error.handleSystem.callsFake(
      (_, __, ___, cb) => {
        cb(new Error("mockError"));
      }
    );

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.processSecureStore(mockMessage, mockCallbackTwo);

  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError"))
    );
  test.chai
    .expect(stubHandleSystem)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError")),
      "DataService",
      CONSTANTS.ERROR_SEVERITY.HIGH,
      test.sinon.match.func
    );

  stubInitialize.restore();
  stubUpsert.restore();
});

it("tests getOneByPath method - this.db(path).findOneand this.errorService.handleSystem is called . callback is called with null and findResult.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockPath = "mockPath";
  const mockFields = null;
  const stubInitialize = test.sinon
    .stub(HappnDbProviderMongo.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });
  const stubFindOne = test.sinon
    .stub(HappnDbProviderMongo.prototype, "findOne")
    .callsFake((_, __, cb) => {
      cb(null, {});
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;
  mockConfig.datastores = [
    {
      provider: "happn-db-provider-mongo",
      name: "mockName",
      patterns: [],
      settings: {},
    },
  ];

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.getOneByPath(mockPath, mockFields, mockCallbackTwo);

  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, {});
  test.chai
    .expect(stubFindOne)
    .to.have.been.calledWithExactly(
      { path: "mockPath" },
      {},
      test.sinon.match.func
    );

  stubInitialize.restore();
  stubFindOne.restore();
});

it("tests addDataStoreFilter - throws errorif datastoreKey is falsy.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const dataStoreKey = null;
  const pattern = [];
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);

  try {
    dataService.addDataStoreFilter(pattern, dataStoreKey);
  } catch (error) {
    test.chai
      .expect(error.message)
      .to.be.equal("missing datastoreKey parameter");
  }

  stubInitialize.restore();
});

it("tests addDataStoreFilter - throws error if dataStore is falsy.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const dataStoreKey = "mockDataStoreKey";
  const pattern = [];
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);

  try {
    dataService.addDataStoreFilter(pattern, dataStoreKey);
  } catch (error) {
    test.chai
      .expect(error.message)
      .to.be.equal("missing datastore with the key [mockDataStoreKey]");
  }

  stubInitialize.restore();
});

it("tests parseFields - calls this.remove if this.key.indexOf() is strictly equal to 0. ", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockFields = { "_data.": {} };
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.parseFields(mockFields);

  test.chai.expect(result).to.be.eql({
    "data.": {},
  });
  stubInitialize.restore();
});

it("tests filter - this.parseFields throws error and callback is called with new error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockCriteria = { bsonid: 1 };
  const mockData = "mockData";
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.filter(mockCriteria, mockData, mockCallbackTwo);

  test.chai.expect(mockCallbackTwo).to.have.been.calledWithExactly(null, []);

  stubInitialize.restore();
});

it("tests filter - this.parseFields throws error and callback is called with new error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockCriteria = { $regex: {} };
  const mockData = "mockData";
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.filter(mockCriteria, mockData, mockCallbackTwo);

  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "Filter of resultset failed"))
    );

  stubInitialize.restore();
});

it("tests filter - this.parseFields throws error and callback is called with new error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockCriteria = null;
  const mockData = "mockData";
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.filter(mockCriteria, mockData, mockCallbackTwo);

  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(null, "mockData");

  stubInitialize.restore();
});

it("tests filter - this.parseFields throws error and callback is called with new error.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockCallbackTwo = test.sinon.stub();
  const mockCriteria = null;
  const mockData = "mockData";
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  dataService.filter(mockCriteria, mockData, mockCallbackTwo);

  test.chai
    .expect(mockCallbackTwo)
    .to.have.been.calledWithExactly(null, "mockData");

  stubInitialize.restore();
});

it("tests transform - creates meta object and adds all dataObj properties to meta object.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockDataObj = {
    created: {},
    modified: {},
    modifiedBy: {},
    path: "mockPath/",
    data: "mockData",
  };
  const mockMeta = null;
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.transform(mockDataObj, mockMeta);

  test.chai.expect(result).to.eql({
    _meta: {
      created: {},
      modified: {},
      modifiedBy: {},
      path: "mockPath/",
    },
    data: "mockData",
  });

  stubInitialize.restore();
});

it("tests transform - creates meta object and returns transformed object.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockDataObj = {
    path: "mockPath/",
    data: "mockData",
  };
  const mockMeta = null;
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.transform(mockDataObj, mockMeta);

  test.chai.expect(result).to.eql({
    _meta: {
      path: "mockPath/",
    },
    data: "mockData",
  });

  stubInitialize.restore();
});

it("tests transform - meta object exists and transformed object is returned.", async () => {
  const dataService = new DataService();
  const mockCallbackOne = test.sinon.stub();
  const mockDataObj = {
    path: "mockPath/",
    data: "mockData",
  };
  const mockMeta = {};
  const stubInitialize = test.sinon
    .stub(HappnDbProviderLoki.prototype, "initialize")
    .callsFake((cb) => {
      cb(null);
    });

  dataService.happn = mockHappn;
  mockConfig.secure = null;

  dataService.initialize(mockConfig, mockCallbackOne);
  await require("node:timers/promises").setTimeout(50);
  const result = dataService.transform(mockDataObj, mockMeta);

  test.chai.expect(result).to.eql({
    _meta: {
      path: "mockPath/",
    },
    data: "mockData",
  });

  stubInitialize.restore();
});
