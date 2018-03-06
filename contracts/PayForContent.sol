pragma solidity ^0.4.19;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract PayForContent is Ownable {
  mapping (address => uint) paidAmount;

  function () public payable {
    require(msg.value > 0);
    paidAmount[msg.sender] += msg.value;
  }

  function getPaidAmount(address _from) public view returns (uint amount) {
    return paidAmount[_from];
  }

  function withdraw() public onlyOwner {
    owner.transfer(this.balance);
  }
}
