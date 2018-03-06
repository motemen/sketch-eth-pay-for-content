const PayForContent = artifacts.require('./PayForContent.sol');

contract('PayForContent', async (accounts) => {
  it('receives eth and records it', async () => {
    const instance = await PayForContent.deployed();

    const txHash = await web3.eth.sendTransaction({ from: accounts[1], to: instance.address, value: 42 });
    console.log(txHash);

    const receipt = await web3.eth.getTransactionReceipt(txHash);
    if (!receipt) {
      const filter = web3.eth.filter('latest');
      await new Promise((resolve, reject) => {
        filter.watch((err, result) => {
          if (err) {
            reject(err);
            return;
          }

          const receipt = web3.eth.getTransactionReceipt(txHash);
          if (receipt) {
            resolve(receipt);
            filter.stopWatching();
          }
        });
      });
    }

    const ib = await web3.eth.getBalance(instance.address);
    assert.equal(ib.valueOf(), 42);

    const paidAmount = await instance.getPaidAmount(accounts[1]);
    assert.equal(paidAmount.valueOf(), 42);
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
