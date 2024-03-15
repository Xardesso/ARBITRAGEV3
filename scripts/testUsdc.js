const AmountToBorrow = 9.625384238839713; //in weth
const feeNumber = 0.0009;
const uniswapPrice = 2582.210455431666; // WETH/WBTC price on Uniswap
const sushiPrice = 2563.777455431666; // WETH/WBTC price on SushiSwap
const formattedNum = 0.014484767; //in weth

var spread = uniswapPrice - sushiPrice;
const EX1V =
  uniswapPrice * AmountToBorrow -
  AmountToBorrow * 0.003 -
  AmountToBorrow * feeNumber;
const EX2V = EX1V / sushiPrice - (EX1V / sushiPrice) * 0.003;
console.log(AmountToBorrow * feeNumber);
const VS = EX2V - (AmountToBorrow + Number(formattedNum));
console.log(spread);
console.log(VS);
