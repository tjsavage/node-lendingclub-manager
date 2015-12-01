var mocha = require('mocha');
var chai = require('chai');
var nock = require('nock');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

nock.disableNetConnect();

var expect = chai.expect;

var LendingclubManager = require('../index');

var TEST_URL = "http://localhost";

describe('test-portfolios', function() {
  describe('createPortfolio', function() {
    describe('when not authenticated', function() {
      it('should throw if investorId was never set', function() {
        var manager = new LendingclubManager({
          key: "key",
          baseUrl: TEST_URL
        });

        return expect(manager.createPortfolio("A", "B")).to.eventually.be.rejectedWith(/.*investorId.*/);
      });

      it('should throw if key was never set', function() {
        var manager = new LendingclubManager({
          investorId: "11111",
          baseUrl: TEST_URL
        });

        return expect(manager.createPortfolio("A", "B")).to.eventually.be.rejectedWith(/key/);
      });

      it('should reject with an error when the server goes wrong', function() {
        var scope = nock(TEST_URL)
          .get("/loans/listing?showAll=true")
          .reply(400, {});

          var manager = new LendingclubManager({
            investorId: "11111",
            baseUrl: TEST_URL,
            key: "key"
          });

        return expect(manager.createPortfolio("A", "B")).to.be.rejected;
      })
    })
  })
})
