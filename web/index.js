const express = require('express');
const bodyParser = require('body-parser');

const path = require('path');

const PORT = process.env.PORT || 5000;
const ORIGIN = process.env.ORIGIN || `http://localhost:${PORT}`;

const Web3 = require('web3');

// https://github.com/danfinlay/js-eth-personal-sign-examples
const { toBuffer } = require('ethereumjs-util');
const { recoverTypedSignature } = require('eth-sig-util');

const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');

const PayForContent = require('truffle-contract')(require(path.join(__dirname, '../build/contracts/PayForContent.json')));

// const web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/${process.env.INFURA_KEY}`));
const web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:7545`));

const PROTECTED_CONTENT = process.env.PROTECTED_CONTENT || 'ぽっぽえ';

PayForContent.setProvider(web3.currentProvider);

express()
  .use(webpackDevMiddleware(webpack({ ...require('./webpack.config.js'), context: __dirname }), { publicPath: '/static' }))
  .use(bodyParser.urlencoded({ extended: false }))
  .use('/static', express.static('dist'))
  .get('/v', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'v.html'))
  })
  .post('/r', (req, res) => {
    const from = req.body['from'];
    const sig = req.body['sig'];

    const msg = [
      {
        type: 'string',
        name: 'Origin',
        value: ORIGIN,
      },
    ];

    const sender = recoverTypedSignature({
      data: msg,
      sig: sig,
    });

    console.log(`recovered=${sender} from=${from}`);

    if (sender !== from) {
      res.json({ success: false });
      return;
    }

    PayForContent.deployed().then((instance) => {
      return instance.getPaidAmount(sender);
    }).then((paidAmount) => {
      if (!paidAmount.gt(0)) {
        throw new Error('insufficient paid amount');
      }

      res.json({ success: true, content: PROTECTED_CONTENT });
    }).catch((err) => {
      console.error(err);
      res.json({ success: false });
    });
  })
  .listen(PORT, () => console.log(`server listening on ${PORT}`));
