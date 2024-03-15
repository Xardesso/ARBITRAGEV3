npm install

npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY --fork-block-number 18828440

Deploy the flashloan contract (see the folder `aave-flashloan`)

Update contract address (`conadd` in main.js)

node scripts/main.js