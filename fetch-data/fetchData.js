const Web3 = require("web3");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const axios = require("axios");
require("dotenv").config();

// ABI of the smart contract
const contractABI = [
  {
    inputs: [
      {
        internalType: "contract IAuthorizer",
        name: "authorizer",
        type: "address",
      },
      { internalType: "contract IWETH", name: "weth", type: "address" },
      { internalType: "uint256", name: "pauseWindowDuration", type: "uint256" },
      {
        internalType: "uint256",
        name: "bufferPeriodDuration",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IAuthorizer",
        name: "newAuthorizer",
        type: "address",
      },
    ],
    name: "AuthorizerChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "ExternalBalanceTransfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IFlashLoanRecipient",
        name: "recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "feeAmount",
        type: "uint256",
      },
    ],
    name: "FlashLoan",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      { indexed: false, internalType: "int256", name: "delta", type: "int256" },
    ],
    name: "InternalBalanceChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "bool", name: "paused", type: "bool" },
    ],
    name: "PausedStateChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "liquidityProvider",
        type: "address",
      },
      {
        indexed: false,
        internalType: "contract IERC20[]",
        name: "tokens",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "int256[]",
        name: "deltas",
        type: "int256[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "protocolFeeAmounts",
        type: "uint256[]",
      },
    ],
    name: "PoolBalanceChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "assetManager",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "cashDelta",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "managedDelta",
        type: "int256",
      },
    ],
    name: "PoolBalanceManaged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "poolAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "enum IVault.PoolSpecialization",
        name: "specialization",
        type: "uint8",
      },
    ],
    name: "PoolRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "relayer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      { indexed: false, internalType: "bool", name: "approved", type: "bool" },
    ],
    name: "RelayerApprovalChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "tokenIn",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "tokenOut",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountOut",
        type: "uint256",
      },
    ],
    name: "Swap",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "contract IERC20[]",
        name: "tokens",
        type: "address[]",
      },
    ],
    name: "TokensDeregistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "poolId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "contract IERC20[]",
        name: "tokens",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "assetManagers",
        type: "address[]",
      },
    ],
    name: "TokensRegistered",
    type: "event",
  },
  {
    inputs: [],
    name: "WETH",
    outputs: [{ internalType: "contract IWETH", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "enum IVault.SwapKind", name: "kind", type: "uint8" },
      {
        components: [
          { internalType: "bytes32", name: "poolId", type: "bytes32" },
          { internalType: "uint256", name: "assetInIndex", type: "uint256" },
          { internalType: "uint256", name: "assetOutIndex", type: "uint256" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "bytes", name: "userData", type: "bytes" },
        ],
        internalType: "struct IVault.BatchSwapStep[]",
        name: "swaps",
        type: "tuple[]",
      },
      { internalType: "contract IAsset[]", name: "assets", type: "address[]" },
      {
        components: [
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "bool", name: "fromInternalBalance", type: "bool" },
          {
            internalType: "address payable",
            name: "recipient",
            type: "address",
          },
          { internalType: "bool", name: "toInternalBalance", type: "bool" },
        ],
        internalType: "struct IVault.FundManagement",
        name: "funds",
        type: "tuple",
      },
      { internalType: "int256[]", name: "limits", type: "int256[]" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "batchSwap",
    outputs: [
      { internalType: "int256[]", name: "assetDeltas", type: "int256[]" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "poolId", type: "bytes32" },
      { internalType: "contract IERC20[]", name: "tokens", type: "address[]" },
    ],
    name: "deregisterTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "poolId", type: "bytes32" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address payable", name: "recipient", type: "address" },
      {
        components: [
          {
            internalType: "contract IAsset[]",
            name: "assets",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "minAmountsOut",
            type: "uint256[]",
          },
          { internalType: "bytes", name: "userData", type: "bytes" },
          { internalType: "bool", name: "toInternalBalance", type: "bool" },
        ],
        internalType: "struct IVault.ExitPoolRequest",
        name: "request",
        type: "tuple",
      },
    ],
    name: "exitPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IFlashLoanRecipient",
        name: "recipient",
        type: "address",
      },
      { internalType: "contract IERC20[]", name: "tokens", type: "address[]" },
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "flashLoan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "selector", type: "bytes4" }],
    name: "getActionId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAuthorizer",
    outputs: [
      { internalType: "contract IAuthorizer", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getDomainSeparator",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "contract IERC20[]", name: "tokens", type: "address[]" },
    ],
    name: "getInternalBalance",
    outputs: [
      { internalType: "uint256[]", name: "balances", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getNextNonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPausedState",
    outputs: [
      { internalType: "bool", name: "paused", type: "bool" },
      { internalType: "uint256", name: "pauseWindowEndTime", type: "uint256" },
      { internalType: "uint256", name: "bufferPeriodEndTime", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "poolId", type: "bytes32" }],
    name: "getPool",
    outputs: [
      { internalType: "address", name: "", type: "address" },
      {
        internalType: "enum IVault.PoolSpecialization",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "poolId", type: "bytes32" },
      { internalType: "contract IERC20", name: "token", type: "address" },
    ],
    name: "getPoolTokenInfo",
    outputs: [
      { internalType: "uint256", name: "cash", type: "uint256" },
      { internalType: "uint256", name: "managed", type: "uint256" },
      { internalType: "uint256", name: "lastChangeBlock", type: "uint256" },
      { internalType: "address", name: "assetManager", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "poolId", type: "bytes32" }],
    name: "getPoolTokens",
    outputs: [
      { internalType: "contract IERC20[]", name: "tokens", type: "address[]" },
      { internalType: "uint256[]", name: "balances", type: "uint256[]" },
      { internalType: "uint256", name: "lastChangeBlock", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getProtocolFeesCollector",
    outputs: [
      {
        internalType: "contract ProtocolFeesCollector",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "relayer", type: "address" },
    ],
    name: "hasApprovedRelayer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "poolId", type: "bytes32" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "recipient", type: "address" },
      {
        components: [
          {
            internalType: "contract IAsset[]",
            name: "assets",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "maxAmountsIn",
            type: "uint256[]",
          },
          { internalType: "bytes", name: "userData", type: "bytes" },
          { internalType: "bool", name: "fromInternalBalance", type: "bool" },
        ],
        internalType: "struct IVault.JoinPoolRequest",
        name: "request",
        type: "tuple",
      },
    ],
    name: "joinPool",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "enum IVault.PoolBalanceOpKind",
            name: "kind",
            type: "uint8",
          },
          { internalType: "bytes32", name: "poolId", type: "bytes32" },
          { internalType: "contract IERC20", name: "token", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        internalType: "struct IVault.PoolBalanceOp[]",
        name: "ops",
        type: "tuple[]",
      },
    ],
    name: "managePoolBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "enum IVault.UserBalanceOpKind",
            name: "kind",
            type: "uint8",
          },
          { internalType: "contract IAsset", name: "asset", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "address", name: "sender", type: "address" },
          {
            internalType: "address payable",
            name: "recipient",
            type: "address",
          },
        ],
        internalType: "struct IVault.UserBalanceOp[]",
        name: "ops",
        type: "tuple[]",
      },
    ],
    name: "manageUserBalance",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "enum IVault.SwapKind", name: "kind", type: "uint8" },
      {
        components: [
          { internalType: "bytes32", name: "poolId", type: "bytes32" },
          { internalType: "uint256", name: "assetInIndex", type: "uint256" },
          { internalType: "uint256", name: "assetOutIndex", type: "uint256" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "bytes", name: "userData", type: "bytes" },
        ],
        internalType: "struct IVault.BatchSwapStep[]",
        name: "swaps",
        type: "tuple[]",
      },
      { internalType: "contract IAsset[]", name: "assets", type: "address[]" },
      {
        components: [
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "bool", name: "fromInternalBalance", type: "bool" },
          {
            internalType: "address payable",
            name: "recipient",
            type: "address",
          },
          { internalType: "bool", name: "toInternalBalance", type: "bool" },
        ],
        internalType: "struct IVault.FundManagement",
        name: "funds",
        type: "tuple",
      },
    ],
    name: "queryBatchSwap",
    outputs: [{ internalType: "int256[]", name: "", type: "int256[]" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum IVault.PoolSpecialization",
        name: "specialization",
        type: "uint8",
      },
    ],
    name: "registerPool",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "poolId", type: "bytes32" },
      { internalType: "contract IERC20[]", name: "tokens", type: "address[]" },
      { internalType: "address[]", name: "assetManagers", type: "address[]" },
    ],
    name: "registerTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IAuthorizer",
        name: "newAuthorizer",
        type: "address",
      },
    ],
    name: "setAuthorizer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bool", name: "paused", type: "bool" }],
    name: "setPaused",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "relayer", type: "address" },
      { internalType: "bool", name: "approved", type: "bool" },
    ],
    name: "setRelayerApproval",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "bytes32", name: "poolId", type: "bytes32" },
          { internalType: "enum IVault.SwapKind", name: "kind", type: "uint8" },
          { internalType: "contract IAsset", name: "assetIn", type: "address" },
          {
            internalType: "contract IAsset",
            name: "assetOut",
            type: "address",
          },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "bytes", name: "userData", type: "bytes" },
        ],
        internalType: "struct IVault.SingleSwap",
        name: "singleSwap",
        type: "tuple",
      },
      {
        components: [
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "bool", name: "fromInternalBalance", type: "bool" },
          {
            internalType: "address payable",
            name: "recipient",
            type: "address",
          },
          { internalType: "bool", name: "toInternalBalance", type: "bool" },
        ],
        internalType: "struct IVault.FundManagement",
        name: "funds",
        type: "tuple",
      },
      { internalType: "uint256", name: "limit", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swap",
    outputs: [
      { internalType: "uint256", name: "amountCalculated", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];

const bptABI = [
  {
    inputs: [
      { internalType: "contract IVault", name: "vault", type: "address" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "contract IERC20[]", name: "tokens", type: "address[]" },
      {
        internalType: "uint256[]",
        name: "normalizedWeights",
        type: "uint256[]",
      },
      { internalType: "uint256", name: "swapFeePercentage", type: "uint256" },
      { internalType: "uint256", name: "pauseWindowDuration", type: "uint256" },
      {
        internalType: "uint256",
        name: "bufferPeriodDuration",
        type: "uint256",
      },
      { internalType: "address", name: "owner", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "bool", name: "paused", type: "bool" },
    ],
    name: "PausedStateChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "swapFeePercentage",
        type: "uint256",
      },
    ],
    name: "SwapFeePercentageChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "decreaseApproval",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "selector", type: "bytes4" }],
    name: "getActionId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAuthorizer",
    outputs: [
      { internalType: "contract IAuthorizer", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getInvariant",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getLastInvariant",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getNormalizedWeights",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getOwner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPausedState",
    outputs: [
      { internalType: "bool", name: "paused", type: "bool" },
      { internalType: "uint256", name: "pauseWindowEndTime", type: "uint256" },
      { internalType: "uint256", name: "bufferPeriodEndTime", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPoolId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSwapFeePercentage",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getVault",
    outputs: [{ internalType: "contract IVault", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "increaseApproval",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "poolId", type: "bytes32" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256[]", name: "balances", type: "uint256[]" },
      { internalType: "uint256", name: "lastChangeBlock", type: "uint256" },
      {
        internalType: "uint256",
        name: "protocolSwapFeePercentage",
        type: "uint256",
      },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "onExitPool",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "poolId", type: "bytes32" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256[]", name: "balances", type: "uint256[]" },
      { internalType: "uint256", name: "lastChangeBlock", type: "uint256" },
      {
        internalType: "uint256",
        name: "protocolSwapFeePercentage",
        type: "uint256",
      },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "onJoinPool",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "enum IVault.SwapKind", name: "kind", type: "uint8" },
          { internalType: "contract IERC20", name: "tokenIn", type: "address" },
          {
            internalType: "contract IERC20",
            name: "tokenOut",
            type: "address",
          },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "bytes32", name: "poolId", type: "bytes32" },
          { internalType: "uint256", name: "lastChangeBlock", type: "uint256" },
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "bytes", name: "userData", type: "bytes" },
        ],
        internalType: "struct IPoolSwapStructs.SwapRequest",
        name: "request",
        type: "tuple",
      },
      { internalType: "uint256", name: "balanceTokenIn", type: "uint256" },
      { internalType: "uint256", name: "balanceTokenOut", type: "uint256" },
    ],
    name: "onSwap",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "poolId", type: "bytes32" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256[]", name: "balances", type: "uint256[]" },
      { internalType: "uint256", name: "lastChangeBlock", type: "uint256" },
      {
        internalType: "uint256",
        name: "protocolSwapFeePercentage",
        type: "uint256",
      },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "queryExit",
    outputs: [
      { internalType: "uint256", name: "bptIn", type: "uint256" },
      { internalType: "uint256[]", name: "amountsOut", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "poolId", type: "bytes32" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256[]", name: "balances", type: "uint256[]" },
      { internalType: "uint256", name: "lastChangeBlock", type: "uint256" },
      {
        internalType: "uint256",
        name: "protocolSwapFeePercentage",
        type: "uint256",
      },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "queryJoin",
    outputs: [
      { internalType: "uint256", name: "bptOut", type: "uint256" },
      { internalType: "uint256[]", name: "amountsIn", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bool", name: "paused", type: "bool" }],
    name: "setPaused",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "swapFeePercentage", type: "uint256" },
    ],
    name: "setSwapFeePercentage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Initialize Web3 with your Ethereum node provider
const web3 = new Web3(
  "wss://mainnet.infura.io/ws/v3/c77020f1ad294f6a95b4e1203ffbe3ba"
);

function delay(ms = 2000) {
  console.log(`Adding delay of ${ms / 1000} seconds`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Replace with your Pool ID and Contract Address
const poolId =
  "0x27c9f71cc31464b906e0006d4fcbc8900f48f15f00020000000000000000010f";
const contractAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
const bptAddress = "0x27C9f71cC31464B906E0006d4FcBC8900F48f15f";
const startBlockNumber = 17417988; // June 28, 2023
const blockInOneDay = 7200; // 15 seconds per block
const lastBlockNumber = 18281988;
// Create a contract instance
const contract = new web3.eth.Contract(contractABI, contractAddress);
const bpt = new web3.eth.Contract(
  bptABI,
  "0x27C9f71cC31464B906E0006d4FcBC8900F48f15f"
);

const encodedDataGetPool = contract.methods.getPoolTokens(poolId).encodeABI();
const encodedDataBalance = bpt.methods.totalSupply().encodeABI();

const simulateGetBalancesAndBptSupply =
  (encodedInputGetBalances, encodedInputBptSupply) => async (blockNumber) => {
    // assuming environment variables TENDERLY_USER, TENDERLY_PROJECT and TENDERLY_ACCESS_KEY are set
    // https://docs.tenderly.co/other/platform-access/how-to-find-the-project-slug-username-and-organization-name
    // https://docs.tenderly.co/other/platform-access/how-to-generate-api-access-tokens
    const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } =
      process.env;

    console.log(`Simulating Transaction at block number: ${blockNumber}`);

    const respGetBalances = await axios.post(
      `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`,
      // the transaction
      {
        // Simulation configuration
        save: false, // if true simulation is saved and shows up in the dashboard
        save_if_fails: true, // if true, reverting simulations show up in the dashboard
        simulation_type: "full", // full or quick (full is default)

        // network to simulate on
        network_id: "1",
        // simulate transaction at this (historical) block number
        block_number: blockNumber,
        // simulate transaction at this index within the (historical) block
        transaction_index: 1,

        /* Standard EVM Transaction object */
        from: "0x0000000000000000000000000000000000000000",
        input: encodedInputGetBalances,
        to: contractAddress,
        gas: 886400,
        gas_price: "300000000000",
        value: "0",
        access_list: [],
        generate_access_list: true,
      },
      {
        headers: {
          "X-Access-Key": TENDERLY_ACCESS_KEY,
        },
      }
    );

    // access the transaction object
    const transactionGetBalances = respGetBalances.data.transaction;

    // access the transaction call trace
    const callTraceGetBalances =
      transactionGetBalances.transaction_info.call_trace;

    console.log(
      `Simulated Token Balances Call info: hash: ${transactionGetBalances.hash} block number: ${transactionGetBalances.block_number}`
    );

    const decodedParamsBalances = web3.eth.abi.decodeParameters(
      [
        {
          internalType: "contract IERC20[]",
          name: "tokens",
          type: "address[]",
        },
        { internalType: "uint256[]", name: "balances", type: "uint256[]" },
        { internalType: "uint256", name: "lastChangeBlock", type: "uint256" },
      ],
      callTraceGetBalances.output
    );

    await delay(5000);

    const respBptBalance = await axios.post(
      `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`,
      // the transaction
      {
        // Simulation configuration
        save: false, // if true simulation is saved and shows up in the dashboard
        save_if_fails: true, // if true, reverting simulations show up in the dashboard
        simulation_type: "full", // full or quick (full is default)

        // network to simulate on
        network_id: "1",
        // simulate transaction at this (historical) block number
        block_number: blockNumber,
        // simulate transaction at this index within the (historical) block
        transaction_index: 1,

        /* Standard EVM Transaction object */
        from: "0x0000000000000000000000000000000000000000",
        input: encodedInputBptSupply,
        to: bptAddress,
        gas: 886400,
        gas_price: "300000000000",
        value: "0",
        access_list: [],
        generate_access_list: true,
      },
      {
        headers: {
          "X-Access-Key": TENDERLY_ACCESS_KEY,
        },
      }
    );

    // access the transaction object
    const transactionBptBalance = respBptBalance.data.transaction;

    // access the transaction call trace
    const callTraceBptBalance =
      transactionBptBalance.transaction_info.call_trace;

    console.log(
      `Simulated BPT total supply info: hash: ${transactionBptBalance.hash} block number: ${transactionBptBalance.block_number}`
    );

    const decodedParamsSupply = web3.eth.abi.decodeParameters(
      [{ internalType: "uint256", name: "supply", type: "uint256" }],
      callTraceBptBalance.output
    );

    return {
      balances: {
        d2d: decodedParamsBalances.balances[0],
        usdc: decodedParamsBalances.balances[1],
      },
      bptSupply: decodedParamsSupply.supply,
    };
  };
const getBalancesAndBptSupply = simulateGetBalancesAndBptSupply(
  encodedDataGetPool,
  encodedDataBalance
);

// blocknumber,timestamp,poolid,liquidityprovider,token1,tokenout,token1delta,token2delta,protocolfeetoken1,protocolfeetoken2
const csvWriterPoolBalance = createCsvWriter({
  path: "./poolBalance.csv",
  header: [
    { id: "blockNumber", title: "blocknumber" },
    { id: "timestamp", title: "timestamp" },
    { id: "poolId", title: "poolid" },
    { id: "token1", title: "token1" },
    { id: "token2", title: "token2" },
    { id: "token1Weights", title: "token1Weights" },
    { id: "token2Weights", title: "token2Weights" },
    { id: "token1Address", title: "token1Address" },
    { id: "token2Address", title: "token2Address" },
    { id: "toke1Balance", title: "toke1Balance" },
    { id: "token2Balance", title: "token2Balance" },
    { id: "bptBalance", title: "bptBalance" },
  ],
});

async function collectPoolBalances(
  startBlockNumber,
  startBlockNumber,
  lastBlockNumber,
  blockInOneDay
) {
  const data = [];
  for (
    let currentBlockNumber = startBlockNumber;
    currentBlockNumber < lastBlockNumber;
    currentBlockNumber = currentBlockNumber + blockInOneDay
  ) {
    let dataOutput;
    const blockDetails = await web3.eth.getBlock(currentBlockNumber);
    const blockTimestamp = blockDetails.timestamp;
    try {
      dataOutput = await getBalancesAndBptSupply(currentBlockNumber);
      await delay(10000);
    } catch (e) {
      dataOutput = {
        balances: {
          usdc: "0",
          d2d: "0",
        },
        supply: "0",
      };
      console.log("Failed request at Block Number", currentBlockNumber);
      console.log(e);
    }

    const rowData = {
      blockNumber: currentBlockNumber,
      timestamp: blockTimestamp,
      poolId: poolId,
      token1: "D2D",
      token2: "USDC",
      token1Address: "0x43D4A3cd90ddD2F8f4f693170C9c8098163502ad",
      token2Address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      token1Weights: "80",
      token2Weights: "20",
      toke1Balance: dataOutput.balances.d2d,
      token2Balance: dataOutput.balances.usdc,
      bptBalance: dataOutput.bptSupply,
    };
    data.push(rowData);
    console.log(`Here's the data:`, rowData);
    console.log(
      `Successfully queried data at BlockNumber: ${currentBlockNumber} and Timestamp ${blockDetails.timestamp}`
    );
  }
  csvWriterPoolBalance.writeRecords(data);
  return "Success";
}
collectPoolBalances(
  startBlockNumber,
  startBlockNumber,
  lastBlockNumber,
  blockInOneDay
)
  .then(console.log)
  .catch(console.log);
