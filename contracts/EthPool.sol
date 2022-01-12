//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract EthPool is ReentrancyGuard, AccessControl {
    //0x64b106a1cce9f848ce1a1dffff614f8276d582aa8ba99c9e2d00fc2479e93ca9
    bytes32 private constant ETHPOOL_TEAM_ROLE = keccak256("ETHPOOL_TEAM");
    mapping(address => uint) public userRewards;
    mapping(address => uint) public userPool;
    address[] public users;
    
    uint public totalPool;
    uint public lastRewardDate;

    event DepositRewards(uint amount);
    event DepositPool(address user, uint amount);
    event WithdrawPool(address user, uint amount);
    event WithdrawRewards(address user, uint amount);
    event RestakeRewards(address user, uint amount);

    constructor() payable {
        _setupRole(ETHPOOL_TEAM_ROLE, msg.sender);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    receive() external payable {}



    /**
     * @dev get value deposit by user
     */
    function getUserPool(address user) public view returns(uint){
      return userPool[user];
    }

     /**
     * @dev get reward value by user
     */
    function getUserReward(address user) public view returns(uint){
      return userRewards[user];
    }

    /**
     * @dev get users counts
     */
    function getUsersCount() public view returns(uint){
      return users.length;
    }

    /**
     * @dev deposit user eth to pool
     */
    function depositPool() external payable nonReentrant() {
      require(msg.value > 10_000, "value must be greater than 10.000 wei");
      if(userPool[msg.sender] == 0){
        users.push(msg.sender);
      }
      userPool[msg.sender] += msg.value;
      totalPool += msg.value;
      emit DepositPool(msg.sender, msg.value);
    }

     /**
     * @dev withdraw eth from pool and rewards to user account
     * Clean userPool, userRewards and remove user from users array
     */
    function withdrawPool() external nonReentrant(){
      require(userPool[msg.sender] > 0, "user doesn't have enough to withdraw");
      uint amountFromPool = userPool[msg.sender];
      uint amountToWithdraw = amountFromPool + userRewards[msg.sender];
      userPool[msg.sender] = 0;
      userRewards[msg.sender] = 0;
      totalPool -= amountFromPool;
      //Remover user from users array
      for(uint i=0; i < users.length; i++){
        if(users[i] == msg.sender){
          users[i] = users[users.length - 1];
          users.pop();
          break;
        }
      }
      payable(msg.sender).transfer(amountToWithdraw);
      emit WithdrawPool(msg.sender, amountToWithdraw);
    }

    /**
     * @dev withdraw eth from rewards to user account
     * Clean userRewards
     */
    function withdrawRewards() external nonReentrant(){
      require(userRewards[msg.sender] > 0, "user doesn't have enough to withdraw");
      uint amountToWithdraw = userRewards[msg.sender];
      userRewards[msg.sender] = 0;
      payable(msg.sender).transfer(amountToWithdraw);
      emit WithdrawRewards(msg.sender, amountToWithdraw);
    }

    /**
     * @dev restake eth from rewards to user pool
     * Clean user rewards and add them to pool
     */
    function restakeRewards() external nonReentrant(){
      require(userRewards[msg.sender] >= 10_000, "user doesn't have minimum 10.000 wei to restake");
      uint amountToRestake = userRewards[msg.sender];
      userRewards[msg.sender] = 0;
      userPool[msg.sender] += amountToRestake;
      totalPool += amountToRestake;
      emit RestakeRewards(msg.sender, amountToRestake);
    }

    /**
     * @dev deposit rewards to users 
     * Add rewards to each user based on their percentage (basis point) of pool total value
     */
    function depositRewards() external payable onlyRole(ETHPOOL_TEAM_ROLE) {
      require(msg.value >= 10_000, "value must be greater than 10.000 wei");
      require(users.length > 0, "there isn't any users in pool" );
      uint reward = msg.value;
      for(uint i = 0; i < users.length; i++){
        address user = users[i];
        uint stakedValue = userPool[user];
        uint userReward = (stakedValue * reward) / totalPool;
        userRewards[user] += userReward;
      }

      emit DepositRewards(reward);
    }
    
}
