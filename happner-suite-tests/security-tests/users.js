const SecurityUsers = require('../../../lib/services/security/users');
    const PermissionsManager = require('../../../lib/services/security/permissions');
    const UsersByGroupCache = require('../../../lib/services/security/users-by-group-cache');

    function stubBindInEachGroup(users) {
      const groups = [
        'unlinkGroup',
        'linkGroup',
        'getGroup',
        'listGroups',
        'deleteGroup',
        'upsertGroup',
      ];
      groups.forEach((bind) => {
        users.groups[bind] = test.sinon.stub();
      });
    }
    let mockHappn;
    let mockConfig;
    let mockGroups;
    beforeEach(() => {
      mockHappn = {
        services: {
          cache: { create: test.sinon.stub() },
          data: {
            get: test.sinon.stub(),
            upsert: test.sinon.stub(),
            remove: test.sinon.stub(),
            count: test.sinon.stub(),
          },
          utils: { clone: test.sinon.stub() },
          error: {},
          crypto: { generateHash: test.sinon.stub() },
          session: {},
        },
      };
      mockConfig = {
        __cache_users: {},
        __cache_users_by_groups: {},
        usernamesCaseInsensitive: {},
        usernamesCaseInsensitiveExclude: null,
      };
    
    });

    afterEach(() => {
      mockHappn = null;
      mockConfig = null;
    });

it('tests initialize - config.__cache_users_by_groups is truthy and adds _ADMIN to usernamesCaseInsensitiveExclude array.', () =>
{
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');

    mockConfig.__cache_users = null;
    users.happn = mockHappn;
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);

    test.chai.expect(stubCreatePermissions).to.have.callCount(1)
    test.chai.expect(mockConfig).to.eql({
      __cache_users_by_groups: {},
      usernamesCaseInsensitive: {},
      __cache_users: { max: 10000, maxAge: 0 },
      usernamesCaseInsensitiveExclude: ['_ADMIN'],
    });
    test.chai.expect(mockCallback).to.have.callCount(1);
    stubCreatePermissions.restore();
  });

  it('tests initialize - config.__cache_users is truthy and _ADMIN already exist inside of usernamesCaseInsensitiveExclude array', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');

    users.happn = mockHappn;
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);

    test.chai.expect(mockConfig).to.eql({
      __cache_users: {},
      __cache_users_by_groups: {},
      usernamesCaseInsensitive: {},
      usernamesCaseInsensitiveExclude: ['_ADMIN'],
    });
    test.chai.expect(mockCallback).to.have.callCount(1);
    stubCreatePermissions.restore();
  });

  it('tests initialize - throws error ', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const stubCreate = test.sinon
      .stub(PermissionsManager, 'create')
      .throws(new Error('mockError'));

    users.happn = mockHappn;
    users.happn.services.cache.create.throws(new Error('mockError'));
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );

    stubCreate.restore();
  });

  it('test clearGroupUsersFromCache - calls this.__cache_users.remove', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockGroup = 'mockGroup';
    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ getResult });
    const remove = test.sinon.stub();

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = await users.clearGroupUsersFromCache(mockGroup);

    test.chai.expect(mockCallback).to.have.callCount(1);
    test.chai.expect(remove).to.have.been.calledWithExactly('mockUser');
    test.chai.expect(getResult).to.have.been.calledWithExactly('mockGroup');
    test.chai.expect(users.happn.services.cache.create).to.have.callCount(2);
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - it clears group users from cache if whatHappnd === SD_EVENTS.DELETE_GROUP ', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'delete-group';
    const mockChanged = {
      obj: { name: 'mockName' },
      _meta: {
        path: 'path/mockPath',
      },
      path: 'path/mockPath',
    };
    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = await users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(groupChanged).to.have.been.calledWithExactly('mockName');
    test.chai.expect(getResult).to.have.been.calledWithExactly('mockName');
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches -it clears group users from cache if whatHappnd === SD_EVENTS.UNLINK_GROUP ', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'unlink-group';
    const mockChanged = {
      obj: { name: 'mockName' },
      _meta: {
        path: 'path/mockPath',
      },
      path: 'path/mockPath',
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = await users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(groupChanged).to.have.been.calledWithExactly('mockPath');
    test.chai.expect(getResult).to.have.been.calledWithExactly('mockPath');
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches -it clears group users from cache if whatHappnd === SD_EVENTS.LINK_GROUP', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'link-group';
    const mockChanged = {
      obj: { name: 'mockName' },
      _meta: {
        path: 'path/mockPath',
      },
      path: 'path/mockPath',
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create');
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = await users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(groupChanged).to.have.been.calledWithExactly('mockPath');
    test.chai.expect(getResult).to.have.been.calledWithExactly('mockPath');
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.PERMISSION_REMOVED, changedData.username and this.permissionManager is truthy.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'permission-removed';
    const mockChanged = {
      username: 'mockUsername',
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const cache = {
      remove: test.sinon.stub(),
    };
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns({
      cache: cache,
    });
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(remove).to.have.been.calledWithExactly('mockUsername');
    test.chai.expect(cache.remove).to.have.been.calledWithExactly('mockUsername');
    await test.chai.expect(result).to.eventually.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.PERMISSION_UPSERTED, changedData.username is truthy and this.permissionManager is falsy.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'permission-upserted';
    const mockChanged = {
      username: 'mockUsername',
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const cache = {
      remove: test.sinon.stub(),
    };
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(remove).to.have.been.calledWithExactly('mockUsername');
    await test.chai.expect(result).to.eventually.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.PERMISSION_UPSERTED, changedData.username is falsy.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'permission-upserted';
    const mockChanged = {
      username: null,
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const cache = {
      remove: test.sinon.stub(),
    };
    const groupChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns({
      cache: cache,
    });
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ groupChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    await test.chai.expect(result).to.eventually.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.UPSERT_USER and calls this.permissionManager.cache.remove', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'upsert-user';
    const mockChanged = {
      username: 'mockUsername',
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const cache = {
      remove: test.sinon.stub(),
    };
    const userChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns({
      cache: cache,
    });
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ userChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    test.chai.expect(userChanged).to.have.been.calledWithExactly('mockUsername');
    test.chai.expect(remove).to.have.been.calledWith('mockUsername');
    test.chai.expect(remove).to.have.callCount(2);
    await test.chai.expect(result).to.eventually.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.DELETE_USER and resolves promise', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'delete-user';
    const mockChanged = {
      username: 'mockUsername',
      obj: {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/',
        },
      },
    };
    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const cache = {
      remove: test.sinon.stub(),
    };
    const userChanged = test.sinon.stub().returns({ groupChanged: test.sinon.stub() });
    const getResult = test.sinon.stub().returns(['mockUser']);
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon
      .stub(UsersByGroupCache, 'create')
      .returns({ userChanged, getResult });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    await test.chai.expect(result).to.eventually.be.undefined;
    test.chai.expect(remove).to.have.been.calledWith('');
    test.chai.expect(remove).to.have.callCount(2);

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests clearCaches - checks if whatHappnd === SD_EVENTS.DELETE_USER, error is thrown and promise is rejected', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockWhatHappnd = 'delete-user';
    const mockChanged = {
      username: 'mockUsername',
      obj: {
        _meta: {
          path: '/_SYSTEM/_SECURITY/_USER/',
        },
      },
    };

    const mockSecurityService = {};
    const mockCallback = test.sinon.stub();
    const remove = test.sinon.stub();
    const userChanged = test.sinon.stub().throws(new Error('mockError'));
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ADMIN'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallback);
    const result = users.clearCaches(mockWhatHappnd, mockChanged);

    await test.chai.expect(result).to.eventually.been.rejectedWith('mockError');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - call this.dataService.get and return callback with error', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: 'mockUsername', name: 'mockName' };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = { validateName: test.sinon.stub() };
    const remove = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      const mockError = new Error('mockError');
      callback(mockError);
    });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly(
        '/_SYSTEM/_SECURITY/_USER/mockusername',
        {},
        test.sinon.match.func
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - calls this.dataService.get and returns callback with new error if result is null', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: 'mockUsername', name: 'mockName' };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(null, null);
    });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly(
        '/_SYSTEM/_SECURITY/_USER/mockusername',
        {},
        test.sinon.match.func
      );
    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(
            test.sinon.match.has(
              'message',
              'validation failure: no password or publicKey specified for a new user'
            )
          )
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - this.__upsertUser is rejected with error, callback called with error.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: 'mockUsername', name: 'mockName', permissions: {} };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub().callsFake((_, __, ___, ____, _____, callback) => {
        callback();
      }),
    };
    const remove = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    users.happn.services.utils.clone.returns(true);
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });
    users.groups = {};
    stubBindInEachGroup(users);
    users.getUserNoGroups = test.sinon.stub().callsFake((_, callback) => {
      callback(new Error('mockError'), null);
    });

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly(
        '/_SYSTEM/_SECURITY/_USER/mockusername',
        {},
        test.sinon.match.func
      );
    test.chai
      .expect(mockSecurityService.checkOverwrite)
      .to.have.been.calledWithExactly(
        'user',
        { username: 'mockusername', name: 'mockName', permissions: {} },
        '/_SYSTEM/_SECURITY/_USER/mockusername',
        'mockusername',
        {},
        test.sinon.match.func
      );
    test.chai
      .expect(users.getUserNoGroups)
      .to.have.been.calledWithExactly('mockusername', test.sinon.match.func);

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - obj.username is falsy. Callback function returns callback() with new error.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: '', name: 'mockName' };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'validation failure: no username specified'))
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - obj.username.indexOf is greater -1 and returns callback with new error.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: 'mockUsername::nogroups', name: 'mockName' };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(
            test.sinon.match.has(
              'message',
              "validation failure: username cannot contain the ':nogroups' directive"
            )
          )
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __validate - obj.username is _ANONYMOUS and returns callback with new error.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = { username: '_ANONYMOUS', name: 'mockName' };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });
    const stubGet = test.sinon.stub().callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });

    mockConfig.usernamesCaseInsensitiveExclude = ['_ANONYMOUS'];
    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(
            test.sinon.match.has(
              'message',
              'validation failure: username cannot be reserved name _ANONYMOUS'
            )
          )
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getPasswordHas - return callback when hash is truthy.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });

    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const get = test.sinon.stub().returns('mockHash');
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ get: get });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getPasswordHash(mockUsername, mockCallBackTwo);

    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, 'mockHash');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getPasswordHas - calls this.dataService.get and returns callback with error.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });

    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const get = test.sinon.stub().returns(null);
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ get: get });
    const stubGetData = users.happn.services.data.get.callsFake((_, callback) => {
      const mockError = new Error('mockError');
      callback(mockError, null);
    });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getPasswordHash(mockUsername, mockCallBackTwo);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly(
        '/_SYSTEM/_SECURITY/_USER/mockUsername',
        test.sinon.match.func
      );
    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getPasswordHas - calls this.dataService.get and returns callback with new error if user is falsy.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });

    const mockUsername = null;
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const get = test.sinon.stub().returns(null);
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ get: get });
    const stubGetData = users.happn.services.data.get.callsFake((_, callback) => {
      callback(null, null);
    });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getPasswordHash(mockUsername, mockCallBackTwo);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_USER/null', test.sinon.match.func);
    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match
          .instanceOf(Error)
          .and(test.sinon.match.has('message', 'null does not exist in the system'))
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getPasswordHas - calls this.dataService.get and calls this.__cache_passwords.set if user is truthy.', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });

    const mockUsername = null;
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      checkOverwrite: test.sinon.stub(),
    };
    const get = test.sinon.stub().returns(null);
    const set = test.sinon.stub().returns(null);
    const userChanged = test.sinon.stub();
    const stubCreatePermissions = test.sinon.stub(PermissionsManager, 'create').returns(null);
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ get: get, set: set });
    const stubGetData = users.happn.services.data.get.callsFake((_, callback) => {
      callback(null, { data: { username: 'mockUsername', password: 'mockPassword' } });
    });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getPasswordHash(mockUsername, mockCallBackTwo);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_USER/null', test.sinon.match.func);
    test.chai.expect(set).to.have.been.calledWithExactly('mockUsername', 'mockPassword');
    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, 'mockPassword');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __prepareUserForUpsert - promise resolved if !user.password is falsy.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: null,
    };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      serialize: test.sinon.stub().returns({ username: 'mockUsername' }),
      checkOverwrite: test.sinon.stub().callsFake((_, __, ___, ____, _____, callback) => {
        callback();
      }),
      dataChanged: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const get = test.sinon.stub();
    const has = test.sinon.stub().returns(true);
    const userChanged = test.sinon.stub();
    const stubUpsert = test.sinon.stub().returns('mockResult');
    const stubUpsertMultiplePermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertMultiplePermissions: stubUpsertMultiplePermissions });

    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove, get: get, has: has });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });
    const stubUpsertData = users.happn.services.data.upsert.returns('mockResult');
    const stubClone = users.happn.services.utils.clone.returns({
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: null,
    });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(stubUpsertData).to.have.been.calledWithExactly(
      '/_SYSTEM/_SECURITY/_USER/mockUsername',
      {
        username: 'mockUsername',
        name: 'mockName',
        password: null,
      },
      { merge: true }
    );
    test.chai.expect(stubClone).to.have.been.calledWithExactly({});
    test.chai
      .expect(mockSecurityService.serialize)
      .to.have.been.calledWithExactly('user', 'mockResult');
    test.chai.expect(mockSecurityService.dataChanged).to.have.been.calledWithExactly(
      'upsert-user',
      {
        username: 'mockUsername',
        permissions: { username: 'mockUsername', name: 'mockName', password: null },
      },
      {
        username: 'mockusername',
        name: 'mockName',
        permissions: {},
        password: null,
      }
    );
    test.chai
      .expect(stubUpsertMultiplePermissions)
      .to.have.been.calledWithExactly('mockUsername', {
        username: 'mockUsername',
        name: 'mockName',
        password: null,
      });

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __prepareUserForUpsert - calls this.cryptoService.generateHash if user.password is truthy and resolves promise.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      serialize: test.sinon.stub().returns({ username: 'mockUsername' }),
      checkOverwrite: test.sinon.stub().callsFake((_, __, ___, ____, _____, callback) => {
        callback();
      }),
      dataChanged: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const get = test.sinon.stub();
    const has = test.sinon.stub().returns(true);
    const userChanged = test.sinon.stub();
    const stubUpsertMultiplePermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertMultiplePermissions: stubUpsertMultiplePermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });
    const stubGet = test.sinon.stub().callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove, get: get, has: has });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });
    const stubUpsertData = users.happn.services.data.upsert.returns('mockResult');
    const stubClone = users.happn.services.utils.clone.returns({
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: null,
    });
    const stubGenerateHash = users.happn.services.crypto.generateHash.callsFake(
      (_, __, callback) => {
        callback(null, null);
      }
    );

    users.groups = {};
    stubBindInEachGroup(users);
    mockConfig.pbkdf2Iterations = null;

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(stubGenerateHash)
      .to.have.been.calledWithExactly('mockPassword', null, test.sinon.match.func);
    test.chai.expect(stubUpsertData).to.have.been.calledWithExactly(
      '/_SYSTEM/_SECURITY/_USER/mockUsername',
      {
        username: 'mockUsername',
        name: 'mockName',
        password: null,
      },
      { merge: true }
    );
    test.chai.expect(stubClone).to.have.been.calledWithExactly({});
    test.chai
      .expect(mockSecurityService.serialize)
      .to.have.been.calledWithExactly('user', 'mockResult');
    test.chai.expect(mockSecurityService.dataChanged).to.have.been.calledWithExactly(
      'upsert-user',
      {
        username: 'mockUsername',
        permissions: { username: 'mockUsername', name: 'mockName', password: null },
      },
      {
        username: 'mockusername',
        name: 'mockName',
        permissions: {},
        password: 'mockPassword',
      }
    );
    test.chai
      .expect(stubUpsertMultiplePermissions)
      .to.have.been.calledWithExactly('mockUsername', {
        username: 'mockUsername',
        name: 'mockName',
        password: null,
      });

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests __prepareUserForUpsert - calls this.cryptoService.generateHash if user.password is falsy and rejects promise.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    };
    const mockOptions = {};
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {
      validateName: test.sinon.stub(),
      serialize: test.sinon.stub().returns({ username: 'mockUsername' }),
      checkOverwrite: test.sinon.stub().callsFake((_, __, ___, ____, _____, callback) => {
        callback();
      }),
      dataChanged: test.sinon.stub(),
    };
    const remove = test.sinon.stub();
    const get = test.sinon.stub();
    const has = test.sinon.stub().returns(true);
    const userChanged = test.sinon.stub();
    const stubUpsertMultiplePermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertMultiplePermissions: stubUpsertMultiplePermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns({ userChanged });

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove, get: get, has: has });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(null, 'mockResult');
    });
    const stubUpsertData = users.happn.services.data.upsert.returns('mockResult');
    const stubClone = users.happn.services.utils.clone.returns({
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: null,
    });
    const stubGenerateHash = users.happn.services.crypto.generateHash.callsFake(
      (_, __, callback) => {
        callback('mockUser', null);
      }
    );
    users.groups = {};
    stubBindInEachGroup(users);
    mockConfig.pbkdf2Iterations = null;

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertUser(mockUser, mockOptions, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(stubGenerateHash)
      .to.have.been.calledWithExactly('mockPassword', null, test.sinon.match.func);

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('test upsertPermissions -  calls this.permissionManager.upsertMultiplePermissions, this.securityService.dataChanged and callback', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    };
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const dataChanged = test.sinon.stub();
    const mockSecurityService = {
      dataChanged: dataChanged,
    };
    const stubUpsertMultiplePermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertMultiplePermissions: stubUpsertMultiplePermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns();

    users.happn = mockHappn;
    users.happn.services.cache.create.returns();
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertPermissions(mockUser, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    });
    test.chai
      .expect(stubUpsertMultiplePermissions)
      .to.have.been.calledWithExactly('mockUsername', {});
    test.chai.expect(dataChanged).to.have.been.calledWithExactly('upsert-user', {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    });
    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('test upsertPermissions - this.securityService.dataChanged throws error and calls callback with error.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    };
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const dataChanged = test.sinon.stub().throws(new Error('mockError'));
    const mockSecurityService = {
      dataChanged: dataChanged,
    };
    const stubUpsertMultiplePermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertMultiplePermissions: stubUpsertMultiplePermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns();

    users.happn = mockHappn;
    users.happn.services.cache.create.returns();
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    const result = users.upsertPermissions(mockUser, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    await test.chai.expect(result).to.eventually.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests deleteUser calls this.log.error if there is an error in the callback function of this.securityService.dataChanged', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {
      username: 'mockUsername',
      name: 'mockName',
      permissions: {},
      password: 'mockPassword',
    };
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const dataChanged = test.sinon.stub().callsFake((_, __, ___, callback) => {
      callback(new Error('mockError'));
    });
    const mockSecurityService = {
      dataChanged: dataChanged,
    };
    const stubRemoveAllUserPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ removeAllUserPermissions: stubRemoveAllUserPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns();
    const remove = test.sinon.stub();

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ remove: remove });
    const stubRemoveData = users.happn.services.data.remove.returns({});
    users.groups = {};
    stubBindInEachGroup(users);
    users.log = {
      error: test.sinon.stub(),
      debug: test.sinon.stub(),
    };

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    const result = users.deleteUser(mockUser, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(users.log.error)
      .to.have.been.calledWithExactly(`user delete failure to propagate event: mockError`);
    test.chai
      .expect(users.log.debug)
      .to.have.been.calledWithExactly(`user deleted: mockUsername`);
    test.chai
      .expect(dataChanged)
      .to.have.been.calledWithExactly(
        'delete-user',
        { obj: {}, tree: {} },
        null,
        test.sinon.match.func
      );
    test.chai.expect(remove).to.have.callCount(2);
    test.chai.expect(stubRemoveData).to.have.callCount(2);
    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, { obj: {}, tree: {} });
    await test.chai.expect(result).to.eventually.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getUser - calls this.getUserNoGroups and returns callback if options.includeGroups equals false.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');
    const has = test.sinon.stub().returns(true);
    const get = test.sinon.stub().returns({});
    const mockOptions = { includeGroups: false };

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ has: has, get: get });
    users.groups = {};
    stubBindInEachGroup(users);
    users.log = {
      error: test.sinon.stub(),
      debug: test.sinon.stub(),
    };

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getUser(mockUsername, mockOptions, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, {});
    test.chai.expect(get).to.have.been.calledWithExactly('mockusername');
    test.chai.expect(has).to.have.been.calledWithExactly('mockusername');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests getUser - calls this.getUserNoGroups and returns callback if options.includeGroups true.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');
    const has = test.sinon.stub().returns(true);
    const get = test.sinon.stub().returns({ username: 'mockUsername' });
    const mockOptions = { includeGroups: true };

    users.happn = mockHappn;
    users.happn.services.cache.create.returns({ has: has, get: get });
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      const mockError = new Error('mockError');
      callback(mockError, null);
    });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.getUser(mockUsername, mockOptions, mockCallBackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    test.chai.expect(get).to.have.been.calledWithExactly('mockusername');
    test.chai.expect(stubGetData).to.have.been.calledWithExactly(
      `/_SYSTEM/_SECURITY/_USER/mockUsername/_USER_GROUP/*`,
      {
        sort: {
          path: 1,
        },
      },
      test.sinon.match.func
    );
    test.chai.expect(has).to.have.been.calledWithExactly('mockusername');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listUser - add * to preparedUserName and adds more properties to searchParameters. Then calls this.dataService.count and calls callback with error.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');
    const mockOptions = { sort: {}, limit: {}, skip: {}, collation: {}, count: {} };

    users.happn = mockHappn;
    const stubCountData = users.happn.services.data.count.callsFake((_, __, callback) => {
      callback(new Error('mockError'), null);
    });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    const result = users.listUsers(mockUsername, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockCallBackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    test.chai.expect(stubCountData).to.have.been.calledWithExactly(
      '/_SYSTEM/_SECURITY/_USER/mockusername*',
      {
        criteria: { $and: [test.sinon.match.instanceOf(Object)] },
        sort: {},
        options: { limit: {}, skip: {}, collation: {} },
      },
      test.sinon.match.func
    );
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listUser - add * to preparedUserName and adds more properties to searchParameters. Then calls this.dataService.count and calls callback.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');
    const mockOptions = { sort: {}, limit: {}, skip: {}, collation: {}, count: {} };

    users.happn = mockHappn;
    const stubCountData = users.happn.services.data.count.callsFake((_, __, callback) => {
      callback(null, { data: 'mockData' });
    });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    const result = users.listUsers(mockUsername, mockOptions, mockCallBackTwo);

    test.chai.expect(mockCallBackTwo).to.have.been.calledWithExactly(null, 'mockData');
    test.chai.expect(stubCountData).to.have.been.calledWithExactly(
      '/_SYSTEM/_SECURITY/_USER/mockusername*',
      {
        criteria: { $and: [test.sinon.match.instanceOf(Object)] },
        sort: {},
        options: { limit: {}, skip: {}, collation: {} },
      },
      test.sinon.match.func
    );
    test.chai.expect(result).to.be.undefined;

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listUser - calls this.dataService.get if options.count is falsy and calls callback with error.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = test.sinon.stub();
    const mockCallbackOne = test.sinon.stub();
    const mockCallBackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');
    const mockOptions = { sort: {}, limit: {}, skip: {}, collation: {}, count: null };

    users.happn = mockHappn;
    const stubGetData = users.happn.services.data.get.callsFake((_, __, callback) => {
      callback(new Error('mockError'), null);
    });
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.listUsers(mockUsername, mockOptions, mockCallBackTwo);

    test.chai
      .expect(mockUsername)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );
    test.chai.expect(stubGetData).to.have.been.calledWithExactly(
      '/_SYSTEM/_SECURITY/_USER/*',
      {
        criteria: { $and: [test.sinon.match.instanceOf(Object)] },
        sort: undefined,
        options: {},
      },
      test.sinon.match.func
    );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listUserNamesByGroup - calls this.dataService.get if groupName has "*" . Promise is resolved.', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockGroupName = 'mockGroupName*';
    const mockCallbackOne = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create').returns();
    const stubGet = test.sinon.stub().resolves(null);

    users.happn = mockHappn;
    const stubGetData = users.happn.services.data.get.resolves(null);
    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    const result = users.listUserNamesByGroup(mockGroupName);

    test.chai
      .expect(stubGetData)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_USER/*/_USER_GROUP/mockGroupName*', {
        path_only: true,
      });
    await test.chai.expect(result).to.eventually.eql([]);

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listUsersByGroup - calls this.dataService.get and returns callback', async () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const groupName = 'mockGroupName*';
    const options = null;
    const mockCallbackOne = test.sinon.stub();
    const mockCallbackTwo = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');

    users.happn = mockHappn;
    const stubGetData = users.happn.services.data.get;
    stubGetData.onCall(0).resolves({
      paths: [
        {
          _meta: {
            path: '/_SYSTEM/_SECURITY/_USER/mockUser/_USER_GROUP/',
          },
        },
      ],
    });
    stubGetData.onCall(1).callsFake((_, __, callback) => {
      callback(new Error('mockError'));
    });

    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.listUsersByGroup(groupName, options, mockCallbackTwo);

    await require('node:timers/promises').setTimeout(50);

    test.chai.expect(stubGetData).to.have.callCount(2);
    test.chai
      .expect(stubGetData.args[0])
      .to.eql(['/_SYSTEM/_SECURITY/_USER/*/_USER_GROUP/mockGroupName*', { path_only: true }]);
    test.chai
      .expect(mockCallbackTwo)
      .to.have.been.calledWithExactly(
        test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
      );

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests listPermissions', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockCallbackOne = test.sinon.stub();
    const mockSecurityService = {};
    const stubListPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ listPermissions: stubListPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');

    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.listPermissions(mockUsername);

    test.chai.expect(stubListPermissions).to.have.been.calledWithExactly('mockUsername');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests attachPermissions', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUser = {};
    const mockCallbackOne = test.sinon.stub();
    const mockSecurityService = {};
    const stubAttachPermissions = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ attachPermissions: stubAttachPermissions });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');

    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.attachPermissions(mockUser);

    test.chai.expect(stubAttachPermissions).to.have.been.calledWithExactly({});

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests removePermission', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockPath = {};
    const mockAction = '/mockPath/';
    const mockCallbackOne = test.sinon.stub();
    const mockSecurityService = {};
    const stubRemovePermission = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ removePermission: stubRemovePermission });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');

    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.removePermission(mockUsername, mockPath, mockAction);

    test.chai
      .expect(stubRemovePermission)
      .to.have.been.calledWithExactly('mockUsername', {}, '/mockPath/');

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });

  it('tests upsertPermission', () => {
    const users = new SecurityUsers({
      logger: Logger,
    });
    const mockUsername = 'mockUsername';
    const mockPath = {};
    const mockAction = '/mockPath/';
    const mockAuthorized = true;
    const mockCallbackOne = test.sinon.stub();
    const mockSecurityService = {};
    const stubUpsertPermission = test.sinon.stub();
    const stubCreatePermissions = test.sinon
      .stub(PermissionsManager, 'create')
      .returns({ upsertPermission: stubUpsertPermission });
    const stubCreateGroup = test.sinon.stub(UsersByGroupCache, 'create');

    users.groups = {};
    stubBindInEachGroup(users);

    users.initialize(mockConfig, mockSecurityService, mockCallbackOne);
    users.upsertPermission(mockUsername, mockPath, mockAction, mockAuthorized);

    test.chai
      .expect(stubUpsertPermission)
      .to.have.been.calledWithExactly('mockUsername', {}, '/mockPath/', true);

    stubCreateGroup.restore();
    stubCreatePermissions.restore();
  });