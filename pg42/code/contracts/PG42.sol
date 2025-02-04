// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";  // ✅ On garde Ownable

contract PG42 is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10 ** 18;

    event Rewarded(address indexed recipient, uint256 amount);

    constructor(address initialOwner) ERC20("PG42", "PG42") Ownable(initialOwner) {
        _mint(initialOwner, MAX_SUPPLY);
    }

    function reward(address recipient, uint256 amount) external onlyOwner {
        require(amount > 0, "Invalid amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _transfer(msg.sender, recipient, amount);

        emit Rewarded(recipient, amount);
    }
}
