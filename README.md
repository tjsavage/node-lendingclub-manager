## API

The API heavily leverages chaining promises.

### Authentication

```js
var LendingclubManager = require('node-lendingclub-manager');
var manager = new LendingclubManager({
  key: "ALDKSFJOWEIUROLSDJKF",
  investorId: "11111"
});
```

### Getting loans

```js
manager.listLoans().then(function(result) {
  console.log(result);
})
```

### Filtering Loans

```js
var isDoubleDigitInterest = function (loan) {
  return loan.intRate >= 10;
}

var filterLoanList = function(loans) {
  return loans.filter(isDoubleDigitInterest);
}

// Filter loan list directly
manager.listLoans().then(filterLoanList).then(function(result) {
  console.log(result);
});

// Have the client filter for you
manager.filterListedLoans(isDoubleDigitInterest).then(function(result) {
  console.log(result);
})

// Combine multiple filters
var is36Week = function(loan) {
  return loan.term == 36
}
manager.filterListedLoans(isDoubleDigitInterest, is36week).then(console.log);
```

Filter against loans that you've already invested in:

```js
manager.filterListedLoans(manager.hasNotAlreadyInvested).then(console.log);
```


### Creating and submitting an order

Basic $25/order:

```js
manager.filterListedLoans(isDoubleDigitInterest)
  .then(manager.createOrder)
  .then(manager.submitOrders)
  .then(function(result) {
    console.log("Order results:", result)
  });
```

Custom order amounts:
```js
manager.filterListedLoans(isDoubleDigitInterest)
  .then(function(loans) {
    return manager.createOrder(loans, 30.0);
  })
  .then(manager.submitOrders)
  .then(function(result) {
    console.log("Order results:", result);
  });
```

Different order amount per loan:
```js
manager.filterListedLoans(isDoubleDigitInterest)
  .then(function(loans) {
    return manager.createOrder(loans, function(loan) {
      if (loan.intRate > 12) {
        return 50;
      } else {
        return 25;
      }
    })
  });
```

Different order amount per loan, via promises:
```js
manager.filterListedLoans(isDoubleDigitInterest)
  .then(function(loans) {
    return manager.createOrder(loans, function(loan) {
      return new Promise(function(resolve, reject) {
        if (loan.intRate > 12) {
          resolve(50);
        } else {
          resolve(25);
        }
      });
    })
  });
```


### Adding orders to a portfolio

```js
var loans = manager.filterListedLoans(isDoubleDigitInterest);
var portfolio = manager.createPortfolio("My Portfolio", "A good portfolio");

Promise.all([loans, portfolio]).then(function(results) {
  var loans = results[0];
  var portfolio = results[1];
  return manager.createOrder(loans, 25, portfolio.portfolioId);
}).then(manager.submitOrder)
  .then(function(result) {
    console.log("Order results:", results);
  })
```
