# SupremeDAO Leveraged Yield Farming Strategy Simulation

This repository contains the first milestone of SupremeDAO Leveraged Yield Farmig Stategy Simulation project [proposed by SupremeDAO to PowerPool](https://gov.powerpool.finance/t/approved-grant-to-daosim-systems-for-the-implementation-of-poweragent-in-their-new-project-supremedao/1946). 

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
3. [Features](#features)
4. [Visualization](#visualization)
5. [License](#license)

## Installation

Clone the repository and install the required packages:

```bash
git clone https://github.com/supremedao/Leverage-Simulation-PP.git
cd Leverage-Simulation-PP
pip install -r requirements.txt
```

## Usage

1. Start Jupyter Notebook: `jupyter notebook`
2. Open desired `simulation_model.ipynb`
4. To stop Jupyter Notebook, press `Ctrl + C` in the terminal.

## Features

- **Loan Creation**: Model the process of creating a `crvUSD` loan by depositing collateral and borrowing assets.
- **Asset Swapping**: Simulate swapping of `crvUSD` to `USDC` scenarios to provide liquidity on Balancer.
- **Staking**: Evaluate the process of staking assets on `Aura` to earn rewards over time.
- **Health Factor Analysis**: Compute and analyze the health factor of `crvUSD` position over time, considering different market conditions.
- **Reinvestment Strategies**: Simulate reinvestment strategies based on health factors and rewards.
- **Impermanent Loss Calculation**: Understand and quantify the impermanent loss associated with providing liquidity.
- **Profitability Analysis**: Analyze the profitability of positions, considering asset price changes, rewards, and impermanent loss.
- **Visualization**: Visualize the outcomes of the simulations using Matplotlib for better understanding and analysis.

## Visualization

The simulation framework provides various visualizations to understand the simulation outcomes using `matplotlib`:

- **Health Factor Over Time**: Visualize the risk profile of a position.
- **Rewards Over Time**: Insight into the earning potential of staking strategies.
- **Profitability of wstETH Position**: Visualize the profitability with and without considering rewards.
- **Impermanent Loss Over Time**: Visualize the impermanent loss when providing liquidity.
- **Adjusted Profitability with Impermanent Loss**: Profitability of positions with rewards and impermanent loss considerations.

## Visualization

This project is licensed under the GNU v3 License. See the `LICENSE.md` file for details.
