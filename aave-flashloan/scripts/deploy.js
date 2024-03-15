const {
  setBlockGasLimit,
} = require("@nomicfoundation/hardhat-network-helpers");
const hre = require("hardhat");
require("dotenv").config();
async function main() {
  const aave_provider = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";
  const uniswap_router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const sushiswap_router = "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f";
  var x = 0;
  var provider = new ethers.providers.JsonRpcProvider(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.API_KEY}`
  );
  const wallet = new ethers.Wallet(process.env.KEY, provider);
  const contractArtifacts = require("./BorrowAndSwap.json");
  const contractABI = contractArtifacts.abi;
  const bytecode = contractArtifacts.bytecode;

  const factory = new ethers.ContractFactory(contractABI, bytecode, wallet);
  const feeData = await provider.getFeeData();
  const gasPrice = await feeData.gasPrice;
  let gasPriceGwei = await ethers.utils.formatUnits(gasPrice, "gwei");
  console.log(gasPriceGwei);
  let newGasPriceWei = ethers.utils.parseUnits(gasPriceGwei.toString(), "gwei");
  if (gasPriceGwei < 21) {
    x++;

    const contract = await factory.deploy(
      aave_provider,
      uniswap_router,
      sushiswap_router,
      {
        gasLimit: 1460310,
        gasPrice: newGasPriceWei,
      }
    );

    console.log("Contract1 main deployed to:", contract.address);
  }
  if (x != 0) {
    console.log("pauza");
    process.exit(1);
  }
}
const interval = 6000; // 6.1 seconds

// Call the function every certain amount of time
setInterval(main, interval);
