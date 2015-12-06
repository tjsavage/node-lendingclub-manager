var mocha = require('mocha');
var chai = require('chai');
var nock = require('nock');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

nock.disableNetConnect();

var expect = chai.expect;

var LendingclubManager = require('../index');

var TEST_URL = "http://localhost";

describe('end-to-end', function() {

  it('should be able to filter, create a protfolio, and submit an order' , function() {
    var scope = setupBasicServer(["listLoans", "createPortfolio", "submitOrder"]);
    var manager = new LendingclubManager({
      key: "key",
      investorId: "11111",
      baseUrl: TEST_URL
    });

    var loans = manager.filterListedLoans(function(loan) {
      return loan.term == 60;
    });
    var portfolio = manager.createPortfolio("P", "Sample");

    return expect(Promise.all([loans, portfolio]).then(function(results) {
        var loans = results[0];
        var portfolio = results[1];
        return manager.createOrders(loans, 25, portfolio.portfolioId);
      }).then(function(results) {
        return manager.submitOrders(results);
      })).to.eventually.deep.equal({
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
        	}
        ]
      });

  });

  it('should be able to filter out loans already invested in', function() {
    var scope = setupBasicServer(['listLoans', 'ownedNotes']);

    var manager = new LendingclubManager({
      key: "key",
      investorId: "11111",
      baseUrl: TEST_URL
    });

    var notesOwned = manager.notesOwned();

    return notesOwned.then(function(notes) {
      var justLoanIds = notes.map(function(note) {
        return note.loanId;
      });

      function doesNotOwn(loan) {
        return justLoanIds.indexOf(loan.id) != -1;
      }

      return expect(manager.filterListedLoans(doesNotOwn)).to.eventually.have.length(2);
    })
  })

  var setupBasicServer = function(optionsArr) {
    var scope = nock(TEST_URL);

    if (optionsArr.indexOf("listLoans") != -1) {
      scope = scope.get('/loans/listing?showAll=true').replyWithFile(200, __dirname + '/responses/loans_for_order.json');
    }

    if (optionsArr.indexOf("ownedNotes") != -1) {
      scope = scope.get('/accounts/11111/notes').reply(200, {
      	"myNotes" : [
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
      		"loanId":22222,
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
      	}
        ]
      });
    }

    if (optionsArr.indexOf("createPortfolio") != -1) {
      scope = scope.post('/accounts/11111/portfolios', {
        "aid": 11111,
        "portfolioName": "P",
        "portfolioDescription": "Sample"
      }).reply(200, {
      	"portfolioId":22222,
      	"portfolioName":"Portfolio 1",
      	"portfolioDescription":"Sample description "
      });
    }

    if (optionsArr.indexOf("submitOrder") != -1) {
      scope = scope.post('/accounts/11111/orders', {
      	"aid":11111,
      	"orders":[
      	{
      		"loanId":22222,
      		"requestedAmount":25,
      		"portfolioId":22222
      	},
      	{
      		"loanId": 33333,
      		"requestedAmount":25,
      		"portfolioId":22222
      	},
      	{
      		"loanId": 44444,
      		"requestedAmount":25,
          "portfolioId": 22222
      	}]
      }).replyWithFile(200, __dirname + '/responses/orders.json');
    }

    return scope;
  }

  afterEach(function() {
    nock.cleanAll();
  })
})
