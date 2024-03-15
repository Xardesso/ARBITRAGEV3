require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.6.12",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.API_KEY}`,
      accounts: [process.env.KEY],
    },
  },
};
