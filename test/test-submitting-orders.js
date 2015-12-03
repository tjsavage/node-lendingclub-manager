var mocha = require('mocha');
var chai = require('chai');
var nock = require('nock');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

nock.disableNetConnect();

var expect = chai.expect;

var LendingclubManager = require('../index');

var TEST_URL = "http://localhost";

describe('submitting orders', function() {
  var getOrderRequest = function() {
    return {
    	"aid":11111,
    	"orders":[
    	{
    		"loanId":22222,
    		"requestedAmount":55,
    		"portfolioId":44444
    	},
    	{
    		"loanId": 33333,
    		"requestedAmount":25,
    		"portfolioId":55555
    	},
    	{
    		"loanId": 44444,
    		"requestedAmount":25,
    	}]
    }
  };

  describe('when not authenticated', function() {
    it('should throw if not given an investorId', function() {
      var manager = new LendingclubManager({
        key: "key",
        baseUrl: TEST_URL
      });

      return expect(manager.submitOrders(getOrderRequest())).to.eventually.be.rejectedWith(/.*investorId.*/);
    });

    it('should throw if not given a key', function() {
      var manager = new LendingclubManager({
        investorId: "11111",
        baseUrl: TEST_URL
      });

      return expect(manager.submitOrders(getOrderRequest())).to.eventually.be.rejectedWith(/.*key.*/);
    });
  })

  describe('when authenticated', function(){
    var manager;

    beforeEach(function() {
      manager = new LendingclubManager({
        key: "key",
        investorId: "11111",
        baseUrl: TEST_URL
      });
    });

    it('should correctly submit an order', function() {
      var scope = nock(TEST_URL)
        .post("/accounts/11111/orders", getOrderRequest())
        .reply(200, {
        	"orderInstructId":55555,
        	"orderConfirmations": [
        	{
        		"loanId":22222,
        		"requestedAmount":55.0,
        		"investedAmount":50.0,
        		"executionStatus":
        			[
        			"REQUESTED_AMOUNT_ROUNDED",
        			"ORDER_FULFILLED"
        			]
        	},
        	{
        		"loanId":33333,
        		"requestedAmount":25.0,
        		"investedAmount":25.0,
        		"executionStatus":
        			[
        			"ORDER_FULFILLED"
        			]
        	},
        	{
        		"loanId":44444,
        		"requestedAmount":25.0,
        		"investedAmount":0,
        		"executionStatus":
        			[
        			"NOT_AN_INFUNDING_LOAN"
        			]
        	}]
        });

      return expect(manager.submitOrders(getOrderRequest().orders)).to.eventually.have.property("orderInstructId");
    })
  })
})
