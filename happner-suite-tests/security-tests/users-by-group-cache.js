
  it('tests clear method', async () => {
    const usersByGroupCache = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });

    usersByGroupCache.__cache = {
      clear: test.sinon.stub(),
    };

    usersByGroupCache.clear();

    test.chai.expect(usersByGroupCache.__cache.clear).to.have.callCount(1);
    test.chai.expect(usersByGroupCache.__mappings).to.eql({});
  });

  it('tests userChanged returns if this.__mappings[username] is falsy', async () => {
    const usersByGroupCache = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });
    const mockUserName = 'mockUserName';

    usersByGroupCache.__mappings = {
      mockUserName: null,
    };

    const result = usersByGroupCache.userChanged(mockUserName);

    test.chai.expect(result).to.be.undefined;
  });

  it('tests removeMappings', async () => {
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