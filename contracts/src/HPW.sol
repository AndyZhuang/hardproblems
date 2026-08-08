// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HPW (HardProblems.World) Token
 * @notice ERC-20 token for the HardProblems.World platform.
 *         Used to reward users for submitting solutions to hard problems,
 *         voting, and contributing to the community.
 * @dev Uses OpenZeppelin v5 contracts.
 *      - Owner is the platform's hot wallet (server-side)
 *      - RewardMinter is the server address that can mint rewards
 *      - Cap is the maximum total supply (1B HPW = 1e27 wei with 18 decimals)
 *      - RewardMinter is set in constructor, can be transferred
 */
contract HPW is ERC20, Ownable {
    uint256 public constant CAP = 1_000_000_000 * 10 ** 18; // 1 billion tokens

    address public rewardMinter;

    event RewardMinterUpdated(address indexed previous, address indexed current);
    event Reward(address indexed to, uint256 amount, string reason);

    modifier onlyRewardMinter() {
        require(msg.sender == rewardMinter || msg.sender == owner(), "HPW: not rewardMinter");
        _;
    }

    constructor(address _rewardMinter) ERC20("HardProblems.World", "HPW") Ownable(msg.sender) {
        require(_rewardMinter != address(0), "HPW: zero rewardMinter");
        rewardMinter = _rewardMinter;
        emit RewardMinterUpdated(address(0), _rewardMinter);
    }

    /**
     * @notice Mint reward tokens to a user. Only rewardMinter or owner can call.
     * @param to Recipient address
     * @param amount Amount in wei (18 decimals)
     * @param reason Short string describing why (e.g. "solution:riemann")
     */
    function reward(address to, uint256 amount, string calldata reason) external onlyRewardMinter {
        require(to != address(0), "HPW: zero to");
        require(amount > 0, "HPW: zero amount");
        require(totalSupply() + amount <= CAP, "HPW: cap exceeded");
        _mint(to, amount);
        emit Reward(to, amount, reason);
    }

    /**
     * @notice Batch reward multiple recipients in one tx (gas efficient)
     */
    function rewardBatch(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata reason
    ) external onlyRewardMinter {
        require(recipients.length == amounts.length, "HPW: length mismatch");
        require(recipients.length > 0, "HPW: empty");
        uint256 total = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "HPW: zero to");
            require(amounts[i] > 0, "HPW: zero amount");
            total += amounts[i];
        }
        require(totalSupply() + total <= CAP, "HPW: cap exceeded");
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
            emit Reward(recipients[i], amounts[i], reason);
        }
    }

    /**
     * @notice Update the reward minter address (only owner)
     */
    function setRewardMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "HPW: zero newMinter");
        emit RewardMinterUpdated(rewardMinter, newMinter);
        rewardMinter = newMinter;
    }

    /**
     * @notice Withdraw accidentally sent tokens (only owner)
     */
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "HPW: zero to");
        IERC20(token).transfer(to, amount);
    }
}
