# HPW Smart Contract

ERC-20 token for HardProblems.World platform.

## What is HPW?

HPW (HardProblems.World) is an ERC-20 token used to reward users for:
- Submitting solutions to hard problems
- Receiving upvotes
- Contributing to the community

**Token info**:
- Name: `HardProblems.World`
- Symbol: `HPW`
- Decimals: `18`
- Cap: `1,000,000,000` (1 billion)
- Standard: `ERC-20` (OpenZeppelin v5)

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │ submit  │  API Server  │ reward  │   HPW        │
│  (Browser)   │ ──────▶ │  (Node.js)   │ ──────▶ │  Contract    │
│              │ solution│              │  on-chain│  (Base L2)   │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                         │
       │                        │  ┌──────────────┐       │
       │                        └─▶│  Solution DB │       │
       │  connect MetaMask       │  (off-chain) │       │
       └───────────────────────▶└──────────────┘       │
                                                         │
                          user receives HPW tokens ◀────┘
                          (in their MetaMask wallet)
```

## Setup

```bash
cd contracts
npm install
```

Create `.env`:

```env
# Deployer wallet private key (has Base Sepolia ETH for gas)
PRIVATE_KEY=0x...

# Base Sepolia RPC (free public endpoint)
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Optional: for Basescan verification
BASESCAN_API_KEY=...
```

Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## Deploy

```bash
# Local test
npx hardhat test

# Deploy to Base Sepolia testnet
npm run deploy:baseSepolia
```

After deployment, copy the contract address into:

**Backend** (`server/src/hpw.js` / env):
```env
HPW_ADDRESS=0x...
REWARD_MINTER_KEY=0x...   # Server wallet private key (must be set as rewardMinter)
```

**Frontend** (`client/src/lib/chainConfig.js`):
```js
export const HPW_ADDRESSES = {
  baseSepolia: '0x...',  // paste here
  base: '0x...',         // for mainnet
};
```

Or use env vars:
```env
VITE_HPW_ADDRESS_BASE_SEPOLIA=0x...
```

## Test

```bash
npx hardhat test
```

17 tests cover:
- Deployment (owner, minter, name, symbol, cap)
- `reward()` minting (minter + owner paths, error cases)
- Cap enforcement
- `rewardBatch()` multi-recipient
- `setRewardMinter()` ownership
- Standard ERC20 (transfer, approve, transferFrom)

## Run the Indexer

The indexer watches on-chain events and syncs them to a local JSON file:

```bash
# After deployment, set:
export HPW_ADDRESS=0x...
export RPC_URL=https://sepolia.base.org
export START_BLOCK=12345  # or 0 to scan from start

node contracts/indexer.cjs
```

The indexer writes to `data/chain/indexed.json`:
```json
{
  "lastBlock": 12345,
  "rewards": [{ "txHash": "0x...", "to": "0x...", "amount": "100", "reason": "solution:riemann" }],
  "transfers": [...],
  "balances": {}
}
```

## Security Notes

- `rewardMinter` is the server's hot wallet. Rotate if compromised.
- Owner can `setRewardMinter()` to a new address. Owner can also `rescueTokens()` accidentally sent ERC20s.
- Cap is hard-coded at 1B HPW. If you want more, deploy a new contract and migrate.
- The contract does not have a `burn()` function. If needed, deploy v2 with that.

## License

MIT
