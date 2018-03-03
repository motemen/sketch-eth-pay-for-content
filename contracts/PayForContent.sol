pragma solidity ^0.4.19;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract PayForContent is Ownable {
  mapping (address => uint) payedAmount;

  function () public payable {
    require(msg.value > 0);
    payedAmount[msg.sender] += msg.value;
  }

  function getPayedAmount(address _from) public view returns (uint amount) {
    return payedAmount[_from];
  }

  function withdraw() public onlyOwner {
    owner.transfer(this.balance);
  }
}
