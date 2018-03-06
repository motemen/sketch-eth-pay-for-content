const express = require('express');
const bodyParser = require('body-parser');

const path = require('path');

const PORT = process.env.PORT || 5000;
const ORIGIN = process.env.ORIGIN || `http://localhost:${PORT}`;

const Web3 = require('web3');

// https://github.com/danfinlay/js-eth-personal-sign-examples
const { toBuffer } = require('ethereumjs-util');
const { recoverTypedSignature } = require('eth-sig-util');

const PayForContent = require('truffle-contract')(require(path.join(__dirname, '../build/contracts/PayForContent.json')));

const web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/${process.env.INFURA_KEY}`));

const PROTECTED_CONTENT = process.env.PROTECTED_CONTENT || 'ぽっぽえ';

PayForContent.setProvider(web3.currentProvider);

const app = express()

if (process.env.NODE_ENV !== 'production') {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  app.use(webpackDevMiddleware(webpack({ ...require('./webpack.config.js'), context: __dirname }), { publicPath: '/static' }))
}

app
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .use(bodyParser.urlencoded({ extended: false }))
  .use('/static', express.static(path.join(__dirname, 'dist')))
  .get('/v', (req, res) => {
    res.render('v.ejs', { origin: ORIGIN })
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
      {
        type: 'string',
        name: 'CAUTION',
        value: "Make sure that the Origin above matches the URL on your browser's address bar",
      },
    ];

    const sender = recoverTypedSignature({
      data: msg,
      sig: sig,
    });

    console.log(`recovered=${sender} from=${from}`);

    if (sender !== from) {
      res.json({ success: false, message: 'invalid signature' });
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
      res.json({ success: false, message: `${err}` });
    });
  })
  .listen(PORT, () => console.log(`server listening on ${PORT}`));
