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
          .post("/accounts/111111/portfolios", {
            aid: 111111,
            portfolioName: "A",
            portfolioDescription: "B"
          })
          .reply(400, {
          	"errors":[
          	{
          		"field":" arg1.portfolioName",
          		"code":"validation-error",
          		"message":"Portfolio name not present."
          	}]
          });

          var manager = new LendingclubManager({
            investorId: "111111",
            baseUrl: TEST_URL,
            key: "key"
          });

        return expect(manager.createPortfolio("A", "B")).to.be.rejected;
      })
    });

    describe('when authenticated', function() {
      var manager;

      beforeEach(function() {
        manager = new LendingclubManager({
          key: "key",
          baseUrl: TEST_URL,
          investorId: "111111"
        });
      });

      it('should reject if not given a portfolioName', function() {
        return expect(manager.createPortfolio()).to.be.rejectedWith(/portfolioName/);
      });

      it('should successfully create and resolve to a portfolio', function() {
        var scope = nock(TEST_URL)
          .post("/accounts/111111/portfolios", {
            aid: 111111,
            portfolioName: "A",
            portfolioDescription: "B"
          })
          .reply(200, {
          	"portfolioId":22222,
          	"portfolioName":"A",
          	"portfolioDescription":"B"
          });

        var portfolioPromise = manager.createPortfolio("A", "B");

        return Promise.all([
          expect(portfolioPromise).to.eventually.deep.equal({
          	"portfolioId":22222,
          	"portfolioName":"A",
          	"portfolioDescription":"B"
          }),
          expect(portfolioPromise.then(function() {
            return scope.isDone();
          })).to.eventually.be.true
        ])
      });

      it('should successfully create and resolve to a portfolio when missing a description', function() {
        var scope = nock(TEST_URL)
          .post("/accounts/111111/portfolios", {
            aid: 111111,
            portfolioName: "A"
          })
          .reply(200, {
          	"portfolioId":22222,
          	"portfolioName":"A"
          });

        var portfolioPromise = manager.createPortfolio("A");

        return Promise.all([
          expect(portfolioPromise).to.eventually.deep.equal({
          	"portfolioId":22222,
          	"portfolioName":"A"
          }),
          expect(portfolioPromise.then(function() {
            return scope.isDone();
          })).to.eventually.be.true
        ])
      })
    })
  })
})
