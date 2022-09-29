
 it('tests attachPermissions - checks if permission.authorized is not a boolean and returns', async () => {
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
    },
    data: 'mockData',
  };
  const mockSecurityService = {};
  const mockEntity = { username: 'mockUsername' };
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  permissions.listPermissions = test.sinon.stub().resolves([
    {
      authorized: null,
    },
  ]);

  const result = permissions.attachPermissions(mockEntity);

  test.chai.expect(permissions.listPermissions).to.have.been.calledWithExactly('mockUsername');
  await test.chai.expect(result).to.eventually.eql({ username: 'mockUsername', permissions: {} });
});

it('tests attachPermissions - checks if permission.authorized is false and returns', async () => {
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
    },
    data: 'mockData',
  };
  const mockSecurityService = {};
  const mockEntity = { username: 'mockUsername' };
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  permissions.listPermissions = test.sinon.stub().resolves([
    {
      authorized: false,
      path: 'mockPath',
      action: 'mockAction',
    },
  ]);

  const result = permissions.attachPermissions(mockEntity);

  test.chai.expect(permissions.listPermissions).to.have.been.calledWithExactly('mockUsername');
  await test.chai.expect(result).to.eventually.eql({
    username: 'mockUsername',
    permissions: {
      mockPath: {
        prohibit: ['mockAction'],
      },
    },
  });
});

it('tests attachPermissions - checks if entity.permissions[permission.path] is truthy and returns', async () => {
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
    },
    data: 'mockData',
  };
  const mockSecurityService = {};
  const mockEntity = { username: 'mockUsername' };
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  permissions.listPermissions = test.sinon.stub().resolves([
    {
      authorized: false,
      path: 'mockPath',
      action: 'mockAction',
    },
    {
      authorized: false,
      path: 'mockPath',
      action: 'mockAction',
    },
  ]);

  const result = permissions.attachPermissions(mockEntity);

  test.chai.expect(permissions.listPermissions).to.have.been.calledWithExactly('mockUsername');
  await test.chai.expect(result).to.eventually.eql({
    username: 'mockUsername',
    permissions: {
      mockPath: {
        prohibit: ['mockAction', 'mockAction'],
      },
    },
  });
});

it('tests listPermissions - throws new Error', async () => {
  const mockSecurityService = {};
  const mockName = null;
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
    },
    data: 'mockData',
  };
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  const result = permissions.listPermissions(mockName);
  await test.chai.expect(result).to.eventually.rejectedWith(`please supply a mockTypeName`);
});

it('tests removePermission - promise rejected with new Error', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
    },
    data: 'mockData',
  };
  const mockName = null;
  const mockPath = 'mockPath';
  const mockAction = 'mockAction';
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  const result = permissions.removePermission(mockName, mockPath, mockAction);

  await test.chai
    .expect(result)
    .to.have.eventually.been.rejectedWith(`please supply a mockTypeName`);
});

it('tests removePermission - it calls __removePermissions. It resolves promise if stored.data is falsy.', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {
        get: test.sinon.stub().returns([{ data: null }]),
      },
    },
  };
  const mockName = 'mockName';
  const mockPath = null;
  const mockAction = null;
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  const result = permissions.removePermission(mockName, mockPath, mockAction);

  test.chai
    .expect(mockHappn.services.data.get)
    .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/mockName/*/{{w}}');
  await test.chai.expect(result).to.eventually.be.undefined;
});

it('tests removePermission - it calls __removePermissions. It resolves promise if storedData is falsy.', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {
        get: test.sinon.stub().returns(null),
      },
    },
  };
  const mockName = 'mockName';
  const mockPath = null;
  const mockAction = null;
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  const result = permissions.removePermission(mockName, mockPath, mockAction);

  test.chai
    .expect(mockHappn.services.data.get)
    .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/mockName/*/{{w}}');
  await test.chai.expect(result).to.eventually.be.undefined;
});

it('tests removePermission - it calls __removePermissions. It resolves promise if data.removed is falsy.', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {
        get: test.sinon.stub().returns({ data: 'mockData' }),
        remove: test.sinon.stub().returns({ data: { removed: false } }),
      },
    },
  };
  const mockName = 'mockName';
  const mockPath = null;
  const mockAction = null;
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  const result = permissions.removePermission(mockName, mockPath, mockAction);

  await require('timers/promises').setTimeout(50);
  test.chai
    .expect(mockHappn.services.data.get)
    .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/mockName/*/{{w}}');
  test.chai
    .expect(mockHappn.services.data.remove)
    .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/mockName/*/{{w}}');
  await test.chai.expect(result).to.eventually.eql({
    data: {
      removed: false,
    },
  });
});

it('tests upsertPermission - authorized is not null. __upsertPermission throws error.', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {
        get: test.sinon.stub().returns({ data: 'mockData' }),
        remove: test.sinon.stub().returns({ data: { removed: false } }),
      },
    },
  };
  const mockName = null;
  const mockPath = null;
  const mockAction = null;
  const mockAuthorized = false;
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  const result = permissions.upsertPermission(mockName, mockPath, mockAction, mockAuthorized);

  await test.chai
    .expect(result)
    .to.have.eventually.been.rejectedWith('please supply a mockTypeName');
});

it('tests upsertMultiplePermissions - if name is falsy it rejects promise with new error', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {},
    },
  };
  const mockName = null;
  const mockPermissions = {};

  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  const result = permissions.upsertMultiplePermissions(mockName, mockPermissions);

  await test.chai.expect(result).to.eventually.been.rejectedWith(`please supply a mockTypeName`);
});

it('tests upsertMultiplePermissions - rejects promise when permissionValidation is not equal to true.', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {},
    },
  };
  const mockName = 'mockName';
  const mockPermissions = { pathOne: { actions: null, prohibit: null } };
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  const result = permissions.upsertMultiplePermissions(mockName, mockPermissions);

  await test.chai
    .expect(result)
    .to.have.eventually.been.rejectedWith(
      'mockType permissions invalid: missing allowed actions or prohibit rules: pathOne'
    );
});

it('tests __upsertPermissions - throw new error when __validatePermissionsPath is called and returns validPath not equal to true', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {},
    },
  };
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);
  const mockName = 'mockName';
  const mockPermissionsPath = null;
  const mockActions = [{}];
  const mockAuthorized = {};

  const result = permissions.__upsertPermissions(
    mockName,
    mockPermissionsPath,
    mockActions,
    mockAuthorized
  );

  await test.chai.expect(result).to.eventually.have.rejectedWith('permission path is null');
});

it('tests __upsertPermissions - actions is falsy', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {},
    },
  };
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);
  const mockName = 'mockName';
  const mockPermissionsPath = null;
  const mockActions = null;
  const mockAuthorized = {};

  permissions.__upsertPermission = test.sinon.stub();

  const result = permissions.__upsertPermissions(
    mockName,
    mockPermissionsPath,
    mockActions,
    mockAuthorized
  );

  test.chai.expect(permissions.__upsertPermission).to.have.callCount(0);
});

it('tests __upsertPermissions - action is falsy and returns this.dataService.upsert', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {
        upsert: test.sinon.stub(),
      },
    },
  };
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);
  const mockName = 'mockName';
  const mockPermissionsPath = 'mockPath';
  const mockActions = [null];
  const mockAuthorized = {};

  const result = permissions.__upsertPermissions(
    mockName,
    mockPermissionsPath,
    mockActions,
    mockAuthorized
  );

  test.chai
    .expect(mockHappn.services.data.upsert)
    .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/mockName/*/mockPath', {
      action: '*',
      authorized: true,
      path: 'mockPath',
    });
});

it('tests __validatePermissionsPath -returns if path.indexOf returns greater then -1', async () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {},
    },
  };
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);
  const mockName = 'mockName';
  const mockPermissionsPath = '{{w}}';
  const mockActions = [{}];
  const mockAuthorized = {};

  const result = permissions.__upsertPermissions(
    mockName,
    mockPermissionsPath,
    mockActions,
    mockAuthorized
  );

  await test.chai
    .expect(result)
    .to.eventually.have.rejectedWith(
      'invalid permission path, cannot contain special string {{w}}'
    );
});

it('tests __unescapePermissionsPath', () => {
  const mockSecurityService = {};
  const mockConfig = {};
  const mockType = 'mockType';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {
        upsert: test.sinon.stub(),
      },
    },
  };
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);
  const mockPath = '{{w}}';

  permissions.__unescapePermissionsPath(mockPath);

  console.log(mockPath);
});

it('tests __getNameObj - this.type is equal to user .', async () => {
  const mockSecurityService = {
    dataChanged: test.sinon.stub().callsFake((_, __, ___, callback) => {
      callback();
    }),
  };
  const mockConfig = {};
  const mockType = 'user';
  const mockHappn = {
    services: {
      cache: {
        create: test.sinon.stub(),
      },
      data: {
        get: test.sinon.stub().returns({ data: 'mockData' }),
        remove: test.sinon.stub().returns({ data: { removed: true } }),
      },
    },
  };
  const mockName = 'mockName';
  const mockPath = null;
  const mockAction = null;
  const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

  const result = permissions.removePermission(mockName, mockPath, mockAction);

  await require('timers/promises').setTimeout(50);

  test.chai
  .expect(mockHappn.services.data.get)
  .to.have.been.calledWithExactly("/_SYSTEM/_SECURITY/_PERMISSIONS/_USER/mockName/*/{{w}}");
  test.chai
    .expect(mockHappn.services.data.remove)
    .to.have.been.calledWithExactly("/_SYSTEM/_SECURITY/_PERMISSIONS/_USER/mockName/*/{{w}}");
  await test.chai.expect(result).to.eventually.eql({
    data: {
      removed: true,
    },
  });
});
