const Web3 = require("web3");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const tokens = require("./tokens.js");

const axios = require("axios");
require("dotenv").config();

const csvWriter = createCsvWriter({
  path: "./maxBorrowable.csv",
  header: [
    { id: "blockNumber", title: "blockNumber" },
    { id: "timestamp", title: "timestamp" },
    { id: "collateral", title: "collateral" },
    { id: "bands", title: "bands" },
    { id: "maxBorrowable", title: "maxborrowable" },
    { id: "collateralToken", title: "collateraltoken" },
    { id: "borrowableToken", title: "borrowabletoken" },
  ],
});

const controller_abi = [
  {
    name: "UserState",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "collateral", type: "uint256", indexed: false },
      { name: "debt", type: "uint256", indexed: false },
      { name: "n1", type: "int256", indexed: false },
      { name: "n2", type: "int256", indexed: false },
      { name: "liquidation_discount", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "Borrow",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "collateral_increase", type: "uint256", indexed: false },
      { name: "loan_increase", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "Repay",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "collateral_decrease", type: "uint256", indexed: false },
      { name: "loan_decrease", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "RemoveCollateral",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "collateral_decrease", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "Liquidate",
    inputs: [
      { name: "liquidator", type: "address", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "collateral_received", type: "uint256", indexed: false },
      { name: "stablecoin_received", type: "uint256", indexed: false },
      { name: "debt", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "SetMonetaryPolicy",
    inputs: [{ name: "monetary_policy", type: "address", indexed: false }],
    anonymous: false,
    type: "event",
  },
  {
    name: "SetBorrowingDiscounts",
    inputs: [
      { name: "loan_discount", type: "uint256", indexed: false },
      { name: "liquidation_discount", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "CollectFees",
    inputs: [
      { name: "amount", type: "uint256", indexed: false },
      { name: "new_supply", type: "uint256", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    stateMutability: "nonpayable",
    type: "constructor",
    inputs: [
      { name: "collateral_token", type: "address" },
      { name: "monetary_policy", type: "address" },
      { name: "loan_discount", type: "uint256" },
      { name: "liquidation_discount", type: "uint256" },
      { name: "amm", type: "address" },
    ],
    outputs: [],
  },
  { stateMutability: "payable", type: "fallback" },
  {
    stateMutability: "view",
    type: "function",
    name: "factory",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "amm",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "collateral_token",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "debt",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "loan_exists",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "total_debt",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "max_borrowable",
    inputs: [
      { name: "collateral", type: "uint256" },
      { name: "N", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "min_collateral",
    inputs: [
      { name: "debt", type: "uint256" },
      { name: "N", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "calculate_debt_n1",
    inputs: [
      { name: "collateral", type: "uint256" },
      { name: "debt", type: "uint256" },
      { name: "N", type: "uint256" },
    ],
    outputs: [{ name: "", type: "int256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "create_loan",
    inputs: [
      { name: "collateral", type: "uint256" },
      { name: "debt", type: "uint256" },
      { name: "N", type: "uint256" },
    ],
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "create_loan_extended",
    inputs: [
      { name: "collateral", type: "uint256" },
      { name: "debt", type: "uint256" },
      { name: "N", type: "uint256" },
      { name: "callbacker", type: "address" },
      { name: "callback_args", type: "uint256[]" },
    ],
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "add_collateral",
    inputs: [{ name: "collateral", type: "uint256" }],
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "add_collateral",
    inputs: [
      { name: "collateral", type: "uint256" },
      { name: "_for", type: "address" },
    ],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "remove_collateral",
    inputs: [{ name: "collateral", type: "uint256" }],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "remove_collateral",
    inputs: [
      { name: "collateral", type: "uint256" },
      { name: "use_eth", type: "bool" },
    ],
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "borrow_more",
    inputs: [
      { name: "collateral", type: "uint256" },
      { name: "debt", type: "uint256" },
    ],
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "repay",
    inputs: [{ name: "_d_debt", type: "uint256" }],
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "repay",
    inputs: [
      { name: "_d_debt", type: "uint256" },
      { name: "_for", type: "address" },
    ],
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "repay",
    inputs: [
      { name: "_d_debt", type: "uint256" },
      { name: "_for", type: "address" },
      { name: "max_active_band", type: "int256" },
    ],
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    name: "repay",
    inputs: [
      { name: "_d_debt", type: "uint256" },
      { name: "_for", type: "address" },
      { name: "max_active_band", type: "int256" },
      { name: "use_eth", type: "bool" },
    ],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "repay_extended",
    inputs: [
      { name: "callbacker", type: "address" },
      { name: "callback_args", type: "uint256[]" },
    ],
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "health_calculator",
    inputs: [
      { name: "user", type: "address" },
      { name: "d_collateral", type: "int256" },
      { name: "d_debt", type: "int256" },
      { name: "full", type: "bool" },
    ],
    outputs: [{ name: "", type: "int256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "health_calculator",
    inputs: [
      { name: "user", type: "address" },
      { name: "d_collateral", type: "int256" },
      { name: "d_debt", type: "int256" },
      { name: "full", type: "bool" },
      { name: "N", type: "uint256" },
    ],
    outputs: [{ name: "", type: "int256" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "liquidate",
    inputs: [
      { name: "user", type: "address" },
      { name: "min_x", type: "uint256" },
    ],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "liquidate",
    inputs: [
      { name: "user", type: "address" },
      { name: "min_x", type: "uint256" },
      { name: "use_eth", type: "bool" },
    ],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "liquidate_extended",
    inputs: [
      { name: "user", type: "address" },
      { name: "min_x", type: "uint256" },
      { name: "frac", type: "uint256" },
      { name: "use_eth", type: "bool" },
      { name: "callbacker", type: "address" },
      { name: "callback_args", type: "uint256[]" },
    ],
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "tokens_to_liquidate",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "tokens_to_liquidate",
    inputs: [
      { name: "user", type: "address" },
      { name: "frac", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "health",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "int256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "health",
    inputs: [
      { name: "user", type: "address" },
      { name: "full", type: "bool" },
    ],
    outputs: [{ name: "", type: "int256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "users_to_liquidate",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "user", type: "address" },
          { name: "x", type: "uint256" },
          { name: "y", type: "uint256" },
          { name: "debt", type: "uint256" },
          { name: "health", type: "int256" },
        ],
      },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "users_to_liquidate",
    inputs: [{ name: "_from", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "user", type: "address" },
          { name: "x", type: "uint256" },
          { name: "y", type: "uint256" },
          { name: "debt", type: "uint256" },
          { name: "health", type: "int256" },
        ],
      },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "users_to_liquidate",
    inputs: [
      { name: "_from", type: "uint256" },
      { name: "_limit", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "user", type: "address" },
          { name: "x", type: "uint256" },
          { name: "y", type: "uint256" },
          { name: "debt", type: "uint256" },
          { name: "health", type: "int256" },
        ],
      },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "amm_price",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "user_prices",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[2]" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "user_state",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[4]" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_amm_fee",
    inputs: [{ name: "fee", type: "uint256" }],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_amm_admin_fee",
    inputs: [{ name: "fee", type: "uint256" }],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_monetary_policy",
    inputs: [{ name: "monetary_policy", type: "address" }],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_borrowing_discounts",
    inputs: [
      { name: "loan_discount", type: "uint256" },
      { name: "liquidation_discount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "set_callback",
    inputs: [{ name: "cb", type: "address" }],
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "admin_fees",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    name: "collect_fees",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "liquidation_discounts",
    inputs: [{ name: "arg0", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "loans",
    inputs: [{ name: "arg0", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "loan_ix",
    inputs: [{ name: "arg0", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "n_loans",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "minted",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "redeemed",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "monetary_policy",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "liquidation_discount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    name: "loan_discount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
];

const controller_address = "0x100dAa78fC509Db39Ef7D04DE0c1ABD299f4C6CE";

// TX in question: https://dashboard.tenderly.co/nenad/observer/tx/mainnet/0xe165a7a77aa8973ff167f70b3ecb95cce6a6c5b1350e22176ed5c0784091daa4

const web3 = new Web3(
  "https://mainnet.gateway.tenderly.co/APIg5HCXyFWMLmUZY2gpY"
);
const contract = new web3.eth.Contract(controller_abi, controller_address);
const collateralAmount = "1000000000000000000";
const bands = 10;
const startBlockNumber = 17417988; // June 28, 2023
const blockInOneDay = 7200; // 15 seconds per block
const lastBlockNumber = 18281988;

const simulateMaxBorrowable = (encodedInput) => async (blockNumber) => {
  // assuming environment variables TENDERLY_USER, TENDERLY_PROJECT and TENDERLY_ACCESS_KEY are set
  // https://docs.tenderly.co/other/platform-access/how-to-find-the-project-slug-username-and-organization-name
  // https://docs.tenderly.co/other/platform-access/how-to-generate-api-access-tokens
  const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = process.env;

  console.log(`Simulating Transaction at block number: ${blockNumber}`);

  const resp = await axios.post(
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
      from: "0x7a16fF8270133F063aAb6C9977183D9e72835428",
      input: encodedInput,
      to: controller_address,
      gas: 13886400,
      gas_price: "32909736476",
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
  const transaction = resp.data.transaction;

  // access the transaction call trace
  const callTrace = transaction.transaction_info.call_trace;

  console.log(
    `Simulated transaction info: hash: ${transaction.hash} block number: ${transaction.block_number}`
  );

  const maxBorrowableAmount = web3.utils.BN(callTrace.output);
  const maxBorrowableAmountStr = maxBorrowableAmount.toString();
  return maxBorrowableAmountStr;
};

function delay(ms=2000) {
  console.log(`Adding delay of ${ms/1000} seconds`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function collectData(startBlockNumber, collateral, bands, startBlockNumber, lastBlockNumber, blockInOneDay) {
  const encodedInput = contract.methods.max_borrowable(collateralAmount,bands).encodeABI();
  console.log("Encoded Data: ",encodedInput);
  const simulate = simulateMaxBorrowable(encodedInput);
  const data = [];
  for(let currentBlockNumber = startBlockNumber; currentBlockNumber < lastBlockNumber; currentBlockNumber = currentBlockNumber + blockInOneDay) {
    let maxBorrowableAmountStr;
    const blockDetails = await web3.eth.getBlock(currentBlockNumber);
    const blockTimestamp = blockDetails.timestamp;
    try{
      maxBorrowableAmountStr = await simulate(currentBlockNumber);
      await delay(10000);
    } catch (e) {
      maxBorrowableAmountStr = "0";
      console.log("Failed request at Block Number", currentBlockNumber);
    }
    console.log(`Max Borrowable at BlockNumber: ${currentBlockNumber} and Timestamp ${blockDetails.timestamp}: `,maxBorrowableAmountStr);
    data.push({
      blockNumber: currentBlockNumber,
      timestamp: blockTimestamp,
      collateral: collateral,
      bands: bands,
      maxBorrowable: maxBorrowableAmountStr,
      collateralToken: tokens.WSTETH,
      borrowableToken: tokens.CRVUSD,
    });
  }
  csvWriter.writeRecords(data);
  return "Success";
}

collectData(startBlockNumber, collateralAmount, bands, startBlockNumber, lastBlockNumber, blockInOneDay).then(console.log).catch(console.log);
