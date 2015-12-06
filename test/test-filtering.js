var mocha = require('mocha');
var chai = require('chai');
var nock = require('nock');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

nock.disableNetConnect();

var expect = chai.expect;

var LendingclubManager = require('../index');

var TEST_URL = "http://localhost";

describe('filtering', function() {
  describe('filterListedLoans', function() {
    describe('when incorrectly authenticated', function() {
      it('should throw if investorId was never set', function(done) {
        var manager = new LendingclubManager({
          key: "key",
          baseUrl: TEST_URL
        });

        manager.filterListedLoans().then(function(){
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

        manager.filterListedLoans(function(){}).then(function(){
          throw new Error("Wasn't supposed to resolve");
        }).catch(function(err) {
          expect(err).to.not.be.null;
          expect(err).to.match(/.*key.*/);
          done();
        });
      });
    });

    describe('when correctly authenticated', function() {
      var manager;
      beforeEach(function() {
        manager = new LendingclubManager({
          investorId: "111111",
          key: "key",
          baseUrl: TEST_URL
        });
      });

      it('should correctly not apply any filters if none are passed', function() {
        var scope = nock(TEST_URL)
          .get("/loans/listing?showAll=true")
          .replyWithFile(200, __dirname + '/responses/loans_long.json');

        return expect(manager.filterListedLoans()).to.eventually.have.length(5);
      });

      it('should correctly apply a simple filter not based on loan data', function() {
        var scope = nock(TEST_URL)
          .get("/loans/listing?showAll=true")
          .replyWithFile(200, __dirname + '/responses/loans_long.json');

        var count = 0;
        var onlyTwo = function() {return ++count <= 2;}
        return expect(manager.filterListedLoans(onlyTwo)).to.eventually.have.length(2);
      })

      it('should correctly apply a filter that is based on the loan data', function() {
        var scope = nock(TEST_URL)
          .get("/loans/listing?showAll=true")
          .replyWithFile(200, __dirname + '/responses/loans_long.json');

        var is36months = function(loan) {return loan.term == 36}
        return expect(manager.filterListedLoans(is36months)).to.eventually.have.length(1);
      });

      it('should correctly apply two filters', function() {
        var scope = nock(TEST_URL)
          .get("/loans/listing?showAll=true")
          .replyWithFile(200, __dirname + '/responses/loans_long.json');

        var is60months = function(loan) {return loan.term == 60}
        var makesLt90k = function(loan) {return loan.annualInc < 90000}
        return expect(manager.filterListedLoans(is60months, makesLt90k)).to.eventually.have.length(3);
      });

      it('should correctly apply a filter that returns a promise', function() {
        var scope = nock(TEST_URL)
          .get("/loans/listing?showAll=true")
          .replyWithFile(200, __dirname + '/responses/loans_long.json');

          var is36months = function(loan) {
            return new Promise(function(resolve, reject) {
              resolve(loan.term == 36);
            })
          }
          return expect(manager.filterListedLoans(is36months)).to.eventually.have.length(1);
      });

      it('should correctly apply two filters where one is a promise and the other is not', function() {
        var scope = nock(TEST_URL)
          .get("/loans/listing?showAll=true")
          .replyWithFile(200, __dirname + '/responses/loans_long.json');

          var is60months = function(loan) {
            return new Promise(function(resolve, reject) {
              resolve(loan.term == 60);
            })
          }
        var makesLt90k = function(loan) {return loan.annualInc < 90000}
        return expect(manager.filterListedLoans(is60months, makesLt90k)).to.eventually.have.length(3);
      });

      it('should correctly apply two filters where both are promises', function() {
        var scope = nock(TEST_URL)
          .get("/loans/listing?showAll=true")
          .replyWithFile(200, __dirname + '/responses/loans_long.json');

          var is60months = function(loan) {
            return new Promise(function(resolve, reject) {
              resolve(loan.term == 60);
            })
          }
        var makesLt90k = function(loan) {
          return new Promise(function(resolve, reject) {
            resolve(loan.annualInc < 90000)
          })
        }
        return expect(manager.filterListedLoans(is60months, makesLt90k)).to.eventually.have.length(3);
      })
    });
  })
})
