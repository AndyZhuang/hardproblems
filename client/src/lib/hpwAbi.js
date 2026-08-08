// HPW Contract ABI (subset used by frontend)
// Full ABI is in contracts/artifacts/contracts/HPW.sol/HPW.json
// This is the minimal ABI for frontend interactions.

const HPW_ABI = [
  // ERC20 standard
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  // HPW-specific
  'function cap() view returns (uint256)',
  'function rewardMinter() view returns (address)',
  'function owner() view returns (uint256)',
  'function reward(address to, uint256 amount, string reason)',
  'function rewardBatch(address[] recipients, uint256[] amounts, string reason)',
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Reward(address indexed to, uint256 amount, string reason)',
  'event RewardMinterUpdated(address indexed previous, address indexed current)',
];

export default HPW_ABI;
