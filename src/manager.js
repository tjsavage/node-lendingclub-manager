var LendingClub = require('node-lendingclub');
var validate = require('./validate');

var Manager = function(options) {
  this._settings = {
    baseUrl: "https://api.lendingclub.com/api/investor/v1"
  };

  for(var key in options) {
    if (options.hasOwnProperty(key)) {
      this._settings[key] = options[key];
    }
  }

  this._client = new LendingClub({
    baseUrl: this._settings.baseUrl
  });

  if (typeof this._settings.key != 'undefined') {
    this._client.authenticate({
      key: this._settings.key
    });
  }
}

Manager.prototype.summary = function summary() {
  var self = this;

  return new Promise(function(resolve, reject) {
    self.checkIfAuthenticated();

    self._client.summary({
      investorId: self._settings.investorId
    }, function(err, result) {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  })
}

/*
* @param {Object} options - An object to set options on how to list the loans
* @param {boolean} options.showAll - Defaults to true; if false, will only list the loans in the most recent listing
* @param {boolean} options.investorId - Optional, override the investorId provided in the constructor, or if one wasn't provided there.
* @return {Promise<Array<Object>>} - Returns a promise that resolves to a list of loan objects, as returned by the lendingclub API.
*/
Manager.prototype.listLoans = function listLoans(options) {
  var self = this;

  return new Promise(function(resolve, reject) {
    self._client.loans({
      investorId: options && typeof options.investorId != 'undefined' ? options.investorId : self._settings.investorId,
      showAll: options && typeof options.showAll != 'undefined' ? options.showAll : true
    }, function(err, result) {
      if (err) {
        reject(err);
      } else {
        if (!("loans" in result)) {
          throw new Error("Unexpected format of result from API call")
        }
        resolve(result.loans);
      }
    })
  })
}

Manager.prototype.filterListedLoans = function filterListedLoans() {
  var filters = [];
  for (var key in arguments) {
    if (arguments.hasOwnProperty(key)) {
      filters.push(arguments[key]);
    }
  }

  return this.listLoans().then(function(loans) {
    var filteredLoans = [];

    loans.forEach(function(loan) {
      var filterPromiseChain = Promise.resolve(true);

      filters.forEach(function(filter) {
        filterPromiseChain = filterPromiseChain.then(function(result) {
          if (!result) { return false; }
          return filter(loan);
        })
      });

      filterPromiseChain.then(function(result) {
        if (result) {
          filteredLoans.push(loan);
        }
      });
    })

    return filteredLoans;

  });
}

/**
* Takes an array of loan objects, and returns an array of corresponding order objects,
* as expected by the lending club API. Each order object has a loanId, requestedAmount,
* and optional portfolioId.
* @param loans {Array<Object>} An array of loan objects (as returned by the LC API) to add create orders for.
* @param requestedAmount {number|function} Optional, either a number to invest in each loan,
*   or a function that gets passed the loan object as its only parameter and returns an
*   amount to invest in each loan.
* @param portfolioId {number|function} Optional, either a portfolio id to assign the order to
*   or a function that returns a portfolio id to assign the order to. Portfolio id is a number.
*/
Manager.prototype.createOrders = function createOrders(loans, requestedAmount, portfolioId) {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (!loans.length) {
      throw new Error("Invalid loan array");
    }

    self.checkIfAuthenticated();

    var orderPromises = [];

    loans.forEach(function(loan) {
      validate.validateLoan(loan);

      var order = {};
      order.loanId = loan.id;

      var requestedAmountPromise = Promise.resolve().then(function() {
        if (typeof requestedAmount == 'number') {
          return requestedAmount;
        } else if (typeof requestedAmount == 'function') {
          return requestedAmount(loan);
        } else if (typeof requestedAmount == 'undefined') {
          return 25;
        } else {
          throw new Error("requestedAmount type not a number or a function");
        }
      });

      var portfolioIdPromise = Promise.resolve().then(function() {
        if (typeof portfolioId == 'number') {
          return portfolioId;
        } else if (typeof portfolioId == 'function') {
          return portfolioId(loan);
        } else if (typeof portfolioId == 'undefined') {
          return null;
        } else {
          throw new Error("requestedAmount type not a number or a function");
        }
      });


      var orderPromise = Promise.all([requestedAmountPromise, portfolioIdPromise])
        .then(function(results) {
          order.requestedAmount = results[0];

          if (results[1] && results[1] != null) {
            order.portfolioId = results[1];
          }

          return order;
      });

      orderPromises.push(orderPromise);
    });

    Promise.all(orderPromises).then(resolve, reject);
  });
}

/**
* Gets the user's portfolios.
*/
Manager.prototype.getPortfolios = function getPortfolios() {
  var self = this;

  return new Promise(function(resolve, reject) {
    self.checkIfAuthenticated();

    self._client.portfolios({
      investorId: self._settings.investorId
    }, function(err, result) {
      if (err) {
        throw new Error(err);
      }
      if ("errors" in result) {
        reject(result);
      }
      resolve(result);
    })
  })
}

/**
* Gets the user's notes owned.
* @return Array<Object> Returns a promise that resolves to an array of the note objects, as returned by the LC API.
*/
Manager.prototype.notesOwned = function notesOwned() {
  var self = this;

  return new Promise(function(resolve, reject) {
    self.checkIfAuthenticated();

    self._client.notes({
      investorId: self._settings.investorId
    }, function(err, result) {
      if (err) {
        throw new Error(err);
      }
      if ("errors" in result) {
        reject(result);
      }

      if (!("myNotes" in result)) {
        throw new Error("Unexpected notes response from API");
      }

      resolve(result.myNotes);
    })
  })
}

/**
* Creates a portfolio with the given name and description, and returns a promise
* that resolves to the portfolio object, as returned from the LC API. throws
* if not authenticated or if the server goes wrong.
* @param portfolioName {string} - The name of the portfolio to create
* @param portfolioDescription {string} - A description of the portfolio
*/
Manager.prototype.createPortfolio = function createPortfolio(portfolioName, portfolioDescription) {
  var self = this;

  return new Promise(function(resolve, reject) {
    self.checkIfAuthenticated();

    self._client.createPortfolio({
      investorId: self._settings.investorId,
      aid: parseInt(self._settings.investorId),
      portfolioName: portfolioName,
      portfolioDescription: portfolioDescription
    }, function(err, result) {
      if (err) {
        throw new Error(err);
      }

      if ("errors" in result) {
        reject(result);
      }
      resolve(result);
    });
  })
}

/**
* Takes an array of order objects and submits it to the Lending Club API
* Returns a promise that resolves to the response from the API.
* @param orders {Array<Object>} - The order array as requested by the Lending Club API
*/
Manager.prototype.submitOrders = function submitOrders(orders) {
  var self = this;

  return new Promise(function(resolve, reject) {
    self.checkIfAuthenticated();

    self._client.submitOrders({
      aid: parseInt(self._settings.investorId),
      investorId: self._settings.investorId,
      orders: orders
    }, function(err, body) {
      if (err) {
        throw new Error(err);
      }
      resolve(body);
    })

  })
}

Manager.prototype.checkIfAuthenticated = function checkIfAuthenticated() {
  if (!this._settings.investorId) {
    throw new Error("No investorId provided");
  }

  if (!this._settings.key) {
    throw new Error("No key provided");
  }
}

module.exports = Manager;
