function requireEnv(key) {
  if (!process.env[key]) {
    throw new Error(`${key} required`);
  }
  return process.env[key];
}

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function () {
        const HDWalletProvider = require('truffle-hdwallet-provider');
        return new HDWalletProvider(requireEnv('ROPSTEN_MNEMONIC'), `https://ropsten.infura.io/${requireEnv('INFURA_ACCESS_TOKEN')}`, 1);
      },
      network_id: 3,
      // https://www.reddit.com/r/ethdev/comments/6oxjid/truffleexceeds_block_gas_limit_ropsten/dkme2mp/
      gas: 4700000,
    }
  }
};
