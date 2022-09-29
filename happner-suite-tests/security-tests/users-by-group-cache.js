
  it('tests clear method', async () => {
    const stubClear = test.sinon.stub();
    const stubCreateCacheService = {
      create: test.sinon.stub().returns({ clear: stubClear }),
    };
    const usersByGroupCache = UsersByGroupCache.create(stubCreateCacheService, {
      max: 5,
    });

    usersByGroupCache.clear();

    test.chai.expect(stubClear).to.have.callCount(1);
  });

  it('tests userChanged returns if this.__mappings[username] is falsy', async () => {
    const usersByGroupCache = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });
    const mockUserName = 'mockUserName';

    const result = usersByGroupCache.userChanged(mockUserName);

    test.chai.expect(result).to.be.undefined;
  });

  it('tests removeMappings - check if this.__mappings[username] is falsy', async () => {
    const usersByGroupCache = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });
    const mockResult = {
      data: ['username'],
    };
    const mockGroupName = 'mockGroupName';

    usersByGroupCache.removeMappings(mockResult, mockGroupName);

    test.chai.expect(usersByGroupCache.__mappings).to.be.eql({});
  });