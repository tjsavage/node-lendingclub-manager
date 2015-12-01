module.exports = {
  validateOrder: function(orderObj) {
    if (typeof orderObj != 'object') {
      throw new Error("Order object is not an object")
    }

    if (!("loanId" in orderObj)) {
      throw new Error("loanId not in orderObj");
    } else if (typeof orderObj["loanId"] != 'number') {
      throw new Error("loanId not an integer");
    }
    if (!("requestedAmount" in orderObj)) {
      throw new Error("requestedAmount not in orderObj");
    } else if (typeof orderObj["requestedAmount"] != 'float') {
      throw new Error("requestedAmount not a float")
    }

    return true;
  },

  validateLoan: function(loanObj) {
    if (typeof loanObj != 'object') {
      throw new Error("Loan object is not an object");
    }

    if (!("id" in loanObj)) {
      throw new Error("loanId not in loan object");
    }

    return true;
  }
}
