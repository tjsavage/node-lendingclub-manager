var mocha = require('mocha');
var chai = require('chai');
var nock = require('nock');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

nock.disableNetConnect();

var expect = chai.expect;

var LendingclubManager = require('../index');

var TEST_URL = "http://localhost";

describe('createOrder', function() {
  function getLoanList() {
    return JSON.parse(JSON.stringify(require('./responses/just_loans.json')));
  }

  function getOrders() {
    return JSON.parse(JSON.stringify(require('./responses/just_loans_as_orders.json')));
  }

  describe('when incorrectly authenticated', function() {
    it('should throw when not given an investorId', function() {
      var manager = new LendingclubManager({
        key: "key",
        baseUrl: TEST_URL
      });

      return expect(manager.createOrder(getLoanList())).to.eventually.be.rejectedWith(/investorId/);
    });
  });

  describe('when correctly authenticated', function() {
    var manager;

    beforeEach(function() {
      manager = new LendingclubManager({
        key: "key",
        baseUrl: TEST_URL,
        investorId: 123
      });
    });

    it('should throw if passed an empty array', function() {
      return expect(manager.createOrder([])).to.eventually.be.rejectedWith(/loan/);
    });

    it('should throw if passed an array of not loans', function() {
      return expect(manager.createOrder([{"a": "b"}, {"c": "d"}])).to.eventually.be.rejectedWith(/loan/);
    });

    it('should correctly create a basic order object with each order being $25', function() {
      var loanList = getLoanList();

      return expect(manager.createOrder(loanList)).to.eventually.deep.equal({
        aid: 123,
        orders: getOrders()
      });
    });

    it('should correctly use a custom order value', function() {
      var loanList = getLoanList();
      var orders = getOrders();
      orders.forEach(function(order) {
        order.requestedAmount = 50;
      });

      return expect(manager.createOrder(loanList, 50)).to.eventually.deep.equal({
        aid: 123,
        orders: orders
      });
    });

    it('should correctly apply a function to get a custom order amount', function() {
      var loanList = getLoanList();
      var orders = getOrders();
      orders.forEach(function(order, i) {
        order.requestedAmount = i == 0 ? 25 : 50;
      });

      return expect(manager.createOrder(loanList, function(order) {
        if (order.term == 36) {
          return 25;
        }
        return 50;
      })).to.eventually.deep.equal({
        aid: 123,
        orders: orders
      });
    });

    it('should correctly apply a function that returns a promise to get a custom order amount', function() {
      var loanList = getLoanList();
      var orders = getOrders();
      orders.forEach(function(order, i) {
        order.requestedAmount = i == 0 ? 25 : 50;
      });

      return expect(manager.createOrder(loanList, function(order) {
        return new Promise(function(resolve, reject) {
          if (order.term == 36) {
            resolve(25);
          }
          resolve(50);
        });
      })).to.eventually.deep.equal({
        aid: 123,
        orders: orders
      });
    });

    it('should correctly throw if a function that returns a promise to get a custom order amount throws', function() {
      var loanList = getLoanList();
      var orders = getOrders();
      orders.forEach(function(order, i) {
        order.requestedAmount = i == 0 ? 25 : 50;
      });

      return expect(manager.createOrder(loanList, function(order) {
        return new Promise(function(resolve, reject){
          if (order.term == 36) {
            resolve(25);
          }
          reject(new Error("couldn't get an orderAmount"));
        })
      })).to.eventually.be.rejectedWith(/orderAmount/);
    })

    it('should correctly use a custom portfolioId', function() {
      var loanList = getLoanList();
      var orders = getOrders();
      orders.forEach(function(order) {
        orders.requestedAmount = 25;
        order.portfolioId = 55555;
      });

      return expect(manager.createOrder(loanList, 25, 55555).then(JSON.stringify)).to.eventually.equal(JSON.stringify({
        aid: 123,
        orders: orders
      }));
    });

    it('should correctly apply a function to get a custom portfolioId', function() {
      var loanList = getLoanList();
      var orders = getOrders();
      orders.forEach(function(order, i) {
        order.requestedAmount = 25;
        order.portfolioId = i == 0 ? 55555 : 66666;
      });

      return expect(manager.createOrder(loanList, 25, function(order) {
        if (order.term == 36) {
          return 55555;
        }
        return 66666;
      })).to.eventually.deep.equal({
        aid: 123,
        orders: orders
      });
    });

    it('should correctly apply a function to get a custom portfolioId and not set it if the function returns null', function() {
      var loanList = getLoanList();
      var orders = getOrders();
      orders.forEach(function(order, i) {
        order.requestedAmount = 25;
        if (i == 0) {
          order.portfolioId = 55555
        }
      });

      return expect(manager.createOrder(loanList, 25, function(order) {
        if (order.term == 36) {
          return 55555;
        }
        return null;
      })).to.eventually.deep.equal({
        aid: 123,
        orders: orders
      });
    });

    it('should correctly apply a function that returns a promise to get a custom portfolioId', function() {
      var loanList = getLoanList();
      var orders = getOrders();
      orders.forEach(function(order, i) {
        order.requestedAmount = 50;
        order.portfolioId = i == 0 ? 55555 : 66666;
      });

      return expect(manager.createOrder(loanList, 50, function(order) {
        return new Promise(function(resolve, reject) {
          if (order.term == 36) {
            resolve(55555);
          }
          resolve(66666);
        });
      })).to.eventually.deep.equal({
        aid: 123,
        orders: orders
      });
    });

    it('should correctly throw if a function that returns a promise to get a custom portfolioId throws', function() {
      var loanList = getLoanList();

      return expect(manager.createOrder(loanList, 50, function(order) {
        return new Promise(function(resolve, reject){
          if (order.term == 36) {
            resolve(25);
          }
          reject(new Error("couldn't get a portfolioId"));
        })
      })).to.eventually.be.rejectedWith(/portfolioId/);
    })

  });

});
