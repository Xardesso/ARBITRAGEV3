const ethers = require("ethers");
const { toBn } = require("evm-bn");

ratio0ToPrice = (amount0In, amount1Out) => {
  if (Number(amount1Out) === 0) {
    return "Infinity";
  }
  return 1 / (Number(amount0In) / Number(amount1Out) / 10 ** 12);
};
var provider = new ethers.providers.JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.API_KEY}`
);
const lendingPoolAddress = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";

var WETH_USDC_V2 = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"; // replace with actual address
var WETH_USDC_SUSHI = "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0"; // replace with actual address
var WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
var USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
var v2PairArtifact = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json");

var v2Pair = new ethers.Contract(WETH_USDC_V2, v2PairArtifact.abi, provider);
var sushiPair = new ethers.Contract(
  WETH_USDC_SUSHI,
  v2PairArtifact.abi,
  provider
);

let LSPU2 = 0;
let LSPS2 = 0;
let LSPU = 0;
let LSPS = 0;
//test which to deploy
var x = 0;
var y = 0;
var ss = 0;
const slippageTolerance = 0.001; // 0.1% slippage tolerance
const conadd = "0x44eB301e356885Cd42D3E158043445a8c7F0bf75";
const extraspeed = 8;
//flashlon amount in percent of avilable liquidity
const POF = 0.00025;

const wallet = new ethers.Wallet(process.env.KEY, provider);

const contractArtifacts = require("./contracts/BorrowAndSwap.sol/BorrowAndSwap.json");

const contractABI = contractArtifacts.abi;
const contract = new ethers.Contract(conadd, contractABI, wallet);
const lendingPoolAbi = [
  "function FLASHLOAN_PREMIUM_TOTAL() view returns (uint256)",
  "function getReserveData(address asset) view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint40)",
];
const wethAbi = [
  "function approve(address usr, uint wad) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
];

async function PriceUpdate() {
  try {
    const feeData = await provider.getFeeData();
    const gasPrice = await feeData.gasPrice;
    let gasPriceGwei = await ethers.utils.formatUnits(gasPrice, "gwei");
    let newGasPriceGwei = parseFloat(gasPriceGwei) + extraspeed;
    let newGasPriceGwei2 = await newGasPriceGwei.toFixed(6);

    let newGasPriceWei = await ethers.utils.parseUnits(
      newGasPriceGwei2.toString(),
      "gwei"
    );

    //should use 488657 gas
    // Calculate total gas cost in Gwei
    let totalGasCostGwei = await Math.round(newGasPriceGwei2 * 510657);

    // Convert Gwei to Wei (1 Gwei = 10^9 Wei)
    let totalGasCostWei = await ethers.BigNumber.from(totalGasCostGwei).mul(
      ethers.BigNumber.from(10).pow(9)
    );

    // Convert Wei to Ether
    let totalGasCostEther = await ethers.utils.formatEther(totalGasCostWei);
    let totalGasCostEtherNumber = await Number(totalGasCostEther.toString());

    let formattedNum = await totalGasCostEtherNumber.toFixed(16);

    // Set initial values for output data
    var latestBlockNumber = await provider.getBlockNumber();

    var [reserve0, reserve1, blockTimestampLast] = await v2Pair.getReserves();
    // Calculate the price based on the reserves
    var uniswapPrice = ratio0ToPrice(reserve1, reserve0);
    //print block number and gas costs

    console.log(latestBlockNumber);

    console.log(
      "Gas cost in eth: " +
        formattedNum +
        "|" +
        "Gas cost in usd: " +
        formattedNum * uniswapPrice
    );

    const lendingPool = new ethers.Contract(
      lendingPoolAddress,
      lendingPoolAbi,
      provider
    );

    const fee = await lendingPool.FLASHLOAN_PREMIUM_TOTAL();
    const feeString = ethers.utils.formatUnits(fee, 4);
    // Parse the string into a number
    const feeNumber = parseFloat(feeString);
    const weth = new ethers.Contract(WETH, wethAbi, provider);
    const reserveData = await lendingPool.getReserveData(WETH);
    const availableLiquidity = reserveData[0];
    const availableLiquidityString = ethers.utils.formatUnits(
      availableLiquidity,
      18
    );
    const availableLiquidityNumber = parseFloat(availableLiquidityString);
    const maxWETH =
      (availableLiquidityNumber * (1 - fee / 100)) / (1 + fee / 100);
    const AmountToBorrow = maxWETH * POF;
    console.log(
      "The flash loan fee is",
      feeNumber,
      " The maximum WETH you can borrow is",
      maxWETH,
      " Amount to borrow: ",
      AmountToBorrow
    );
    let amountETH = ethers.utils.parseUnits(AmountToBorrow.toString(), "ether");
    //print block number and gas costs
    console.log(
      "Uni V2",
      "|",
      "pair:",
      "WETH/USDC",
      "|",
      "price:",
      uniswapPrice,
      blockTimestampLast
    );

    // Get the reserves from the Sushiswap pair contract
    var [sushiReserve0, sushiReserve1, sushiBlockTimestampLast] =
      await sushiPair.getReserves();

    // Calculate the price based on the reserves
    var sushiPrice = ratio0ToPrice(sushiReserve1, sushiReserve0);
    // Format the price without scientific notation

    console.log(
      "Sushi",
      "|",
      "pair:",
      "WETH/USDC",
      "|",
      "price:",
      sushiPrice,
      "      ",
      sushiBlockTimestampLast
    );

    var spread = uniswapPrice - sushiPrice;
    const EX1V =
      uniswapPrice * AmountToBorrow -
      AmountToBorrow * 0.003 -
      AmountToBorrow * feeNumber;
    const EX2V = EX1V / sushiPrice - (EX1V / sushiPrice) * 0.003;

    const VS = EX2V - (AmountToBorrow + Number(formattedNum));
    console.log(
      "Spread V2-SUSHI",
      "|",
      "pair:",
      "WETH/USDC",
      "|",
      "spread:",
      spread,
      "PROFIT:",
      VS + "  " + x
    );

    var spreadfromsushi = sushiPrice - uniswapPrice;
    const EX1S =
      sushiPrice * AmountToBorrow -
      AmountToBorrow * 0.003 -
      AmountToBorrow * feeNumber;
    const EX2S = EX1S / uniswapPrice - (EX1S / uniswapPrice) * 0.003;

    const SV = EX2S - (AmountToBorrow + Number(formattedNum));
    console.log(
      "Spread SUSHI-V2",
      "|",
      "pair:",
      "WETH/USDC",
      "|",
      "spread:",
      spreadfromsushi,
      "PROFIT:",
      SV + "  " + y + " SUCCESS: " + ss
      //sushi-v2
    );

    let balance = await provider.getBalance(wallet.address);

    // Account balance
    let etherString = ethers.utils.formatEther(balance);
    console.log(
      "Account balance: ",
      etherString,
      " Account balance in USD: ",
      etherString * uniswapPrice
    );

    if (
      VS > 0 &&
      LSPU != uniswapPrice &&
      LSPS != sushiPrice &&
      etherString > Number(formattedNum)
    ) {
      //data here

      LSPU = uniswapPrice;
      LSPS = sushiPrice;
      //test which to deploy
      x++;

      // console.log(
      //   "profit---------------------- UNISWAP-SUSHI-----------WHITHOUT SMART CONTRACT "
      // );
      const wethBalance = await contract.getBalance(WETH);
      const usdcBalance = await contract.getBalance(USDC);

      const formattedWETHBalance = await ethers.utils.formatUnits(
        wethBalance,
        "ether"
      );
      const formattedUSDCBalance = await ethers.utils.formatUnits(
        usdcBalance,
        6
      );

      console.log(`Contract WETH balance: ${formattedWETHBalance}`);
      console.log(`Contract USDC balance: ${formattedUSDCBalance}`);
    }

    if (
      SV > 0 &&
      LSPU2 != uniswapPrice &&
      LSPS2 != sushiPrice &&
      etherString > Number(formattedNum)
    ) {
      y++;

      const gasEstimateF = await contract.estimateGas.requestFlashLoan(
        amountETH,
        toBn(EX1S.toString()),
        toBn(EX2S.toString()),
        WETH,
        USDC
      );
      console.log("estimated gas:" + gasEstimateF);

      const gasEstimateWithBuffer = gasEstimateF.mul(120).div(100);
      console.log("estimated gas with buffer:" + gasEstimateWithBuffer);

      const tx = await contract.requestFlashLoan(
        amountETH,
        toBn(EX1S.toString()),
        toBn(EX2S.toString()),
        WETH,
        USDC,
        {
          gasLimit: gasEstimateWithBuffer,
          gasPrice: newGasPriceWei,
        }
      );

      await tx.wait();
      const receipt = await tx.wait();
      console.log(receipt.status);
      if (receipt.status === 1) {
        ss++;
        console.log("success");
      } else {
        console.log("fail");
        process.exit(1);
      }

      LSPU2 = uniswapPrice;
      LSPS2 = sushiPrice;
      // console.log(
      //   "profit---------------------- SUSHISWAP-UNISWAP-----------WITH SMART CONTRACT"
      // );
      const wethBalance = await contract.getBalance(WETH);
      const usdcBalance = await contract.getBalance(USDC);

      const formattedWETHBalance = await ethers.utils.formatUnits(
        wethBalance,
        "ether"
      );
      const formattedUSDCBalance = await ethers.utils.formatUnits(
        usdcBalance,
        6
      );

      console.log(`Contract WETH balance: ${formattedWETHBalance}`);
      console.log(`Contract USDC balance: ${formattedUSDCBalance}`);
    }
  } catch (error) {
    console.error(error);
  }
}

// Set the interval in milliseconds
const interval = 4000; // 6.1 seconds

// Call the function every certain amount of time
setInterval(PriceUpdate, interval);
