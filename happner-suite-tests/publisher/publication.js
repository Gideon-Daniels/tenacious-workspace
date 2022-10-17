const Publication = require("../../../lib/services/publisher/publication");
let mockHappn;
let mockMessage;
let mockOptions;
beforeEach(() => {
  mockHappn = {
    services: {
      subscription: {
        getFilteredRecipients: test.sinon.stub(),
      },
      protocol: {
        processMessageOut: test.sinon.stub(),
      },
    },
  };
  mockMessage = {
    protocol: {},
    recipients: [{ data: { session: { id: 1 } } }],
    session: { id: 1, user: { username: null } },
    response: {
      _meta: {
        published: {},
        publishError: {},
        publishResults: {},
        created: {},
        modified: {},
      },
      data: {},
    },
    request: {
      options: {
        consistency: null,
        publishResults: null,
        noCluster: null,
      },
      path: "/mockPath/*",
      action: "mockAction",
      eventId: 1,
      data: {},
    },
  };
  mockOptions = {
    acknowledgeTimeout: 100,
  };
});

afterEach(() => {
  mockHappn = null;
  mockMessage = null;
  mockOptions = null;
});

it("tests Publication - this.options.consistency is equal to CONSTANTS.CONSISTENCY.ACKNOWLEDGED and message.recipients is truthy.", () => {
  mockMessage.request.options.consistency = CONSTANTS.CONSISTENCY.ACKNOWLEDGED;
  const publication = new Publication(mockMessage, {}, mockHappn);

  test.chai.expect(publication.result.acknowledged).to.equal(0);
  test.chai.expect(publication.result.queued).to.equal(1);
  test.chai.expect(publication.unacknowledged_recipients).to.eql([]);
  test.chai.expect(publication.options.publishResults).to.be.true;
});

it("tests Publication - options is equal to null and this.options.consistency is equal to null.", () => {
  mockMessage.request.options = null;
  const publication = new Publication(mockMessage, null, mockHappn);

  test.chai.expect(publication.publication_options).to.eql({
    acknowledgeTimeout: 60000,
  });

  test.chai.expect(publication.options.consistency).to.equal(2);
  test.chai.expect(publication.result.queued).to.equal(1);
});

it("tests __configurePayload - this.origin && this.origin.user is truthy.", () => {
  mockMessage.session.user.username = "mockUsername";
  const publication = new Publication(mockMessage, null, mockHappn);

  test.chai.expect(publication.payload).to.eql({
    __outbound: true,
    _meta: {
      action: "/MOCKACTION@/mockPath/*",
      consistency: 2,
      created: {},
      eventOrigin: {
        id: 1,
        username: "mockUsername",
      },
      modified: {},
      path: "/mockPath/*",
      publicationId: "1-1",
      sessionId: 1,
      type: "data",
    },
    data: {},
    protocol: {},
  });
});

it("tests __configurePayload - checks if the items in __reservedMetaKeys is similar to the keys in message.request.options.meta and returns.", () => {
  mockMessage.request.options.meta = {};
  mockMessage.session.user.username = "mockUsername";
  mockMessage.request.options.meta = { created: "mockCreated" };

  const publication = new Publication(mockMessage, null, mockHappn);

  test.chai.expect(publication.payload).to.eql({
    __outbound: true,
    _meta: {
      action: "/MOCKACTION@/mockPath/*",
      consistency: 2,
      created: {},
      eventOrigin: {
        id: 1,
        username: "mockUsername",
      },
      modified: {},
      path: "/mockPath/*",
      publicationId: "1-1",
      sessionId: 1,
      type: "data",
    },
    data: {},
    protocol: {},
  });
});

it("tests publish method - calls two callback functions .First callback increments this.skipped and second callback returns callback with error.", async () => {
  mockMessage.request.options.consistency = CONSTANTS.CONSISTENCY.ACKNOWLEDGED;
  mockMessage.request.options.noCluster = true;

  const publication = new Publication(mockMessage, null, mockHappn);

  const mockCallback = test.sinon.stub();
  const mockRecipientCB = test.sinon.stub();
  const stubEachLimit = test.sinon
    .stub(async, "eachLimit")
    .callsFake((_, __, cbOne, cbTwo) => {
      cbOne(
        {
          data: {
            action: "mockAction",
            path: "/mockPath/",
            session: {
              id: 1,
              info: {
                clusterName: "mockClusterName",
              },
            },
            options: { merge: true },
          },
        },
        mockRecipientCB
      );
      cbTwo(new Error("mockError"));
    });

  publication.publish(mockCallback);

  await require("node:timers/promises").setTimeout(50);

  test.chai
    .expect(mockCallback)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError"))
    );
  test.chai.expect(mockRecipientCB).to.have.callCount(1);
  stubEachLimit.restore();
});

it("tests publish method - calls two callback functions .First callback calls getRecipientMessage and returns recipientCB(). Second Callback returns callback with error.", async () => {
  mockMessage.request.options.consistency = CONSTANTS.CONSISTENCY.ACKNOWLEDGED;

  const publication = new Publication(mockMessage, null, mockHappn);

  const mockCallback = test.sinon.stub();
  const mockRecipientCB = test.sinon.stub();
  const stubEachLimit = test.sinon
    .stub(async, "eachLimit")
    .callsFake((_, __, cbOne, cbTwo) => {
      cbOne(
        {
          data: {
            action: "mockAction",
            path: "/mockPath/",
            session: {
              id: 1,
              info: {
                clusterName: "mockClusterName",
              },
            },
            options: { merge: true },
          },
        },
        mockRecipientCB
      );
      cbTwo(new Error("mockError"));
    });
  publication.duplicate_channels = { "1/mockAction@/mockPath/": true };
  publication.publish(mockCallback);

  await require("node:timers/promises").setTimeout(50);

  test.chai
    .expect(mockCallback)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError"))
    );
  test.chai.expect(mockRecipientCB).to.have.callCount(1);
  stubEachLimit.restore();
});

it("tests publish method -  this.result.failed is incremented and returns callback with this.result.lastError.", async () => {
  mockMessage.request.options.consistency = CONSTANTS.CONSISTENCY.ACKNOWLEDGED;
  mockHappn.services.protocol.processMessageOut.callsFake((_, cb) => {
    cb(new Error("mockError"));
  });

  const publication = new Publication(mockMessage, null, mockHappn);

  const mockCallback = test.sinon.stub();
  const mockRecipientCB = test.sinon.stub();
  const stubEachLimit = test.sinon
    .stub(async, "eachLimit")
    .callsFake((_, __, cbOne, cbTwo) => {
      cbOne(
        {
          data: {
            action: "mockAction",
            path: "/mockPath/",
            session: {
              id: 1,
              info: {
                clusterName: "mockClusterName",
              },
            },
            options: { merge: true },
          },
        },
        mockRecipientCB
      );
      cbTwo(null);
    });
  publication.publish(mockCallback);

  await require("node:timers/promises").setTimeout(50);

  test.chai
    .expect(mockCallback)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "mockError"))
    );
  test.chai.expect(mockRecipientCB).to.have.callCount(1);

  stubEachLimit.restore();
});

it("tests publish method - calls done method if  this.recipients.length is falsy. Calls __waitForAck if his.options.consistency is strictly equal to CONSTANTS.CONSISTENCY.ACKNOWLEDGED.", async () => {
  mockMessage.request.options.consistency = CONSTANTS.CONSISTENCY.ACKNOWLEDGED;
  mockMessage.recipients.length = null;

  const publication = new Publication(mockMessage, mockOptions, mockHappn);
  const mockCallback = test.sinon.stub();

  publication.publish(mockCallback);

  await require("node:timers/promises").setTimeout(500);

  test.chai
    .expect(mockCallback)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "unacknowledged publication")),
      {
        successful: 0,
        failed: 0,
        skipped: 0,
        acknowledged: 0,
        queued: 0,
      }
    );
});

it("tests publish method -  this.result is equal to this.message.response._meta.publishResults if this.options.publishResults is truthy and callback is called.", async () => {
  mockMessage.recipients.length = null;
  mockMessage.request.options.publishResults = true;

  const publication = new Publication(mockMessage, mockOptions, mockHappn);
  const mockCallback = test.sinon.stub();

  publication.publish(mockCallback);

  await require("node:timers/promises").setTimeout(500);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
    successful: 0,
    failed: 0,
    skipped: 0,
    queued: 0,
  });
});

it("tests publish method - this.options.publishResults is falsy and callback is called.", async () => {
  mockMessage.recipients.length = null;

  const publication = new Publication(mockMessage, mockOptions, mockHappn);
  const mockCallback = test.sinon.stub();

  publication.publish(mockCallback);

  await require("node:timers/promises").setTimeout(500);

  test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, {
    successful: 0,
    failed: 0,
    skipped: 0,
    queued: 0,
  });
});

it("tests publish - this.result.successful is incremented and __waitForAck is called.", async () => {
  mockMessage.request.options.consistency = CONSTANTS.CONSISTENCY.ACKNOWLEDGED;
  mockHappn.services.protocol.processMessageOut.callsFake((_, cb) => {
    cb(null);
  });

  const publication = new Publication(mockMessage, mockOptions, mockHappn);
  const mockCallback = test.sinon.stub();
  const mockRecipientCB = test.sinon.stub();
  const stubEachLimit = test.sinon
    .stub(async, "eachLimit")
    .callsFake((_, __, cbOne, cbTwo) => {
      cbOne(
        {
          data: {
            action: "mockAction",
            path: "/mockPath/",
            session: {
              id: 1,
              info: {
                clusterName: "mockClusterName",
              },
            },
            options: { merge: false, depth: 1 },
          },
        },
        mockRecipientCB
      );
      cbTwo(null);
    });
  publication.publish(mockCallback);

  await require("node:timers/promises").setTimeout(500);

  test.chai
    .expect(mockCallback)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "unacknowledged publication")),
      { successful: 1, failed: 0, skipped: 0, acknowledged: 0, queued: 1 }
    );
  test.chai
    .expect(stubEachLimit)
    .to.have.been.calledWithExactly(
      [{ data: { session: { id: 1 } } }],
      100,
      test.sinon.match.func,
      test.sinon.match.func
    );
  test.chai
    .expect(mockHappn.services.protocol.processMessageOut)
    .to.have.been.calledWithExactly(
      {
        request: {
          publication: {
            data: {},
            _meta: test.sinon.match(Object),
            protocol: {},
            __outbound: true,
          },
          options: { merge: false, depth: 1 },
          action: "emit",
        },
        session: { id: 1, info: { clusterName: "mockClusterName" } },
      },
      test.sinon.match.func
    );

  stubEachLimit.restore();
});

it("tests resultsMessage with new error.", async () => {
  const publication = new Publication(mockMessage, mockOptions, mockHappn);
  const mockError = new Error("mockError");
  const result = publication.resultsMessage(mockError);

  test.chai.expect(result).to.eql({
    request: {
      publication: {
        error: "mockError",
        id: "1-1",
        action: "publication-ack",
        result: { successful: 0, failed: 0, skipped: 0, queued: 1 },
        status: "error",
        _meta: {
          type: "ack",
          eventId: 1,
        },
      },
    },
    session: { id: 1, user: { username: null } },
  });
});

it("tests resultsMessage with no error.", async () => {
  const publication = new Publication(mockMessage, mockOptions, mockHappn);
  const mockError = null;
  const result = publication.resultsMessage(mockError);

  test.chai.expect(result).to.eql({
    request: {
      publication: {
        id: "1-1",
        action: "publication-ack",
        result: { successful: 0, failed: 0, skipped: 0, queued: 1 },
        status: "ok",
        _meta: {
          type: "ack",
          eventId: 1,
        },
      },
    },
    session: { id: 1, user: { username: null } },
  });
});

it("tests acknowledge - removes unackowledged recipients,this.result.acknowledged is incremented and callback function in every() returns false.", async () => {
  mockMessage.request.options.consistency = CONSTANTS.CONSISTENCY.ACKNOWLEDGED;
  mockHappn.services.protocol.processMessageOut.callsFake((_, cb) => {
    cb(null);
  });

  const publication = new Publication(mockMessage, mockOptions, mockHappn);
  const mockCallback = test.sinon.stub();
  const mockRecipientCB = test.sinon.stub();
  const stubEachLimit = test.sinon
    .stub(async, "eachLimit")
    .callsFake((_, __, cbOne, cbTwo) => {
      cbOne(
        {
          data: {
            action: "mockAction",
            path: "/mockPath/",
            session: {
              id: 1,
              info: {
                clusterName: "mockClusterName",
              },
            },
            options: { merge: false, depth: 1 },
          },
        },
        mockRecipientCB
      );
      cbTwo(null);
    });

  publication.publish(mockCallback);

  await require("node:timers/promises").setTimeout(500);

  publication.acknowledge(1);

  test.chai.expect(publication.unacknowledged_recipients.length).to.equal(0);
  test.chai.expect(mockCallback).to.have.been.calledWithExactly(undefined, {
    successful: 1,
    failed: 0,
    skipped: 0,
    acknowledged: 1,
    queued: 1,
  });

  stubEachLimit.restore();
});

it("tests acknowledge -  race condition, as we may have acknowledgements already", async () => {
  mockMessage.request.options.consistency = CONSTANTS.CONSISTENCY.ACKNOWLEDGED;
  mockHappn.services.protocol.processMessageOut.callsFake((_, cb) => {
    cb(null);
  });

  const publication = new Publication(mockMessage, mockOptions, mockHappn);
  const mockCallback = test.sinon.stub();
  const mockRecipientCB = test.sinon.stub();
  const stubEachLimit = test.sinon
    .stub(async, "eachLimit")
    .callsFake((_, __, cbOne, cbTwo) => {
      cbOne(
        {
          data: {
            action: "mockAction",
            path: "/mockPath/",
            session: {
              id: 1,
              info: {
                clusterName: "mockClusterName",
              },
            },
            options: { merge: false, depth: 1 },
          },
        },
        mockRecipientCB
      );
      cbTwo(null);
    });
  publication.recipients = [[{ data: { session: { id: 1 } } }]];
  publication.acknowledge(1);

  publication.publish(mockCallback);

  await require("node:timers/promises").setTimeout(500);

  // test.chai.expect(publication.unacknowledged_recipients.length).to.equal(0);
  // test.chai.expect(mockCallback).to.have.been.calledWithExactly(undefined, {
  //   successful: 1,
  //   failed: 0,
  //   skipped: 0,
  //   acknowledged: 1,
  //   queued: 1,
  // });

  stubEachLimit.restore();
});

it("tests acknowledge - recipientSessionId is not strictly equal to sessionId and callback function in every() returns false.", async () => {
  mockMessage.request.options.consistency = CONSTANTS.CONSISTENCY.ACKNOWLEDGED;
  mockHappn.services.protocol.processMessageOut.callsFake((_, cb) => {
    cb(null);
  });

  const publication = new Publication(mockMessage, mockOptions, mockHappn);

  const mockCallback = test.sinon.stub();
  const mockRecipientCB = test.sinon.stub();
  const stubEachLimit = test.sinon
    .stub(async, "eachLimit")
    .callsFake((_, __, cbOne, cbTwo) => {
      cbOne(
        {
          data: {
            action: "mockAction",
            path: "/mockPath/",
            session: {
              id: 1,
              info: {
                clusterName: "mockClusterName",
              },
            },
            options: { merge: false, depth: 1 },
          },
        },
        mockRecipientCB
      );
      cbTwo(null);
    });

  publication.publish(mockCallback);

  await require("node:timers/promises").setTimeout(500);

  publication.acknowledge(2);

  test.chai.expect(publication.unacknowledged_recipients.length).to.equal(1);
  test.chai
    .expect(mockCallback)
    .to.have.been.calledWithExactly(
      test.sinon.match
        .instanceOf(Error)
        .and(test.sinon.match.has("message", "unacknowledged publication")),
      {
        successful: 1,
        failed: 0,
        skipped: 0,
        acknowledged: 0,
        queued: 1,
      }
    );

  stubEachLimit.restore();
});

it("tests acknowledge - this.__onAcknowledgeComplete is falsy.", async () => {
  mockMessage.request.options.consistency = CONSTANTS.CONSISTENCY.ACKNOWLEDGED;

  const publication = new Publication(mockMessage, mockOptions, mockHappn);

  publication.acknowledge(1);
});
