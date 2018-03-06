import * as Web3 from 'web3';

import * as Contract from 'truffle-contract';

const PayForContent = Contract(require('../../build/contracts/PayForContent.json'));

// https://github.com/danfinlay/js-eth-personal-sign-examples
import { bufferToHex } from 'ethereumjs-util';

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
}

PayForContent.setProvider(web3.currentProvider);

PayForContent.deployed().then(function (instance) {
  const elContractAddress = document.querySelector('#contract-address');
  const elAccountAddress = document.querySelector('#account-address');

  elContractAddress.innerText = instance.address;

  web3.eth.getCode(instance.address, (err, code) => {
    if (err) throw err;
    if (code === '0x0') {
      elContractAddress.innerText += ' (not a contract)';
    }
  });

  const account = web3.eth.accounts[0]; // TODO watch
  if (!account) {
    elAccountAddress.innerText = '(not logged in)';
    return;
  }

  elAccountAddress.innerText = account;

  const buttonPay = document.querySelector('#action-pay');
  const buttonReveal = document.querySelector('#action-reveal');

  [ buttonPay, buttonReveal ].forEach((button) => {
    button.disabled = false;
  });

  instance.getPaidAmount(account).then((amount) => {
    console.log('paid:', amount.valueOf());

    if (amount > 0) {
      buttonPay.textContent = 'Already paid';
    }
  });

  buttonPay.addEventListener('click', (ev) => {
    web3.eth.sendTransaction({
      from: account,
      to: instance.address,
      value: web3.toWei(0.001, 'ether'),
    }, (err, txHash) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log('transaction:', txHash);

      const waitForTx = (cb) => {
        const poll = () => {
          web3.eth.getTransactionReceipt(txHash, (err, receipt) => {
            if (err || receipt) {
              cb(err, receipt);
              return;
            }

            setTimeout(poll, 500);
          });
        };
        poll();
      };

      waitForTx((err, receipt) => {
        console.log('receipt:', receipt);
        buttonPay.textContent = 'paid';
      });
    });
  });

  buttonReveal.addEventListener('click', (ev) => {
    const msg = [
      {
        type: 'string',
        name: 'Origin',
        value: document.documentElement.getAttribute('data-origin'),
      },
      {
        type: 'string',
        name: 'CAUTION',
        value: "Make sure that the Origin above matches the URL on your browser's address bar",
      },
    ];

    web3.currentProvider.sendAsync({
      method: 'eth_signTypedData',
      params: [ msg, account ],
      from: account,
    }, (err, data) => {
      if (err) {
        throw err;
      }
      if (data.error) {
        throw data.error;
      }

      const sig = data.result;

      fetch('/r', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `from=${encodeURIComponent(account)}&sig=${encodeURIComponent(sig)}`
      })
      .then((res) => res.json())
      .then((data) => {
        document.querySelector('#revealed-content').textContent
          = data.success ? `CONTENT REVEALED! ${data.content}` : `*FAILED* ${data.message}`;

        if (window.opener) {
          window.opener.postMessage(JSON.stringify(data), 'https://motemen.hatenablog.com');
          window.close();
        }
      });
    });;
  });
});
