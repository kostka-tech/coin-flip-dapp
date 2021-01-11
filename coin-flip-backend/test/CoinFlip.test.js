const CoinFlip = artifacts.require("CoinFlip");
const truffleAssert = require("truffle-assertions");

contract("CoinFlip", async function(accounts) {

    let instance;
    
    before(async function() {
        console.log('Deploy Account: ', accounts[0]);
        instance = await CoinFlip.deployed();
    });

    it("should return balance", async function() {
        let balance = await instance.getBalance();
        assert(parseFloat(balance) > web3.utils.toWei("0.09", "ether"), "Should return balance");
    });

    it("should return WIN or LOSE", async function() {
        await instance.flipCoin(1, { value: web3.utils.toWei("0.01", "ether") });
        let game = await instance.getGame();
        assert((game.result === "WIN") || (game.result === "LOSE"), "Flip coin result should be WIN or LOSE");
        assert(game.betAmount.toString() === web3.utils.toWei("0.01", "ether"), "Should return betAmount");
    });

    it("should increase or decrease balance", async function() {
        let balanceBefore = await instance.getBalance();
        await instance.flipCoin(1, { value: web3.utils.toWei("0.01", "ether") });
        let game = await instance.getGame();
        let balanceAfter = await instance.getBalance();
        if (game.result === "WIN") {
            assert(balanceAfter < balanceBefore, "Balance should decrease when lose");
        } else {
            assert(balanceAfter > balanceBefore, "Balance should increase when lose");
        }
    });

    it("should pass if 1 or 0", async function() {
        await truffleAssert.passes(instance.flipCoin(0, { value: web3.utils.toWei("0.01", "ether") }), truffleAssert.ErrorType.REVERT);
        await truffleAssert.passes(instance.flipCoin(1, { value: web3.utils.toWei("0.01", "ether") }), truffleAssert.ErrorType.REVERT);
    });

    it("should fail if not 1 or 0", async function() {
        await truffleAssert.fails(instance.flipCoin(2, { value: web3.utils.toWei("0.01", "ether") }), truffleAssert.ErrorType.REVERT);
    });

    it("should fail if not paying at least 0.01 ether", async function() {
        await truffleAssert.fails(instance.flipCoin(0, { value: web3.utils.toWei("0.001", "ether") }), truffleAssert.ErrorType.REVERT);
    });

    it("should fail if paying over what the contract can pay out", async function() {
        await truffleAssert.fails(instance.flipCoin(0, { value: web3.utils.toWei("1", "ether") }), truffleAssert.ErrorType.REVERT);
    });

    it("should init balance and allow owner to withraw all", async function() {
        let instance = await CoinFlip.new();
        instance.addFunds({ value: web3.utils.toWei("0.11", "ether") });
        let instanceBalance = await instance.balance();
        assert(instanceBalance.toString() === web3.utils.toWei("0.11", "ether"));
        let initialBalance = await web3.eth.getBalance(accounts[0]);
        await instance.withdrawAll({ from: accounts[0] });
        instanceBalance = await instance.balance();
        assert(instanceBalance.toString() === web3.utils.toWei("0", "ether"));
        assert(await web3.eth.getBalance(instance.address) === web3.utils.toWei("0", "ether"), "Contract balance not empty after withdraw");
        assert(await web3.eth.getBalance(accounts[0]) > initialBalance, "Owner contract balance not updated after withdraw");
    });

});