const PayForContent = artifacts.require('./PayForContent.sol');

contract('PayForContent', async (accounts) => {
  it('receives eth and records it', async () => {
    const instance = await PayForContent.deployed();
    const t = await web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: 42 });
    const payedAmount = await instance.getPayedAmount(accounts[0]);
    assert.equal(payedAmount.valueOf(), 42);
  });

  it('allows withdrawal only to its owner', async () => {
    const instance = await PayForContent.deployed();
    await instance.withdraw();
    try {
      await instance.withdraw({ from: accounts[1] });
      assert.fail();
    } catch (_) {
    }
  });
});
