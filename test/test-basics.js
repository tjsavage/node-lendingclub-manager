var mocha = require('mocha');
var chai = require('chai');

var expect = chai.expect;

var LendingclubManager = require('../index');

describe('basics', function() {
  describe('configuration settings', function(){
    it('should correctly work with the basic useage', function() {
        var manager = new LendingclubManager({
          key: "key",
          investorId: "11111"
        });

        expect(manager._settings.key).to.equal("key");
        expect(manager._settings.investorId).to.equal("11111");
    });

    it('should correctly have a default baseUrl', function() {
      var manager = new LendingclubManager();
      expect(manager._settings.baseUrl).to.equal("https://api.lendingclub.com/api/investor/v1");
    });

    it('should correctly override baseUrl', function() {
      var manager = new LendingclubManager({
        baseUrl: "http://localhost"
      });

      expect(manager._settings.baseUrl).to.equal("http://localhost");
    });

    it('should correctly add any key/value in objects to _settings', function() {
      var manager = new LendingclubManager({
        randomThingyHere: "Yes"
      });

      expect(manager._settings.randomThingyHere).to.equal("Yes");
    })
  });
});
