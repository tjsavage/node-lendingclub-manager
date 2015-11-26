var LendingClub = require('node-lendingclub');

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
        resolve(result.loans);
      }
    })
  })
}

module.exports = Manager;
