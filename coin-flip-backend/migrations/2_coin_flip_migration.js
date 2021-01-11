const CoinFlip = artifacts.require("CoinFlip");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(CoinFlip).then(function(instance) {
    instance.addFunds({ value: web3.utils.toWei("0.1", "ether"), from: accounts[0]})
  });
};
