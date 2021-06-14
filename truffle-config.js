const HDWalletProvider = require('@truffle/hdwallet-provider');
const path = require("path");

require('dotenv').config();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777
    },
    rinkeby: {
      provider: () => new HDWalletProvider( [ process.env.PRIVATE_KEY ], `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`),
      network_id: 4
    },
    ropsten: {
      provider: () => new HDWalletProvider( [ process.env.PRIVATE_KEY ], `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`),
      network_id: 3
    },
    kovan: {
      provider: () => new HDWalletProvider( [ process.env.PRIVATE_KEY ], `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`),
      network_id: 42
    }
  },

  compilers: {
    solc: {
      version: "0.8.3",
      settings: {
        optimizer: {
          enabled: false,
          runs: 200
        },
      }
    }
  }
};
