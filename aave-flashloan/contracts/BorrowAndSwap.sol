// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract BorrowAndSwap is FlashLoanSimpleReceiverBase {
    IUniswapV2Router02 uniswapRouter;
    IUniswapV2Router02 sushiSwapRouter;
    address private owner;

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the contract owner can call this function"
        );
        _;
    }

    constructor(
        address _addressProvider,
        address _uniswapRouter,
        address _sushiSwapRouter
    ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        sushiSwapRouter = IUniswapV2Router02(_sushiSwapRouter);
        owner = msg.sender;
    }

    function requestFlashLoan(
        uint256 _amount,
        uint256 amountOutExpected,
        uint256 amountOutExpected2,
        address coin1,
        address coin2
    ) public {
        address receiverAddress = address(this);
        address asset = coin1;
        uint256 amount = _amount;
        uint16 referralCode = 0;

        bytes memory params = abi.encode(
            coin2,
            amountOutExpected,
            amountOutExpected2
        );

        POOL.flashLoanSimple(
            receiverAddress,
            asset,
            amount,
            params,
            referralCode
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Decode params
        (
            address coin2,
            uint256 amountOutExpected,
            uint256 amountOutExpected2
        ) = abi.decode(params, (address, uint256, uint256));

        address coin1 = asset;

        // trade deadline used for expiration
        uint256 deadline = block.timestamp + 100;

        // Approve the Pool contract allowance to *pull* the owed amount
        uint256 amountOwed = amount + premium;
        IERC20(asset).approve(address(POOL), amountOwed);

        // approve the sushiSwapRouter to spend our tokens so the trade can occur
        IERC20(coin1).approve(address(sushiSwapRouter), amount);

        address[] memory path2 = new address[](2);
        path2[0] = coin1;
        path2[1] = coin2;

        sushiSwapRouter.swapExactTokensForTokens(
            amount,
            0,
            path2,
            address(this),
            deadline
        );

        uint256 amountReceived = IERC20(coin2).balanceOf(address(this));

        // approve the uniswapRouter to spend our tokens so the trade can occur
        IERC20(coin2).approve(address(uniswapRouter), amountReceived);

        address[] memory path = new address[](2);
        path[0] = coin2;
        path[1] = coin1;

        uniswapRouter.swapExactTokensForTokens(
            amountReceived,
            0,
            path,
            address(this),
            deadline
        );

        return true;
    }

    function getBalance(address _tokenAddress) external view returns (uint256) {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    function withdraw(address _tokenAddress) external onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    // receive() external payable {}
}
