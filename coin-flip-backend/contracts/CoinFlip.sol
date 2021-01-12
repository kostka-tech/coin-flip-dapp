pragma solidity 0.5.12;

import "./Ownable.sol";
import "./provableAPI.sol";

contract CoinFlip is Ownable, usingProvable {

    uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;
    uint256 public latestNumber;

    event LogNewProvableQuery(string description);
    event coinFlipComplete();

    uint public balance = 0;

    struct Game {
      address payable playerAddress;
      uint playerSelection;
      uint betAmount;
      string result;
    }

    // Used by frontend code to fetch player game using player address
    mapping (address => Game) private games;
    // Used by smartcontract to keep track of games in progress waiting to get result from oracle
    mapping (bytes32 => Game) private gamesInProgress;

    modifier minCost(uint _cost){
        require(msg.value >= _cost);
        _;
    }

    modifier validSelection(uint _selection){
        require((_selection == 0) || (_selection == 1));
        _;
    }

    modifier validBetAmount(uint _betAmount){
        require(_betAmount * 2 < balance);
        _;
    }

    function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public {
        // comment this out when using testGetRandom
        require(msg.sender == provable_cbAddress());

        uint256 coinFlipResult = uint256(keccak256(abi.encodePacked(_result))) % 2;

        Game memory playerGame = gamesInProgress[_queryId];

        if (coinFlipResult == playerGame.playerSelection) {
            playerGame.result = "WIN";
            uint winAmount = playerGame.betAmount * 2;
            playerGame.playerAddress.transfer(winAmount);
            balance -= playerGame.betAmount;
        } else {
            playerGame.result = "LOSE";
            balance += playerGame.betAmount;
        }

        games[playerGame.playerAddress] = playerGame;

        // remove game in progress
        
        emit coinFlipComplete();
    }

    // function testGetRandom(address payable playerAddress, uint playerSelection, uint betAmount) public returns (bytes32){
    //     bytes32 queryId = bytes32(keccak256(abi.encodePacked(msg.sender)));

    //     Game memory newGame;
    //     newGame.playerAddress = playerAddress;
    //     newGame.playerSelection = playerSelection;
    //     newGame.betAmount = betAmount;
        
    //     gamesInProgress[queryId] = newGame;

    //     __callback(queryId, "1", bytes("some proof"));

    //     return queryId;
    // }

    function addFunds() public payable minCost(0.1 ether){
        balance += msg.value;
    }

    function flipCoin(uint selection) public payable minCost(0.01 ether) validSelection(selection) validBetAmount(msg.value) {
        // require that no game in progress already
        
        uint256 QUERY_EXECUTION_DELAY = 0;
        uint256 GAS_FOR_CALLBACK = 200000;

        // bytes32 queryId = testGetRandom(msg.sender, selection, msg.value);
        bytes32 queryId = provable_newRandomDSQuery(QUERY_EXECUTION_DELAY, NUM_RANDOM_BYTES_REQUESTED, GAS_FOR_CALLBACK);

        // UNCOMMENT THIS WHEN USING REAL ORACLE
        Game memory newGame;
        newGame.playerAddress = msg.sender;
        newGame.playerSelection = selection;
        newGame.betAmount = msg.value;
        
        gamesInProgress[queryId] = newGame;
        
        emit LogNewProvableQuery("Provable random number query sent, waiting for the response...");
    }

    function getGame() public view returns(uint betAmount, string memory result){
        return (games[msg.sender].betAmount, games[msg.sender].result);
    }

    function getBalance() view public returns(uint bal) {
        return balance;
    }

    function withdrawAll() public onlyOwner returns(uint) {
       uint toTransfer = balance;
       balance = 0;
       msg.sender.transfer(toTransfer);
       return toTransfer;
   }

}