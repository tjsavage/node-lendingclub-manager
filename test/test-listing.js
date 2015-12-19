var mocha = require('mocha');
var chai = require('chai');
var nock = require('nock');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

nock.disableNetConnect();

var expect = chai.expect;

var LendingclubManager = require('../index');

var TEST_URL = "http://localhost";

describe('listLoans', function() {
  describe('when not correctly authenticated', function() {
    it('should throw if investorId was never set', function(done) {
      var manager = new LendingclubManager({
        key: "key",
        baseUrl: TEST_URL
      });

      manager.listLoans().then(function(){
        throw new Error("Wasn't supposed to resolve");
      }).catch(function(err) {
        expect(err).to.not.be.null;
        expect(err).to.match(/.*investorId.*/);
        done();
      });
    });

    it('should throw if key was never set', function(done) {
      var manager = new LendingclubManager({
        investorId: "11111",
        baseUrl: TEST_URL
      });

      manager.listLoans().then(function(){
        throw new Error("Wasn't supposed to resolve");
      }).catch(function(err) {
        expect(err).to.not.be.null;
        expect(err).to.match(/.*key.*/);
        done();
      });
    });
  })

  describe('when correctly authenticated', function() {
    var manager;
    beforeEach(function() {
      manager = new LendingclubManager({
        key: "key",
        baseUrl: TEST_URL,
        investorId: "11111"
      });
    });

    it('should work if investorId was set in constructor', function() {
      var scope = nock(TEST_URL)
        .get("/loans/listing?showAll=true")
        .replyWithFile(200, __dirname + '/responses/loans.json');

      return expect(manager.listLoans()).to.eventually.satisfy(function(results) {
        return scope.isDone() && results[0].id == 111111 && results.length == 1;
      });

    });

    it('should correctly pass along showAll being false', function() {
      var scope = nock(TEST_URL)
        .get("/loans/listing?showAll=false")
        .replyWithFile(200, __dirname + '/responses/loans.json');

      return expect(manager.listLoans({ showAll: false })).to.eventually.satisfy(function(results) {
        return scope.isDone() && results[0].id == 111111 && results.length == 1;
      });
    })

    it('should correctly throw if server responds with error', function() {
      var scope = nock(TEST_URL)
        .get("/loans/listing?showAll=false")
        .reply(404);

      return expect(manager.listLoans({ showAll: false })).to.eventually.be.rejected;
    })

  });
})
