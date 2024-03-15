const AmountToBorrow = 19.250768477679426; //in weth
const feeNumber = 0.0009;
const uniswapPrice = 0.0614268314298112; // WETH/WBTC price on Uniswap
const sushiPrice = 0.060999832601603154; // WETH/WBTC price on SushiSwap
const formattedNum = 0.018595663; //in weth

var spread = uniswapPrice - sushiPrice;

const EX1V =
  uniswapPrice * AmountToBorrow -
  uniswapPrice * (AmountToBorrow * 0.003) -
  uniswapPrice * (AmountToBorrow * feeNumber);
const EX2V = EX1V / sushiPrice - uniswapPrice * ((EX1V / sushiPrice) * 0.003);

const EX1S =
  sushiPrice * AmountToBorrow -
  sushiPrice * (AmountToBorrow * 0.003) -
  sushiPrice * (AmountToBorrow * feeNumber);
const EX2S = EX1S / uniswapPrice - sushiPrice * ((EX1S / uniswapPrice) * 0.003);

const VS = EX2V - (AmountToBorrow + Number(formattedNum));

console.log("PROFIT " + VS);
console.log(spread);

//0.05799799273919157  0.062134832601603154
