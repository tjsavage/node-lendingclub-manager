var mocha = require('mocha');
var chai = require('chai');
var nock = require('nock');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

nock.disableNetConnect();

var expect = chai.expect;

var LendingclubManager = require('../index');

var TEST_URL = "http://localhost";

describe('notesOwned', function() {
  describe('when not correctly authenticated', function() {
    it('should throw if investorId was never set', function() {
      var manager = new LendingclubManager({
        key: "key",
        baseUrl: TEST_URL
      });

      return expect(manager.notesOwned()).to.eventually.be.rejectedWith(/investorId/);
    });

    it('should throw if key was never set', function() {
      var manager = new LendingclubManager({
        investorId: "11111",
        baseUrl: TEST_URL
      });

      return expect(manager.notesOwned()).to.eventually.be.rejectedWith(/key/);
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

    it('should correctly return the notes owned as just an array', function() {
      var scope = nock(TEST_URL)
        .get('/accounts/11111/notes')
        .replyWithFile(200, __dirname + '/responses/notes_owned.json');

      return expect(manager.notesOwned()).to.eventually.deep.equal(
        [
        	{
        		"loanId":11111,
        		"noteId":22222,
        		"orderId":33333,
        		"interestRate":13.57,
        		"loanLength":36,
        		"loanStatus":"Late (31-120 days)",
        		"grade":"C",
        		"loanAmount":10800,
        		"noteAmount":25,
        		"paymentsReceived":5.88,
        		"issueDate":"2009-11-12T06:34:02.000-08:00",
        		"orderDate":"2009-11-05T09:33:50.000-08:00",
        		"loanStatusDate":"2013-05-20T13:13:53.000-07:00"
        	},
        	{
        		"loanId":44444,
        		"noteId":55555,
        		"orderId":66666,
        		"interestRate":14.26,
        		"loanLength":36,
        		"loanStatus":"Late (31-120 days)",
        		"grade":"C",
        		"loanAmount":3000,
        		"noteAmount":25,
        		"paymentsReceived":7.65,
        		"issueDate":"2009-09-18T01:04:34.000-07:00",
        		"orderDate":"2009-09-15T11:28:12.000-07:00",
        		"loanStatusDate":"2013-05-23T17:27:51.000-07:00"
        	}
        ]);
    })
  })
});
