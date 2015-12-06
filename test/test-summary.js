var mocha = require('mocha');
var chai = require('chai');
var nock = require('nock');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

nock.disableNetConnect();

var expect = chai.expect;

var LendingclubManager = require('../index');

var TEST_URL = "http://localhost";

describe('summary', function() {
  describe('when not authenticated', function() {
    it('should throw if investorId was never set', function() {
      var manager = new LendingclubManager({
        key: "key",
        baseUrl: TEST_URL
      });

      return expect(manager.summary()).to.eventually.be.rejectedWith(/.*investorId.*/);
    });

    it('should throw if key was never set', function() {
      var manager = new LendingclubManager({
        investorId: "11111",
        baseUrl: TEST_URL
      });

      return expect(manager.summary()).to.eventually.be.rejectedWith(/key/);
    });
  });

  describe('when correctly authenticated', function() {
    var manager;
    beforeEach(function() {
      manager = new LendingclubManager({
        key: "key",
        baseUrl: TEST_URL,
        investorId: "11111"
      });
    });

    it('should correctly return the summary', function() {
      var scope = nock(TEST_URL)
        .get('/accounts/11111/summary')
        .replyWithFile(200, __dirname + '/responses/summary.json')

      return expect(manager.summary()).to.eventually.include.keys('infundingBalance')
    });
  });
});
