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

### Creating and submitting an order

```js
manager.filterListedLoans(isDoubleDigitInterest)
  .then(manager.createOrder)
  .then(manager.submitOrder)
  .then(function(result) {
    console.log("Order results:", result)
  });
```
