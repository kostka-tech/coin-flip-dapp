var web3 = new Web3(Web3.givenProvider);
var contractInstance;
var playerAddress;

$(document).ready(function() {
    window.ethereum.enable().then(function(accounts) {
        contractInstance = new web3.eth.Contract(abi, "0xeD067bD06E593F8A3bc992d3D118bd120c8DE8c3", { from: accounts[0]});
        
        playerAddress = accounts[0];
        refreshGameBalances();

        $("#top_up_button").click(topUp);
        $("#withdraw_button").click(withdraw);
        $("#flip_heads_button").click(flipHeads);
        $("#flip_tails_button").click(flipTails);

        contractInstance.events.coinFlipComplete()
            .on('data', (event) => {
                refreshGameBalances();
                toggleButtons(false);
                contractInstance.methods.getGame().call().then(function(game) {
                    $('#result_output').text(game.result);
                });
            })
            .on('error', function(error) {
                console.error(error);
                $('#result_output').text("An error occured. Please refresh and try again.");
                toggleButtons(false);
            });
    });
});

function topUp() {
    var config = {
        value: web3.utils.toWei("0.1", "ether")
    }
    contractInstance.methods.addFunds().send(config)
    .on("receipt", function() {
        refreshGameBalances();   
    });
}

function withdraw() {
    contractInstance.methods.withdrawAll().send()
    .on("receipt", function() {
        refreshGameBalances();
    });
}

function flipHeads() {
    flip(1);
}

function flipTails() {
    flip(0);
}

function flip(selection) {
    $('#result_output').text("");
    var config = {
        value: web3.utils.toWei("0.01", "ether")
    }
    $('#result_output').text("Coin flipping...");
    toggleButtons(true);
    contractInstance.methods.flipCoin(selection).send(config)
    .on("error", function(error) {
        console.error(error);
        $('#result_output').text("An error occured. Please refresh and try again.");
        toggleButtons(false);
    });
}

function refreshGameBalances() {
    contractInstance.methods.getBalance().call().then(function(res) {
        $('#contract_balance_output').text(web3.utils.fromWei(res) + " ETH");
    });
    web3.eth.getBalance(playerAddress).then(function(balance) {
        $('#player_balance_output').text(web3.utils.fromWei(balance) + " ETH");
    });
}

function toggleButtons(isDisabled) {
    $("#flip_heads_button").prop('disabled', isDisabled);
    $("#flip_tails_button").prop('disabled', isDisabled);
}

